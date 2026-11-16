import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AutomataGraph from './components/AutomataGraph';
import DatasetPanel from './components/DatasetPanel';
import LearningPanel from './components/LearningPanel';
import SimulationPanel from './components/SimulationPanel';
import TOCVerificationPanel from './components/TOCVerificationPanel';
import NoiseStudyPanel from './components/NoiseStudyPanel';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('automata');
  const [benchmarks, setBenchmarks] = useState([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState('even_zeros');
  const [referenceDfa, setReferenceDfa] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [learningResult, setLearningResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Empirical study results
  const [quantityResults, setQuantityResults] = useState(null);
  const [noiseResults, setNoiseResults] = useState(null);
  const [clusterResults, setClusterResults] = useState(null);

  // 1. Initial Load: Fetch benchmarks
  useEffect(() => {
    fetch(`${API_BASE}/benchmarks`)
      .then(res => res.json())
      .then(data => {
        setBenchmarks(data);
        if (data.length > 0) {
          const defaultId = data[0].id;
          setSelectedBenchmark(defaultId);
          loadBenchmarkDetails(defaultId);
        }
      })
      .catch(err => {
        console.error("Failed to load benchmarks:", err);
        setErrorMsg("Unable to connect to backend server at http://127.0.0.1:8000.");
      });
  }, []);

  // 2. Load benchmark details
  const loadBenchmarkDetails = async (benchId) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/benchmarks/${benchId}`);
      if (!res.ok) throw new Error("Benchmark not found");
      const data = await res.json();
      setReferenceDfa(data.reference_dfa);

      // Auto-generate initial dataset
      const dsRes = await fetch(`${API_BASE}/dataset/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benchmark_id: benchId,
          train_size: 40,
          test_size: 60,
          max_len: 7,
          noise_rate: 0.0,
          seed: 42
        })
      });
      const dsData = await dsRes.json();
      setDataset(dsData);

      // Auto-run RPNI inference
      const pos = dsData.train.filter(it => it.label).map(it => it.raw_word);
      const neg = dsData.train.filter(it => !it.label).map(it => it.raw_word);

      const learnRes = await fetch(`${API_BASE}/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: 'rpni',
          benchmark_id: benchId,
          alphabet: dsData.alphabet,
          positive_examples: pos,
          negative_examples: neg,
          noise_tolerance: 0.0,
          test_set: dsData.test
        })
      });
      const learnData = await learnRes.json();
      setLearningResult(learnData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBenchmarkChange = (benchId) => {
    setSelectedBenchmark(benchId);
    loadBenchmarkDetails(benchId);
  };

  const handleGenerateDataset = async (params) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/dataset/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error("Dataset generation failed");
      const dsData = await res.json();
      setDataset(dsData);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunLearning = async (params) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${API_BASE}/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Learning failed");
      }
      const learnData = await res.json();
      setLearningResult(learnData);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuantityExperiment = async (params) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/experiments/quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      setQuantityResults(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNoiseExperiment = async (params) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/experiments/noise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      setNoiseResults(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClustering = async (params) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/cluster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      setClusterResults(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global alert / error notification */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200 text-xs px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'automata' && (
          <SimulationPanel
            inferredDfa={learningResult?.minimized_dfa || learningResult?.inferred_dfa}
            referenceDfa={referenceDfa}
            alphabet={dataset?.alphabet || ['0', '1']}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetPanel
            benchmarks={benchmarks}
            selectedBenchmark={selectedBenchmark}
            setSelectedBenchmark={handleBenchmarkChange}
            dataset={dataset}
            onGenerateDataset={handleGenerateDataset}
            onUpdateDataset={setDataset}
            loading={loading}
          />
        )}

        {activeTab === 'learning' && (
          <LearningPanel
            benchmarks={benchmarks}
            selectedBenchmark={selectedBenchmark}
            dataset={dataset}
            learningResult={learningResult}
            onRunLearning={handleRunLearning}
            loading={loading}
          />
        )}

        {activeTab === 'verification' && (
          <TOCVerificationPanel
            learningResult={learningResult}
            referenceDfa={referenceDfa}
          />
        )}

        {activeTab === 'experiments' && (
          <NoiseStudyPanel
            selectedBenchmark={selectedBenchmark}
            inferredDfa={learningResult?.minimized_dfa || learningResult?.inferred_dfa}
            dataset={dataset}
            onRunQuantityExperiment={handleRunQuantityExperiment}
            onRunNoiseExperiment={handleRunNoiseExperiment}
            onRunClustering={handleRunClustering}
            quantityResults={quantityResults}
            noiseResults={noiseResults}
            clusterResults={clusterResults}
            loading={loading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        Theory of Computation Educational Tool • Automata Grammatical Inference (RPNI, EDSM, Angluin L*) • Fast API & React
      </footer>
    </div>
  );
}
