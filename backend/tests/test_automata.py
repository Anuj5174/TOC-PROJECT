"""
Unit tests for DFA and NFA representations, simulation, and subset construction.
"""

import unittest
from backend.automata.dfa import DFA
from backend.automata.nfa import NFA, EPSILON
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

    def test_nfa_representation_and_simulation(self):
        # NFA that accepts strings ending with '01'
        nfa = NFA(
            states={"q0", "q1", "q2"},
            alphabet={"0", "1"},
            transitions={
                "q0": {"0": {"q0", "q1"}, "1": {"q0"}},
                "q1": {"1": {"q2"}}
            },
            start_state="q0",
            accepting_states={"q2"}
        )

        self.assertTrue(nfa.accepts("01"))
        self.assertTrue(nfa.accepts("1001"))
        self.assertTrue(nfa.accepts("0001"))
        self.assertFalse(nfa.accepts("0"))
        self.assertFalse(nfa.accepts("10"))
        self.assertFalse(nfa.accepts("010"))

        sim = nfa.simulate("01")
        self.assertTrue(sim["accepted"])
        self.assertEqual(len(sim["trace"]), 3)

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

        # Convert to DFA via subset construction
        dfa = nfa.to_dfa()
        self.assertTrue(dfa.accepts("ab"))
        self.assertTrue(dfa.accepts("aab"))
        self.assertTrue(dfa.accepts("bab"))
        self.assertFalse(dfa.accepts("a"))
        self.assertFalse(dfa.accepts("ba"))


if __name__ == "__main__":
    unittest.main()
