"""
Experimental study on how training quantity, diversity, and label noise
affect the inferred DFA model.
"""

from typing import List, Dict, Any, Optional
from backend.datasets.benchmarks import get_benchmark, BenchmarkLanguage
from backend.datasets.generator import create_dataset, sample_regular_language, inject_noise
from backend.learning.rpni import RPNI
from backend.learning.edsm import EDSM
from backend.analysis.metrics import evaluate_model
from backend.automata.equivalence import check_dfa_equivalence


def run_quantity_experiment(
    benchmark_id: str,
    sample_sizes: Optional[List[int]] = None,
    test_size: int = 80,
    noise_rate: float = 0.0,
    repeats: int = 3
) -> List[Dict[str, Any]]:
    """
    Measures generalization accuracy and state count as training size increases.
    """
    if sample_sizes is None:
        sample_sizes = [6, 12, 20, 35, 50, 75, 100]

    bench = get_benchmark(benchmark_id)
    ref_dfa = bench.reference_dfa

    results = []

    for n in sample_sizes:
        accs = []
        state_counts = []
        equiv_counts = 0

        for r in range(repeats):
            seed = 1000 + n * 17 + r * 31
            ds = create_dataset(
                benchmark_id=benchmark_id,
                train_size=n,
                test_size=test_size,
                noise_rate=noise_rate,
                seed=seed
            )
            pos_train = [it["raw_word"] for it in ds["train"] if it["label"]]
            neg_train = [it["raw_word"] for it in ds["train"] if not it["label"]]

            if not pos_train:
                continue

            rpni = RPNI(pos_train, neg_train, bench.alphabet)
            inferred_dfa, _ = rpni.run()

            eval_res = evaluate_model(inferred_dfa, ds["test"], ref_dfa)
            accs.append(eval_res["metrics"]["accuracy"])
            state_counts.append(eval_res["structural"]["state_count"])
            if eval_res["equivalence"] and eval_res["equivalence"]["equivalent"]:
                equiv_counts += 1

        avg_acc = sum(accs) / len(accs) if accs else 0.0
        avg_states = sum(state_counts) / len(state_counts) if state_counts else 0.0

        results.append({
            "training_samples": n,
            "mean_accuracy": round(avg_acc, 4),
            "mean_state_count": round(avg_states, 2),
            "equivalence_rate": round(equiv_counts / repeats, 2),
            "reference_states": len(ref_dfa.states)
        })

    return results


def run_noise_experiment(
    benchmark_id: str,
    noise_levels: Optional[List[float]] = None,
    train_size: int = 50,
    test_size: int = 80,
    repeats: int = 3
) -> List[Dict[str, Any]]:
    """
    Measures the degradation in accuracy and state explosion under noisy labels.
    """
    if noise_levels is None:
        noise_levels = [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30]

    bench = get_benchmark(benchmark_id)
    ref_dfa = bench.reference_dfa

    results = []

    for nl in noise_levels:
        accs = []
        state_counts = []
        equiv_counts = 0

        for r in range(repeats):
            seed = 2000 + int(nl * 100) * 19 + r * 37
            ds = create_dataset(
                benchmark_id=benchmark_id,
                train_size=train_size,
                test_size=test_size,
                noise_rate=nl,
                seed=seed
            )
            pos_train = [it["raw_word"] for it in ds["train"] if it["label"]]
            neg_train = [it["raw_word"] for it in ds["train"] if not it["label"]]

            if not pos_train:
                continue

            # In noisy situations, enable slight tolerance in RPNI
            rpni = RPNI(pos_train, neg_train, bench.alphabet, noise_tolerance=nl * 0.7)
            inferred_dfa, _ = rpni.run()

            eval_res = evaluate_model(inferred_dfa, ds["test"], ref_dfa)
            accs.append(eval_res["metrics"]["accuracy"])
            state_counts.append(eval_res["structural"]["state_count"])
            if eval_res["equivalence"] and eval_res["equivalence"]["equivalent"]:
                equiv_counts += 1

        avg_acc = sum(accs) / len(accs) if accs else 0.0
        avg_states = sum(state_counts) / len(state_counts) if state_counts else 0.0

        results.append({
            "noise_rate": nl,
            "noise_percentage": f"{int(nl * 100)}%",
            "mean_accuracy": round(avg_acc, 4),
            "mean_state_count": round(avg_states, 2),
            "equivalence_rate": round(equiv_counts / repeats, 2),
            "reference_states": len(ref_dfa.states)
        })

    return results
