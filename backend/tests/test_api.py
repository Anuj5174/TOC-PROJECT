"""
Integration tests for FastAPI endpoints.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_get_benchmarks(self):
        res = self.client.get("/api/benchmarks")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(len(data), 5)
        bench_ids = [b["id"] for b in data]
        self.assertIn("even_zeros", bench_ids)

    def test_generate_dataset(self):
        payload = {
            "benchmark_id": "even_zeros",
            "train_size": 20,
            "test_size": 20,
            "noise_rate": 0.1,
            "seed": 42
        }
        res = self.client.post("/api/dataset/generate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["train"]), 20)
        self.assertEqual(len(data["test"]), 20)

    def test_learn_rpni(self):
        # First generate dataset
        ds_res = self.client.post("/api/dataset/generate", json={
            "benchmark_id": "even_zeros",
            "train_size": 30,
            "test_size": 30
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
        self.assertIn("minimized_dfa", data)
        self.assertIn("evaluation", data)
        self.assertGreater(data["evaluation"]["metrics"]["accuracy"], 0.9)

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


if __name__ == "__main__":
    unittest.main()
