from backend.automata.dfa import DFA
from backend.automata.nfa import NFA
from backend.automata.minimization import minimize_dfa_table_filling
from backend.automata.equivalence import check_dfa_equivalence

__all__ = ["DFA", "NFA", "minimize_dfa_table_filling", "check_dfa_equivalence"]
