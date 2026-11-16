"""
Unit tests for DFA, NFA, Minimization, and Equivalence.
"""

import unittest
from backend.automata.dfa import DFA
from backend.automata.nfa import NFA, EPSILON
from backend.automata.minimization import minimize_dfa_table_filling
from backend.automata.equivalence import check_dfa_equivalence
from backend.datasets.benchmarks import get_benchmark


class TestAutomata(unittest.TestCase):

    def test_dfa_acceptance(self):
        bench = get_benchmark("even_zeros")
        dfa = bench.reference_dfa

        self.assertTrue(dfa.accepts(""))
        self.assertTrue(dfa.accepts("1"))
        self.assertTrue(dfa.accepts("00"))
        self.assertTrue(dfa.accepts("10101"))
        self.assertFalse(dfa.accepts("0"))
        self.assertFalse(dfa.accepts("000"))
        self.assertFalse(dfa.accepts("101"))

    def test_dfa_simulation_trace(self):
        bench = get_benchmark("ends_with_01")
        dfa = bench.reference_dfa
        sim = dfa.simulate("101")
        self.assertTrue(sim["accepted"])
        self.assertEqual(len(sim["trace"]), 4)  # initial + 3 chars
        self.assertEqual(sim["trace"][-1]["read_char"], "1")

    def test_nfa_to_dfa_subset_construction(self):
        # NFA that accepts strings ending with 'ab' over {a, b}
        nfa = NFA(
            states={"s0", "s1", "s2"},
            alphabet={"a", "b"},
            transitions={
                "s0": {"a": {"s0", "s1"}, "b": {"s0"}},
                "s1": {"b": {"s2"}}
            },
            start_state="s0",
            accepting_states={"s2"}
        )

        self.assertTrue(nfa.accepts("ab"))
        self.assertTrue(nfa.accepts("aab"))
        self.assertTrue(nfa.accepts("bab"))
        self.assertFalse(nfa.accepts("a"))
        self.assertFalse(nfa.accepts("ba"))

        # Convert to DFA
        dfa = nfa.to_dfa()
        self.assertTrue(dfa.accepts("ab"))
        self.assertTrue(dfa.accepts("aab"))
        self.assertTrue(dfa.accepts("bab"))
        self.assertFalse(dfa.accepts("a"))
        self.assertFalse(dfa.accepts("ba"))

    def test_dfa_minimization(self):
        # Redundant DFA for (0|1)* ending in 1 with equivalent redundant states
        redundant_dfa = DFA(
            states={"A", "B", "C", "D"},
            alphabet={"0", "1"},
            transitions={
                "A": {"0": "B", "1": "C"},
                "B": {"0": "B", "1": "D"},
                "C": {"0": "B", "1": "C"},
                "D": {"0": "B", "1": "D"}
            },
            start_state="A",
            accepting_states={"C", "D"}
        )

        minimized, viz = minimize_dfa_table_filling(redundant_dfa)
        # Should merge C and D, and A and B are equivalent after step
        self.assertLessEqual(len(minimized.states), 2)
        # Test acceptance parity
        for test_word in ["", "0", "1", "00", "01", "10", "11", "101"]:
            self.assertEqual(redundant_dfa.accepts(test_word), minimized.accepts(test_word))

    def test_dfa_equivalence_and_counterexample(self):
        bench = get_benchmark("even_zeros")
        dfa1 = bench.reference_dfa

        # Exactly equivalent DFA with renamed states
        dfa2 = DFA(
            states={"even", "odd"},
            alphabet={"0", "1"},
            transitions={
                "even": {"0": "odd", "1": "even"},
                "odd": {"0": "even", "1": "odd"}
            },
            start_state="even",
            accepting_states={"even"}
        )

        equiv_res = check_dfa_equivalence(dfa1, dfa2)
        self.assertTrue(equiv_res["equivalent"])
        self.assertIsNone(equiv_res["counterexample"])

        # Non-equivalent DFA (accepts odd number of 0s instead)
        dfa_diff = DFA(
            states={"q0", "q1"},
            alphabet={"0", "1"},
            transitions={
                "q0": {"0": "q1", "1": "q0"},
                "q1": {"0": "q0", "1": "q1"}
            },
            start_state="q0",
            accepting_states={"q1"}
        )

        diff_res = check_dfa_equivalence(dfa1, dfa_diff)
        self.assertFalse(diff_res["equivalent"])
        self.assertIsNotNone(diff_res["counterexample"])
        ce = diff_res["raw_counterexample"]
        self.assertNotEqual(dfa1.accepts(ce), dfa_diff.accepts(ce))


if __name__ == "__main__":
    unittest.main()
