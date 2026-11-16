"""
FastAPI REST API endpoints for Automata Learning, Simulation, and Investigation.
Matches Problem 8 Objectives:
- Dataset generation over configurable alphabets
- DFA & NFA representations and string-acceptance simulation
- Automata inference (RPNI / EDSM)
- Visualizing states, transitions, accepting states, execution paths
- Measuring model accuracy, state count, and generalization on unseen strings
- Empirical studies on training quantity, diversity, and quality (noise)
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.automata.dfa import DFA
from backend.automata.nfa import NFA
from backend.datasets.benchmarks import list_benchmarks, get_benchmark, BENCHMARKS
from backend.datasets.generator import create_dataset
from backend.learning.pta import PTA
from backend.learning.rpni import RPNI
from backend.learning.edsm import EDSM
from backend.analysis.metrics import evaluate_model
from backend.analysis.noise_study import (
    run_quantity_experiment,
    run_noise_experiment,
    run_diversity_experiment
)

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
    algorithm: str = "rpni"  # "rpni" or "edsm"
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


class DiversityExperimentRequest(BaseModel):
    benchmark_id: str = "even_zeros"
    max_lengths: Optional[List[int]] = [3, 4, 5, 6, 7, 8, 9]
    train_size: int = 40
    test_size: int = 80
    repeats: int = 3


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

        # 2. Run selected inference algorithm
        history = []
        if req.algorithm.lower() == "rpni":
            learner = RPNI(pos, neg, alphabet, noise_tolerance=req.noise_tolerance)
            inferred_dfa, history = learner.run()
        elif req.algorithm.lower() == "edsm":
            learner = EDSM(pos, neg, alphabet)
            inferred_dfa, history = learner.run()
        else:
            raise HTTPException(status_code=400, detail=f"Unknown algorithm '{req.algorithm}'. Supported: 'rpni', 'edsm'.")

        # 3. Evaluation on unseen strings if test_set provided
        evaluation = None
        if req.test_set:
            evaluation = evaluate_model(inferred_dfa, req.test_set, ref_dfa)
        elif ref_dfa:
            evaluation = evaluate_model(inferred_dfa, [], ref_dfa)

        return {
            "inferred_dfa": inferred_dfa.to_dict(),
            "pta": pta_dict,
            "merge_history": history,
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
                transitions={},
                start_state=req.nfa_data["start_state"],
                accepting_states=set(req.nfa_data["accepting_states"])
            )
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


@router.post("/experiments/diversity")
def api_diversity_experiment(req: DiversityExperimentRequest):
    try:
        return run_diversity_experiment(
            benchmark_id=req.benchmark_id,
            max_lengths=req.max_lengths,
            train_size=req.train_size,
            test_size=req.test_size,
            repeats=req.repeats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
