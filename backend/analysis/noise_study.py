"""
Experimental study on how training quantity, diversity, and label noise (quality)
affect the inferred DFA model.
"""

from typing import List, Dict, Any, Optional
from backend.datasets.benchmarks import get_benchmark
from backend.datasets.generator import create_dataset
from backend.learning.rpni import RPNI
from backend.analysis.metrics import evaluate_model


def run_quantity_experiment(
    benchmark_id: str,
    sample_sizes: Optional[List[int]] = None,
    test_size: int = 80,
    noise_rate: float = 0.0,
    repeats: int = 3
) -> List[Dict[str, Any]]:
    """
    Measures generalization accuracy and state count as training size (quantity) increases.
    """
    if sample_sizes is None:
        sample_sizes = [6, 12, 20, 35, 50, 75, 100]

    bench = get_benchmark(benchmark_id)
    ref_dfa = bench.reference_dfa

    results = []

    for n in sample_sizes:
        accs = []
        state_counts = []

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

        if accs:
            mean_acc = sum(accs) / len(accs)
            mean_states = sum(state_counts) / len(state_counts)
        else:
            mean_acc = 0.0
            mean_states = 0.0

        results.append({
            "sample_size": n,
            "mean_accuracy": round(mean_acc, 4),
            "mean_state_count": round(mean_states, 2),
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
    Measures accuracy degradation and state complexity explosion as label noise (quality) increases.
    """
    if noise_levels is None:
        noise_levels = [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30]

    bench = get_benchmark(benchmark_id)
    ref_dfa = bench.reference_dfa

    results = []

    for noise in noise_levels:
        accs = []
        state_counts = []

        for r in range(repeats):
            seed = 2000 + int(noise * 100) * 13 + r * 29
            ds = create_dataset(
                benchmark_id=benchmark_id,
                train_size=train_size,
                test_size=test_size,
                noise_rate=noise,
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

        if accs:
            mean_acc = sum(accs) / len(accs)
            mean_states = sum(state_counts) / len(state_counts)
        else:
            mean_acc = 0.0
            mean_states = 0.0

        results.append({
            "noise_level": noise,
            "mean_accuracy": round(mean_acc, 4),
            "mean_state_count": round(mean_states, 2),
            "reference_states": len(ref_dfa.states)
        })

    return results


def run_diversity_experiment(
    benchmark_id: str,
    max_lengths: Optional[List[int]] = None,
    train_size: int = 40,
    test_size: int = 80,
    repeats: int = 3
) -> List[Dict[str, Any]]:
    """
    Measures how training string diversity (varying maximum string length) affects learning.
    """
    if max_lengths is None:
        max_lengths = [3, 4, 5, 6, 7, 8, 9]

    bench = get_benchmark(benchmark_id)
    ref_dfa = bench.reference_dfa

    results = []

    for max_l in max_lengths:
        accs = []
        state_counts = []

        for r in range(repeats):
            seed = 3000 + max_l * 19 + r * 37
            ds = create_dataset(
                benchmark_id=benchmark_id,
                train_size=train_size,
                test_size=test_size,
                max_len=max_l,
                noise_rate=0.0,
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

        if accs:
            mean_acc = sum(accs) / len(accs)
            mean_states = sum(state_counts) / len(state_counts)
        else:
            mean_acc = 0.0
            mean_states = 0.0

        results.append({
            "max_length": max_l,
            "mean_accuracy": round(mean_acc, 4),
            "mean_state_count": round(mean_states, 2),
            "reference_states": len(ref_dfa.states)
        })

    return results
