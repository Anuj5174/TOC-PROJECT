"""
Regular Positive and Negative Inference (RPNI) algorithm.
Learns a regular language DFA from positive (S+) and negative (S-) samples
via Prefix Tree Acceptor (PTA) construction, state merging, and deterministic folding.
"""

from typing import List, Set, Dict, Tuple, Optional, Any
from copy import deepcopy
from collections import deque
from backend.automata.dfa import DFA
from backend.learning.pta import PTA


class RPNI:
    def __init__(
        self,
        positive_examples: List[str],
        negative_examples: List[str],
        alphabet: List[str],
        noise_tolerance: float = 0.0
    ):
        self.pos = sorted(list(set(positive_examples)))
        self.neg = sorted(list(set(negative_examples)))
        self.alphabet = sorted(list(set(alphabet)))
        self.noise_tolerance = noise_tolerance

        # Build initial PTA
        self.pta = PTA(self.pos, set(self.alphabet))
        self.merge_history: List[Dict[str, Any]] = []

    def _fold(self, dfa: DFA, q_keep: str, q_merge: str) -> Optional[DFA]:
        """
        Merges state q_merge into q_keep, and recursively folds non-deterministic
        branches to ensure determinism.
        Returns a new DFA, or None if a contradiction arises.
        """
        # Disjoint set / union-find
        parent: Dict[str, str] = {s: s for s in dfa.states}

        def find(u: str) -> str:
            if parent[u] != u:
                parent[u] = find(parent[u])
            return parent[u]

        def union(u: str, v: str):
            ru, rv = find(u), find(v)
            if ru != rv:
                parent[ru] = rv

        union(q_merge, q_keep)

        # Multi-graph transition representation before folding
        transitions: Dict[str, Dict[str, Set[str]]] = {s: {a: set() for a in self.alphabet} for s in dfa.states}
        for src, out in dfa.transitions.items():
            for a, tgt in out.items():
                transitions[src][a].add(tgt)

        # Queue of pairs that must be folded together
        queue = deque([(q_keep, q_merge)])

        while queue:
            s1, s2 = queue.popleft()
            r1, r2 = find(s1), find(s2)

            # For each symbol, inspect targets
            for a in self.alphabet:
                # Union of outgoing targets from both states
                targets = transitions[s1][a].union(transitions[s2][a])
                if len(targets) > 1:
                    # Non-deterministic split: fold all targets together
                    t_list = list(targets)
                    base_target = t_list[0]
                    for other_target in t_list[1:]:
                        if find(base_target) != find(other_target):
                            union(other_target, base_target)
                            queue.append((base_target, other_target))

        # Reconstruct deterministic transitions under equivalence classes
        all_classes: Dict[str, Set[str]] = {}
        for s in dfa.states:
            r = find(s)
            if r not in all_classes:
                all_classes[r] = set()
            all_classes[r].add(s)

        new_states = set(all_classes.keys())
        new_start = find(dfa.start_state)
        new_accepting = {find(s) for s in dfa.accepting_states}

        new_transitions: Dict[str, Dict[str, str]] = {s: {} for s in new_states}

        for rep, members in all_classes.items():
            for a in self.alphabet:
                # Find all outgoing targets for symbol 'a' from any member
                dest_classes = set()
                for m in members:
                    if a in dfa.transitions.get(m, {}):
                        dest_classes.add(find(dfa.transitions[m][a]))

                if len(dest_classes) > 1:
                    # Still non-deterministic (should not happen with complete queue folding)
                    rep_dest = list(dest_classes)[0]
                    new_transitions[rep][a] = rep_dest
                elif len(dest_classes) == 1:
                    new_transitions[rep][a] = list(dest_classes)[0]

        return DFA(
            states=new_states,
            alphabet=set(self.alphabet),
            transitions=new_transitions,
            start_state=new_start,
            accepting_states=new_accepting
        )

    def _is_compatible(self, candidate_dfa: DFA) -> Tuple[bool, int, Optional[str]]:
        """
        Checks whether candidate_dfa violates negative constraints S-.
        Returns (compatible_bool, num_negatives_accepted, first_violating_string).
        """
        if not self.neg:
            return True, 0, None

        neg_accepted = 0
        violator = None

        for w in self.neg:
            if candidate_dfa.accepts(w):
                neg_accepted += 1
                if violator is None:
                    violator = w

        violation_ratio = neg_accepted / len(self.neg) if self.neg else 0.0
        is_ok = violation_ratio <= self.noise_tolerance

        return is_ok, neg_accepted, violator

    def run(self) -> Tuple[DFA, List[Dict[str, Any]]]:
        """
        Executes RPNI state merging.
        Returns the learned DFA and the trace of all merge evaluations.
        """
        current_dfa = self.pta.to_dfa()
        
        # State order: prefix / canonical order
        ordered_states = list(self.pta.prefix_to_id.values())

        # Red states: confirmed; Blue states: candidates
        red_states: List[str] = [ordered_states[0]]  # start with root p0

        step_idx = 0

        # Scan ordered states
        for i in range(1, len(ordered_states)):
            qi = ordered_states[i]
            if qi not in current_dfa.states:
                continue

            merged = False
            # Attempt to merge qi into an existing red state qr
            for qr in red_states:
                if qr not in current_dfa.states:
                    continue

                step_idx += 1
                folded_dfa = self._fold(current_dfa, qr, qi)
                if folded_dfa is None:
                    continue

                compatible, neg_count, violator = self._is_compatible(folded_dfa)

                if compatible:
                    # Accept merge
                    self.merge_history.append({
                        "step": step_idx,
                        "state_kept": qr,
                        "state_merged": qi,
                        "status": "ACCEPTED",
                        "reason": f"Merged {qi} into {qr} successfully (0 negative conflicts)." if neg_count == 0 else f"Accepted with {neg_count} tolerated conflicts.",
                        "remaining_states_count": len(folded_dfa.states),
                        "conflicting_example": None
                    })
                    current_dfa = folded_dfa
                    merged = True
                    break
                else:
                    # Rollback merge
                    self.merge_history.append({
                        "step": step_idx,
                        "state_kept": qr,
                        "state_merged": qi,
                        "status": "REJECTED",
                        "reason": f"Merge produced inconsistent DFA: accepts negative example '{violator or 'ε'}'",
                        "remaining_states_count": len(current_dfa.states),
                        "conflicting_example": violator
                    })

            if not merged:
                # Promote qi to red states
                red_states.append(qi)

        final_dfa = current_dfa.trim().rename_states("q")
        return final_dfa, self.merge_history
