import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, XCircle, ArrowRight, Table, GitCommit, Layers } from 'lucide-react';
import AutomataGraph from './AutomataGraph';

export default function LearningPanel({
  benchmarks,
  selectedBenchmark,
  dataset,
  learningResult,
  onRunLearning,
  loading
}) {
  const [algorithm, setAlgorithm] = useState('rpni');
  const [noiseTolerance, setNoiseTolerance] = useState(0.0);
  const [activeView, setActiveView] = useState('inferred'); // 'inferred', 'minimized', 'pta', 'reference', 'merges', 'lstar'

  const currentBenchmark = benchmarks.find(b => b.id === selectedBenchmark);

  const handleLearn = () => {
    if (!dataset || !dataset.train) return;
    const pos = dataset.train.filter(it => it.label).map(it => it.raw_word);
    const neg = dataset.train.filter(it => !it.label).map(it => it.raw_word);

    onRunLearning({
      algorithm,
      benchmark_id: selectedBenchmark,
      alphabet: dataset.alphabet || ['0', '1'],
      positive_examples: pos,
      negative_examples: neg,
      noise_tolerance: noiseTolerance,
      test_set: dataset.test
    });
  };

  const mergeHistory = learningResult?.merge_history || [];
  const lstarHistory = learningResult?.lstar_history || [];
  const lastLstarStep = lstarHistory.length > 0 ? lstarHistory[lstarHistory.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Inference Algorithm
            </label>
            <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700">
              <button
                onClick={() => setAlgorithm('rpni')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  algorithm === 'rpni'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RPNI (Prefix Order)
              </button>
              <button
                onClick={() => setAlgorithm('edsm')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  algorithm === 'edsm'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EDSM (Evidence Driven)
              </button>
              <button
                onClick={() => setAlgorithm('lstar')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  algorithm === 'lstar'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Angluin L* (Active Learning)
              </button>
            </div>
          </div>

          {algorithm === 'rpni' && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Noise Tolerance (τ)</span>
                <span className="font-mono text-amber-400">{Math.round(noiseTolerance * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.3"
                step="0.05"
                value={noiseTolerance}
                onChange={(e) => setNoiseTolerance(Number(e.target.value))}
                className="w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleLearn}
          disabled={loading || !dataset?.train?.length}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm rounded-lg shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{loading ? "Inferring Automaton..." : "Run Automata Inference"}</span>
        </button>
      </div>

      {/* Model View Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('inferred')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'inferred'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 mr-1.5" />
            Learned Automaton ({learningResult?.inferred_dfa?.states?.length || 0} states)
          </button>
          <button
            onClick={() => setActiveView('minimized')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'minimized'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Minimized DFA ({learningResult?.minimized_dfa?.states?.length || 0} states)
          </button>
          <button
            onClick={() => setActiveView('pta')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeView === 'pta'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 mr-1.5" />
            Prefix Tree Acceptor (PTA) ({learningResult?.pta?.states?.length || 0} states)
          </button>
          {algorithm === 'lstar' ? (
            <button
              onClick={() => setActiveView('lstar')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'lstar'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5 mr-1.5" />
              L* Observation Table
            </button>
          ) : (
            <button
              onClick={() => setActiveView('merges')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeView === 'merges'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5 mr-1.5" />
              State Merges History ({mergeHistory.length})
            </button>
          )}
        </div>

        {currentBenchmark && (
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Ground Truth Target: <strong className="text-sky-300">{currentBenchmark.name}</strong>
          </span>
        )}
      </div>

      {/* Main Visualizer Area */}
      {activeView === 'inferred' && (
        <AutomataGraph
          dfa={learningResult?.inferred_dfa}
          title="Inferred Finite Automaton"
          subtitle={`Learned via ${algorithm.toUpperCase()} from ${dataset?.train?.length || 0} labeled samples`}
          height="450px"
        />
      )}

      {activeView === 'minimized' && (
        <AutomataGraph
          dfa={learningResult?.minimized_dfa}
          title="Canonical Minimized DFA"
          subtitle="Reduced using Myhill-Nerode Table-Filling indistinguishability theorem"
          height="450px"
        />
      )}

      {activeView === 'pta' && (
        <AutomataGraph
          dfa={learningResult?.pta}
          title="Prefix Tree Acceptor (PTA)"
          subtitle="Tree-structured DFA built strictly from positive training strings S+ before merging"
          height="450px"
        />
      )}

      {/* RPNI / EDSM Merge History View */}
      {activeView === 'merges' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">State Merging & Consistency Trace</h4>
              <p className="text-xs text-slate-400">
                Log of candidate quotient folding operations evaluated against negative constraints (S−).
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
              Total Evaluated: {mergeHistory.length}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[460px]">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-950/40 text-slate-400 uppercase sticky top-0 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Step</th>
                  <th className="py-2.5 px-4">Merge Candidate (q_merge → q_keep)</th>
                  <th className="py-2.5 px-4">Compatibility Outcome</th>
                  <th className="py-2.5 px-4">Remaining |Q|</th>
                  <th className="py-2.5 px-4">Theoretical Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {mergeHistory.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-4 text-slate-500">{m.step}</td>
                    <td className="py-2 px-4 font-semibold text-sky-400">
                      {m.state_merged} <ArrowRight className="inline w-3 h-3 text-slate-400 mx-1" /> {m.state_kept}
                    </td>
                    <td className="py-2 px-4">
                      {m.status === 'ACCEPTED' ? (
                        <span className="inline-flex items-center text-emerald-400 font-semibold text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> ACCEPTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-400 font-semibold text-[11px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40">
                          <XCircle className="w-3 h-3 mr-1" /> REJECTED / ROLLED BACK
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-slate-400">{m.remaining_states_count}</td>
                    <td className="py-2 px-4 text-slate-300 text-[11px]">{m.reason}</td>
                  </tr>
                ))}
                {mergeHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                      No merges logged yet. Run inference to generate trace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Angluin L* Observation Table View */}
      {activeView === 'lstar' && lastLstarStep && lastLstarStep.table_snapshot && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Angluin L* Observation Table T(S, E)</h4>
              <p className="text-xs text-slate-400">
                Active learning Minimally Adequate Teacher (MAT) table: Rows S (upper) and S · Σ (lower), Columns E (test suffixes).
              </p>
            </div>
            <div className="text-xs font-mono text-sky-400">
              Total Membership Queries: {lastLstarStep.table_snapshot.queries_so_far}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-2 px-3 border border-slate-800">Prefix (s ∈ S ∪ S·Σ)</th>
                  {lastLstarStep.table_snapshot.columns.map((col, idx) => (
                    <th key={idx} className="py-2 px-3 border border-slate-800 text-center font-bold text-sky-300">
                      e = "{col}"
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {/* Upper Table S */}
                <tr className="bg-slate-950/80 font-sans text-slate-400 font-semibold">
                  <td colSpan={lastLstarStep.table_snapshot.columns.length + 1} className="py-1 px-3 text-[10px]">
                    ▲ UPPER TABLE S (Confirmed State Representatives)
                  </td>
                </tr>
                {lastLstarStep.table_snapshot.upper_rows.map((row, rIdx) => (
                  <tr key={`u-${rIdx}`} className="hover:bg-slate-800/40 bg-sky-950/10">
                    <td className="py-1.5 px-3 border border-slate-800 font-bold text-sky-400">
                      "{row.prefix}"
                    </td>
                    {row.values.map((v, cIdx) => (
                      <td key={cIdx} className="py-1.5 px-3 border border-slate-800 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${v ? 'bg-emerald-900/60 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {v ? '1' : '0'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Lower Table S . Sigma */}
                <tr className="bg-slate-950/80 font-sans text-slate-400 font-semibold">
                  <td colSpan={lastLstarStep.table_snapshot.columns.length + 1} className="py-1 px-3 text-[10px]">
                    ▼ LOWER TABLE S · Σ \ S (Frontier Boundary Transitions)
                  </td>
                </tr>
                {lastLstarStep.table_snapshot.lower_rows.map((row, rIdx) => (
                  <tr key={`l-${rIdx}`} className="hover:bg-slate-800/40">
                    <td className="py-1.5 px-3 border border-slate-800 text-slate-300">
                      "{row.prefix}"
                    </td>
                    {row.values.map((v, cIdx) => (
                      <td key={cIdx} className="py-1.5 px-3 border border-slate-800 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${v ? 'bg-emerald-900/60 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {v ? '1' : '0'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
