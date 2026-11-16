"""
Evaluation metrics: Classification performance (Accuracy, Precision, Recall, F1, Confusion Matrix)
and Automata structural properties (State count, Transition count).
"""

from typing import List, Dict, Any, Optional
from backend.automata.dfa import DFA


def evaluate_model(
    dfa: DFA,
    test_set: List[Dict[str, Any]],
    reference_dfa: Optional[DFA] = None
) -> Dict[str, Any]:
    """
    Evaluates DFA against labeled test examples and compares structurally with reference_dfa.
    """
    tp = 0
    fp = 0
    tn = 0
    fn = 0

    detailed_predictions = []
    for item in test_set:
        w = item.get("raw_word", item.get("word", ""))
        true_label = bool(item.get("label", item.get("original_label", False)))
        pred_label = dfa.accepts(w)

        if true_label and pred_label:
            tp += 1
            pred_type = "TP"
        elif not true_label and pred_label:
            fp += 1
            pred_type = "FP"
        elif not true_label and not pred_label:
            tn += 1
            pred_type = "TN"
        else:
            fn += 1
            pred_type = "FN"

        detailed_predictions.append({
            "word": item.get("word", w),
            "raw_word": w,
            "true_label": true_label,
            "pred_label": pred_label,
            "prediction_type": pred_type,
            "correct": true_label == pred_label
        })

    total = len(test_set)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    structural_data = {
        "state_count": len(dfa.states),
        "transition_count": sum(len(out) for out in dfa.transitions.values()),
        "accepting_states_count": len(dfa.accepting_states)
    }

    if reference_dfa is not None:
        structural_data["reference_state_count"] = len(reference_dfa.states)
        structural_data["state_ratio"] = round(len(dfa.states) / len(reference_dfa.states), 2)

    return {
        "metrics": {
            "total_samples": total,
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "tp": tp,
                "fp": fp,
                "tn": tn,
                "fn": fn
            }
        },
        "structural": structural_data,
        "predictions": detailed_predictions
    }
