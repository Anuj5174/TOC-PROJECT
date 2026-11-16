"""
Angluin's L* Active Learning Algorithm with Observation Table.
Learns a minimal DFA using Membership Queries (MQ) and Equivalence Queries (EQ).
Includes complete observation table snapshots for educational exploration.
"""

from typing import List, Set, Dict, Tuple, Optional, Any, Callable
from collections import deque
from backend.automata.dfa import DFA
from backend.automata.equivalence import check_dfa_equivalence


class ObservationTable:
    def __init__(self, alphabet: List[str], oracle: Callable[[str], bool]):
        self.alphabet = sorted(list(set(alphabet)))
        self.oracle = oracle
        
        # S: prefixes (upper table)
        self.S: List[str] = [""]
        # E: suffixes (columns)
        self.E: List[str] = [""]
        
        # Table values: T[(prefix, suffix)] = bool
        self.T: Dict[Tuple[str, str], bool] = {}
        self.query_count = 0

    def query(self, prefix: str, suffix: str) -> bool:
        pair = (prefix, suffix)
        if pair not in self.T:
            word = prefix + suffix
            self.T[pair] = self.oracle(word)
            self.query_count += 1
        return self.T[pair]

    def fill_table(self):
        """Ensures all pairs in (S union S.Sigma) x E are populated."""
        all_prefixes = list(self.S)
        for s in self.S:
            for a in self.alphabet:
                all_prefixes.append(s + a)
        
        for p in all_prefixes:
            for e in self.E:
                self.query(p, e)

    def row(self, prefix: str) -> Tuple[bool, ...]:
        return tuple(self.query(prefix, e) for e in self.E)

    def get_boundary(self) -> List[str]:
        r"""Returns S . Sigma \ S (lower table rows)."""
        s_set = set(self.S)
        boundary = []
        for s in self.S:
            for a in self.alphabet:
                cand = s + a
                if cand not in s_set and cand not in boundary:
                    boundary.append(cand)
        return boundary

    def check_closed(self) -> Tuple[bool, Optional[str]]:
        """
        Table is closed if for every t in S.Sigma, there is some s in S with row(t) == row(s).
        Returns (is_closed, violating_prefix_t).
        """
        upper_rows = {self.row(s) for s in self.S}
        for t in self.get_boundary():
            if self.row(t) not in upper_rows:
                return False, t
        return True, None

    def check_consistent(self) -> Tuple[bool, Optional[str]]:
        """
        Table is consistent if whenever row(s1) == row(s2) for s1, s2 in S,
        row(s1.a) == row(s2.a) for all a in Sigma.
        Returns (is_consistent, new_distinguishing_suffix).
        """
        n = len(self.S)
        for i in range(n):
            for j in range(i + 1, n):
                s1, s2 = self.S[i], self.S[j]
                if self.row(s1) == self.row(s2):
                    for a in self.alphabet:
                        for idx, e in enumerate(self.E):
                            if self.query(s1 + a, e) != self.query(s2 + a, e):
                                return False, a + e
        return True, None

    def build_hypothesis_dfa(self) -> DFA:
        """Constructs hypothesis DFA from closed and consistent observation table."""
        # Map unique rows to representative state names
        row_to_state: Dict[Tuple[bool, ...], str] = {}
        state_counter = 0

        for s in self.S:
            r = self.row(s)
            if r not in row_to_state:
                row_to_state[r] = f"q{state_counter}"
                state_counter += 1

        states = set(row_to_state.values())
        start_state = row_to_state[self.row("")]
        
        # Accepting states: rows where T(s, "") == True
        empty_suffix_idx = self.E.index("")
        accepting_states = set()
        for r, st in row_to_state.items():
            if r[empty_suffix_idx]:
                accepting_states.add(st)

        transitions: Dict[str, Dict[str, str]] = {st: {} for st in states}
        for s in self.S:
            curr_state = row_to_state[self.row(s)]
            for a in self.alphabet:
                target_row = self.row(s + a)
                if target_row in row_to_state:
                    transitions[curr_state][a] = row_to_state[target_row]

        return DFA(
            states=states,
            alphabet=set(self.alphabet),
            transitions=transitions,
            start_state=start_state,
            accepting_states=accepting_states
        )

    def snapshot(self) -> Dict[str, Any]:
        """Exports observation table matrix for UI display."""
        upper_rows = []
        for s in self.S:
            upper_rows.append({
                "prefix": s if s != "" else "ε",
                "raw_prefix": s,
                "values": [self.query(s, e) for e in self.E]
            })

        lower_rows = []
        for t in self.get_boundary():
            lower_rows.append({
                "prefix": t,
                "raw_prefix": t,
                "values": [self.query(t, e) for e in self.E]
            })

        return {
            "columns": [e if e != "" else "ε" for e in self.E],
            "raw_columns": self.E,
            "upper_rows": upper_rows,
            "lower_rows": lower_rows,
            "queries_so_far": self.query_count
        }


