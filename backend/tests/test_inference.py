"""
Unit tests for RPNI automata-inference algorithm.
"""

import unittest
from backend.datasets.benchmarks import get_benchmark
from backend.datasets.generator import create_dataset
from backend.learning.rpni import RPNI


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


if __name__ == "__main__":
    unittest.main()
