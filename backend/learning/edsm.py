"""
Evidence-Driven State Merging (EDSM) algorithm.
Selects state merges based on statistical evidence of shared future behaviors.
"""

from typing import List, Set, Dict, Tuple, Optional, Any
from backend.automata.dfa import DFA
from backend.learning.pta import PTA
from backend.learning.rpni import RPNI


class EDSM:
    def __init__(
        self,
        positive_examples: List[str],
        negative_examples: List[str],
        alphabet: List[str]
    ):
        self.pos = sorted(list(set(positive_examples)))
        self.neg = sorted(list(set(negative_examples)))
        self.alphabet = sorted(list(set(alphabet)))
        self.merge_history: List[Dict[str, Any]] = []

    def _score_merge(self, base_dfa: DFA, folded_dfa: DFA) -> Tuple[float, bool, Optional[str]]:
        """
        Evaluates evidence score for folded_dfa:
        Must reject all negatives (or returns -inf).
        Score is the compression benefit (number of reduced states + consistency).
        """
        for w in self.neg:
            if folded_dfa.accepts(w):
                return -1.0, False, w

        # All positive examples must remain accepted
        for w in self.pos:
            if not folded_dfa.accepts(w):
                return -1.0, False, f"Positive example '{w}' rejected"

        # Evidence score: state reduction + positive prefix alignment
        state_reduction = len(base_dfa.states) - len(folded_dfa.states)
        score = float(state_reduction * 10)
        return score, True, None

    def run(self) -> Tuple[DFA, List[Dict[str, Any]]]:
        pta = PTA(self.pos, set(self.alphabet))
        current_dfa = pta.to_dfa()
        rpni_helper = RPNI(self.pos, self.neg, self.alphabet)

        step_idx = 0
        while True:
            states_list = sorted(list(current_dfa.states))
            best_score = -1.0
            best_folded = None
            best_pair = None

            for i in range(len(states_list)):
                for j in range(i + 1, len(states_list)):
                    qi, qj = states_list[i], states_list[j]
                    folded = rpni_helper._fold(current_dfa, qi, qj)
                    if folded is None:
                        continue

                    score, valid, violator = self._score_merge(current_dfa, folded)
                    if valid and score > best_score:
                        best_score = score
                        best_folded = folded
                        best_pair = (qi, qj)

            if best_pair is not None and best_folded is not None and best_score >= 0:
                step_idx += 1
                qi, qj = best_pair
                self.merge_history.append({
                    "step": step_idx,
                    "state_kept": qi,
                    "state_merged": qj,
                    "status": "ACCEPTED",
                    "evidence_score": best_score,
                    "reason": f"EDSM chosen merge ({qi}, {qj}) with highest evidence score {best_score:.1f}.",
                    "remaining_states_count": len(best_folded.states)
                })
                current_dfa = best_folded
            else:
                break

        final_dfa = current_dfa.trim().rename_states("q")
        return final_dfa, self.merge_history