class AngluinLStar:
    def __init__(
        self,
        alphabet: List[str],
        oracle: Callable[[str], bool],
        reference_dfa: Optional[DFA] = None,
        max_iterations: int = 25
    ):
        self.alphabet = sorted(list(set(alphabet)))
        self.oracle = oracle
        self.reference_dfa = reference_dfa
        self.max_iterations = max_iterations
        self.table = ObservationTable(self.alphabet, self.oracle)
        self.history: List[Dict[str, Any]] = []

    def _equivalence_query(self, hypothesis: DFA) -> Tuple[bool, Optional[str]]:
        """Checks if hypothesis DFA matches reference DFA, or uses bounded test."""
        if self.reference_dfa is not None:
            res = check_dfa_equivalence(hypothesis, self.reference_dfa)
            if res["equivalent"]:
                return True, None
            return False, res["raw_counterexample"]
        else:
            # Shortlex search up to length 8 for counterexample
            from backend.datasets.generator import generate_all_words
            test_words = generate_all_words(self.alphabet, 7)
            for w in test_words:
                if hypothesis.accepts(w) != self.oracle(w):
                    return False, w
            return True, None

    def run(self) -> Tuple[DFA, List[Dict[str, Any]]]:
        self.table.fill_table()
        iteration = 0

        while iteration < self.max_iterations:
            iteration += 1

            # 1. Closedness check
            is_closed, cand_t = self.table.check_closed()
            if not is_closed and cand_t is not None:
                self.table.S.append(cand_t)
                self.table.fill_table()
                self.history.append({
                    "iteration": iteration,
                    "action": "MAKE_CLOSED",
                    "description": f"Table was not closed. Promoted prefix '{cand_t}' into S.",
                    "table_snapshot": self.table.snapshot(),
                    "hypothesis_dfa": None
                })
                continue

            # 2. Consistency check
            is_consistent, cand_e = self.table.check_consistent()
            if not is_consistent and cand_e is not None:
                if cand_e not in self.table.E:
                    self.table.E.append(cand_e)
                self.table.fill_table()
                self.history.append({
                    "iteration": iteration,
                    "action": "MAKE_CONSISTENT",
                    "description": f"Table was not consistent. Added distinguishing suffix '{cand_e}' into E.",
                    "table_snapshot": self.table.snapshot(),
                    "hypothesis_dfa": None
                })
                continue

            # 3. Table is closed and consistent -> build hypothesis
            hypothesis = self.table.build_hypothesis_dfa()

            # 4. Equivalence Query
            is_equiv, counterexample = self._equivalence_query(hypothesis)
            if is_equiv:
                self.history.append({
                    "iteration": iteration,
                    "action": "CONVERGED",
                    "description": f"Hypothesis verified equivalent! Learned minimal DFA with {len(hypothesis.states)} states.",
                    "table_snapshot": self.table.snapshot(),
                    "hypothesis_dfa": hypothesis.to_dict(),
                    "counterexample": None
                })
                return hypothesis, self.history
            else:
                # Add counterexample and all its prefixes to S
                pref = ""
                for ch in (counterexample or ""):
                    pref += ch
                    if pref not in self.table.S:
                        self.table.S.append(pref)
                self.table.fill_table()
                self.history.append({
                    "iteration": iteration,
                    "action": "COUNTEREXAMPLE_FOUND",
                    "description": f"Equivalence query failed with counterexample '{counterexample or 'ε'}'. Added prefixes to S.",
                    "table_snapshot": self.table.snapshot(),
                    "hypothesis_dfa": hypothesis.to_dict(),
                    "counterexample": counterexample
                })

        # Return best hypothesis reached
        hypothesis = self.table.build_hypothesis_dfa()
        return hypothesis, self.history
