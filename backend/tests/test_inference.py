"""
Unit tests for RPNI, EDSM, and Angluin's L* active learning.
"""

import unittest
from backend.datasets.benchmarks import get_benchmark
from backend.datasets.generator import create_dataset
from backend.learning.rpni import RPNI
from backend.learning.edsm import EDSM
from backend.learning.active_learning import AngluinLStar
from backend.automata.equivalence import check_dfa_equivalence


class TestInference(unittest.TestCase):

    def test_rpni_learning(self):
        bench = get_benchmark("even_zeros")
        ds = create_dataset(benchmark_id="even_zeros", train_size=40, test_size=40, noise_rate=0.0, seed=42)
        pos = [it["raw_word"] for it in ds["train"] if it["label"]]
        neg = [it["raw_word"] for it in ds["train"] if not it["label"]]

        rpni = RPNI(pos, neg, bench.alphabet)
        inferred_dfa, history = rpni.run()

        self.assertGreater(len(history), 0)
        # All positive samples should be accepted
        for p in pos:
            self.assertTrue(inferred_dfa.accepts(p), f"RPNI failed on positive '{p}'")
        # All negative samples should be rejected
        for n in neg:
            self.assertFalse(inferred_dfa.accepts(n), f"RPNI failed on negative '{n}'")

        # Equivalence check with ground truth
        equiv_res = check_dfa_equivalence(inferred_dfa, bench.reference_dfa)
        self.assertTrue(equiv_res["equivalent"])

    def test_edsm_learning(self):
        bench = get_benchmark("ends_with_01")
        ds = create_dataset(benchmark_id="ends_with_01", train_size=50, test_size=30, noise_rate=0.0, seed=123)
        pos = [it["raw_word"] for it in ds["train"] if it["label"]]
        neg = [it["raw_word"] for it in ds["train"] if not it["label"]]

        edsm = EDSM(pos, neg, bench.alphabet)
        inferred_dfa, history = edsm.run()

        for p in pos:
            self.assertTrue(inferred_dfa.accepts(p))
        for n in neg:
            self.assertFalse(inferred_dfa.accepts(n))

    def test_angluin_l_star(self):
        bench = get_benchmark("even_zeros")
        learner = AngluinLStar(
            alphabet=bench.alphabet,
            oracle=bench.accepts,
            reference_dfa=bench.reference_dfa
        )
        learned_dfa, history = learner.run()

        self.assertGreater(len(history), 0)
        equiv_res = check_dfa_equivalence(learned_dfa, bench.reference_dfa)
        self.assertTrue(equiv_res["equivalent"])
        self.assertEqual(len(learned_dfa.states), 2)


if __name__ == "__main__":
    unittest.main()
