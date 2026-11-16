"""
Integration tests for FastAPI endpoints.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_benchmarks_list(self):
        res = self.client.get("/api/benchmarks")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_benchmark_detail(self):
        res = self.client.get("/api/benchmarks/even_zeros")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], "even_zeros")
        self.assertIn("reference_dfa", data)

    def test_dataset_generation(self):
        payload = {
            "benchmark_id": "even_zeros",
            "train_size": 20,
            "test_size": 20,
            "max_len": 5,
            "noise_rate": 0.0
        }
        res = self.client.post("/api/dataset/generate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("train", data)
        self.assertIn("test", data)
        self.assertEqual(len(data["train"]), 20)
        self.assertEqual(len(data["test"]), 20)

    def test_learn_rpni(self):
        ds_res = self.client.post("/api/dataset/generate", json={
            "benchmark_id": "even_zeros",
            "train_size": 40,
            "test_size": 30,
            "seed": 42
        })
        ds = ds_res.json()
        pos = [it["raw_word"] for it in ds["train"] if it["label"]]
        neg = [it["raw_word"] for it in ds["train"] if not it["label"]]

        payload = {
            "algorithm": "rpni",
            "benchmark_id": "even_zeros",
            "alphabet": ["0", "1"],
            "positive_examples": pos,
            "negative_examples": neg,
            "test_set": ds["test"]
        }
        res = self.client.post("/api/learn", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("inferred_dfa", data)
        self.assertIn("evaluation", data)
        self.assertGreater(data["evaluation"]["metrics"]["accuracy"], 0.8)

    def test_simulate(self):
        bench_res = self.client.get("/api/benchmarks/even_zeros")
        ref_dfa = bench_res.json()["reference_dfa"]

        sim_res = self.client.post("/api/simulate", json={
            "dfa_data": ref_dfa,
            "word": "1001"
        })
        self.assertEqual(sim_res.status_code, 200)
        sim_data = sim_res.json()
        self.assertTrue(sim_data["accepted"])
        self.assertEqual(len(sim_data["trace"]), 5)

    def test_experiments(self):
        # Quantity experiment
        res_q = self.client.post("/api/experiments/quantity", json={
            "benchmark_id": "even_zeros",
            "sample_sizes": [10, 20],
            "test_size": 20,
            "repeats": 1
        })
        self.assertEqual(res_q.status_code, 200)
        self.assertEqual(len(res_q.json()), 2)

        # Noise experiment
        res_n = self.client.post("/api/experiments/noise", json={
            "benchmark_id": "even_zeros",
            "noise_levels": [0.0, 0.1],
            "train_size": 20,
            "test_size": 20,
            "repeats": 1
        })
        self.assertEqual(res_n.status_code, 200)
        self.assertEqual(len(res_n.json()), 2)

        # Diversity experiment
        res_d = self.client.post("/api/experiments/diversity", json={
            "benchmark_id": "even_zeros",
            "max_lengths": [4, 6],
            "train_size": 20,
            "test_size": 20,
            "repeats": 1
        })
        self.assertEqual(res_d.status_code, 200)
        self.assertEqual(len(res_d.json()), 2)


if __name__ == "__main__":
    unittest.main()
