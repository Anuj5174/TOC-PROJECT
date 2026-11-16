"""
Unit tests for RPNI and EDSM automata-inference algorithms.
"""

import unittest
from backend.datasets.benchmarks import get_benchmark
from backend.datasets.generator import create_dataset
from backend.learning.rpni import RPNI
from backend.learning.edsm import EDSM


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

        # Generalization on test set
        for item in ds["test"]:
            w = item["raw_word"]
            expected = item["label"]
            self.assertEqual(inferred_dfa.accepts(w), expected)

    def test_edsm_learning(self):
        bench = get_benchmark("ends_with_01")
        ds = create_dataset(benchmark_id="ends_with_01", train_size=50, test_size=30, noise_rate=0.0, seed=123)
        pos = [it["raw_word"] for it in ds["train"] if it["label"]]
        neg = [it["raw_word"] for it in ds["train"] if not it["label"]]

        edsm = EDSM(pos, neg, bench.alphabet)
        inferred_dfa, history = edsm.run()

        self.assertGreater(len(history), 0)
        for p in pos:
            self.assertTrue(inferred_dfa.accepts(p))
        for n in neg:
            self.assertFalse(inferred_dfa.accepts(n))


if __name__ == "__main__":
    unittest.main()
