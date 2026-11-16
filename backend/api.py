"""
FastAPI REST API endpoints for Automata Learning, Simulation, and Investigation.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.automata.dfa import DFA
from backend.automata.nfa import NFA
from backend.automata.minimization import minimize_dfa_table_filling
from backend.automata.equivalence import check_dfa_equivalence
from backend.datasets.benchmarks import list_benchmarks, get_benchmark, BENCHMARKS
from backend.datasets.generator import create_dataset
from backend.learning.pta import PTA
from backend.learning.rpni import RPNI
from backend.learning.edsm import EDSM
from backend.learning.active_learning import AngluinLStar
from backend.analysis.metrics import evaluate_model
from backend.analysis.noise_study import run_quantity_experiment, run_noise_experiment
from backend.analysis.clustering import cluster_strings

router = APIRouter(prefix="/api")


# Request & Response Schemas
class DatasetGenerateRequest(BaseModel):
    benchmark_id: Optional[str] = "even_zeros"
    alphabet: Optional[List[str]] = None
    train_size: int = 40
    test_size: int = 60
    max_len: int = 7
    noise_rate: float = 0.0
    seed: int = 42


class LearnRequest(BaseModel):
    algorithm: str = "rpni"  # "rpni", "edsm", "lstar"
    benchmark_id: Optional[str] = None
    alphabet: List[str]
    positive_examples: List[str]
    negative_examples: List[str]
    noise_tolerance: float = 0.0
    test_set: Optional[List[Dict[str, Any]]] = None


class SimulateRequest(BaseModel):
    dfa_data: Optional[Dict[str, Any]] = None
    nfa_data: Optional[Dict[str, Any]] = None
    word: str = ""


class QuantityExperimentRequest(BaseModel):
    benchmark_id: str = "even_zeros"
    sample_sizes: Optional[List[int]] = [6, 12, 20, 35, 50, 75, 100]
    test_size: int = 80
    noise_rate: float = 0.0
    repeats: int = 3


class NoiseExperimentRequest(BaseModel):
    benchmark_id: str = "even_zeros"
    noise_levels: Optional[List[float]] = [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
    train_size: int = 50
    test_size: int = 80
    repeats: int = 3


class ClusterRequest(BaseModel):
    strings_data: List[Dict[str, Any]]
    dfa_data: Optional[Dict[str, Any]] = None
    alphabet: Optional[List[str]] = None
    n_clusters: int = 2


# Endpoints
@router.get("/benchmarks")
def get_all_benchmarks():
    return list_benchmarks()


@router.get("/benchmarks/{benchmark_id}")
def get_benchmark_details(benchmark_id: str):
    try:
        b = get_benchmark(benchmark_id)
        return {
            "id": b.id,
            "name": b.name,
            "alphabet": b.alphabet,
            "description": b.description,
            "formal_definition": b.formal_definition,
            "reference_dfa": b.reference_dfa.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/dataset/generate")
def api_generate_dataset(req: DatasetGenerateRequest):
    try:
        data = create_dataset(
            benchmark_id=req.benchmark_id,
            alphabet=req.alphabet,
            train_size=req.train_size,
            test_size=req.test_size,
            max_len=req.max_len,
            noise_rate=req.noise_rate,
            seed=req.seed
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/learn")
def api_learn_automaton(req: LearnRequest):
    try:
        pos = [w for w in req.positive_examples]
        neg = [w for w in req.negative_examples]
        alphabet = sorted(list(set(req.alphabet)))

        if not pos:
            raise HTTPException(status_code=400, detail="At least one positive example is required to build initial hypothesis.")

        ref_dfa = None
        if req.benchmark_id and req.benchmark_id in BENCHMARKS:
            ref_dfa = BENCHMARKS[req.benchmark_id].reference_dfa

        # 1. PTA construction
        pta_obj = PTA(pos, set(alphabet))
        pta_dict = pta_obj.to_dict()

        # 2. Run selected algorithm
        history = []
        lstar_table_history = []
        if req.algorithm.lower() == "rpni":
            learner = RPNI(pos, neg, alphabet, noise_tolerance=req.noise_tolerance)
            raw_inferred_dfa, history = learner.run()
        elif req.algorithm.lower() == "edsm":
            learner = EDSM(pos, neg, alphabet)
            raw_inferred_dfa, history = learner.run()
        elif req.algorithm.lower() == "lstar":
            if not req.benchmark_id or req.benchmark_id not in BENCHMARKS:
                raise HTTPException(status_code=400, detail="Active learning (L*) requires an oracle benchmark.")
            bench = BENCHMARKS[req.benchmark_id]
            lstar = AngluinLStar(alphabet, bench.accepts, bench.reference_dfa)
            raw_inferred_dfa, lstar_history = lstar.run()
            lstar_table_history = lstar_history
        else:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm '{req.algorithm}'.")

        # 3. Minimization via Myhill-Nerode Table-Filling
        minimized_dfa, min_viz = minimize_dfa_table_filling(raw_inferred_dfa)

        # 4. Evaluation if test_set provided
        evaluation = None
        if req.test_set:
            evaluation = evaluate_model(minimized_dfa, req.test_set, ref_dfa)
        elif ref_dfa:
            evaluation = evaluate_model(minimized_dfa, [], ref_dfa)

        return {
            "inferred_dfa": raw_inferred_dfa.to_dict(),
            "minimized_dfa": minimized_dfa.to_dict(),
            "pta": pta_dict,
            "merge_history": history,
            "lstar_history": lstar_table_history,
            "minimization_details": min_viz,
            "evaluation": evaluation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate")
def api_simulate_string(req: SimulateRequest):
    try:
        if req.dfa_data:
            dfa = DFA.from_dict(req.dfa_data)
            return dfa.simulate(req.word)
        elif req.nfa_data:
            nfa = NFA(
                states=set(req.nfa_data["states"]),
                alphabet=set(req.nfa_data["alphabet"]),
                transitions={},  # populated below
                start_state=req.nfa_data["start_state"],
                accepting_states=set(req.nfa_data["accepting_states"])
            )
            # Reconstruct transitions
            for edge in req.nfa_data.get("transitions", []):
                u, v, lbl = edge["from"], edge["to"], edge["label"]
                if u not in nfa.transitions:
                    nfa.transitions[u] = {}
                if lbl not in nfa.transitions[u]:
                    nfa.transitions[u][lbl] = set()
                nfa.transitions[u][lbl].add(v)
            return nfa.simulate(req.word)
        else:
            raise HTTPException(status_code=400, detail="Provide dfa_data or nfa_data.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/experiments/quantity")
def api_quantity_experiment(req: QuantityExperimentRequest):
    try:
        return run_quantity_experiment(
            benchmark_id=req.benchmark_id,
            sample_sizes=req.sample_sizes,
            test_size=req.test_size,
            noise_rate=req.noise_rate,
            repeats=req.repeats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/experiments/noise")
def api_noise_experiment(req: NoiseExperimentRequest):
    try:
        return run_noise_experiment(
            benchmark_id=req.benchmark_id,
            noise_levels=req.noise_levels,
            train_size=req.train_size,
            test_size=req.test_size,
            repeats=req.repeats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cluster")
def api_cluster_strings(req: ClusterRequest):
    try:
        dfa = DFA.from_dict(req.dfa_data) if req.dfa_data else None
        return cluster_strings(
            strings_data=req.strings_data,
            dfa=dfa,
            alphabet=req.alphabet,
            n_clusters=req.n_clusters
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
