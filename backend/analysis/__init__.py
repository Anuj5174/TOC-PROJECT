"""
Evaluation metrics and empirical studies on quantity, diversity, and noise.
"""

from backend.analysis.metrics import evaluate_model
from backend.analysis.noise_study import (
    run_quantity_experiment,
    run_noise_experiment,
    run_diversity_experiment
)

__all__ = [
    "evaluate_model",
    "run_quantity_experiment",
    "run_noise_experiment",
    "run_diversity_experiment"
]
