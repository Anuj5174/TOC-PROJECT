import React, { useState } from 'react';
import { BarChart3, AlertTriangle, Layers, Play } from 'lucide-react';

export default function NoiseStudyPanel({
  selectedBenchmark,
  onRunQuantityExperiment,
  onRunNoiseExperiment,
  onRunDiversityExperiment,
  quantityResults,
  noiseResults,
  diversityResults,
  loading
}) {
  const [activeStudy, setActiveStudy] = useState('quantity'); // 'quantity', 'noise', 'diversity'

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveStudy('quantity')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeStudy === 'quantity'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-1.5" />
          1. Quantity (Sample Size N)
        </button>
        <button
          onClick={() => setActiveStudy('noise')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeStudy === 'noise'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400" />
          2. Quality (Label Noise)
        </button>
        <button
          onClick={() => setActiveStudy('diversity')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeStudy === 'diversity'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 mr-1.5 text-teal-400" />
          3. Diversity (String Lengths)
        </button>
      </div>

      {/* 1. Sample Quantity Study */}
      {activeStudy === 'quantity' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Learning Efficiency vs Training Set Size (N)</h4>
              <p className="text-xs text-slate-400">
                Measures generalization accuracy and state count as the quantity of training examples increases.
              </p>
            </div>
            <button
              onClick={() => onRunQuantityExperiment({ benchmark_id: selectedBenchmark })}
              disabled={loading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? "Running Experiment..." : "Run Quantity Benchmark"}</span>
            </button>
          </div>

          {quantityResults && quantityResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Results Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-300">
                  Tabular Results
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Samples (N)</th>
                      <th className="py-2.5 px-4">Mean Test Accuracy</th>
                      <th className="py-2.5 px-4">Learned |Q|</th>
                      <th className="py-2.5 px-4">Reference |Q|</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {quantityResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 font-bold text-sky-400">{r.sample_size}</td>
                        <td className="py-2 px-4">
                          <span className={`font-semibold ${r.mean_accuracy >= 0.95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {(r.mean_accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-4 font-bold text-slate-200">{r.mean_state_count}</td>
                        <td className="py-2 px-4 text-slate-400">{r.reference_states}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visual SVG Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 mb-1">Learning Curve: Accuracy vs Sample Size</h5>
                  <p className="text-[11px] text-slate-400 mb-4">Sample efficiency curve showing accuracy convergence as N increases.</p>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="70" x2="380" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                    <text x="32" y="24" fill="#64748b" fontSize="9" textAnchor="end">100%</text>
                    <text x="32" y="74" fill="#64748b" fontSize="9" textAnchor="end">75%</text>
                    <text x="32" y="124" fill="#64748b" fontSize="9" textAnchor="end">50%</text>

                    {(() => {
                      const points = quantityResults.map((r, i) => {
                        const x = 50 + (i / (quantityResults.length - 1)) * 320;
                        const y = 160 - (r.mean_accuracy * 140);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="3"
                            points={points}
                          />
                          {quantityResults.map((r, i) => {
                            const x = 50 + (i / (quantityResults.length - 1)) * 320;
                            const y = 160 - (r.mean_accuracy * 140);
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="#38bdf8" />
                                <text x={x} y="175" fill="#64748b" fontSize="8" textAnchor="middle">{r.sample_size}</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
              Click "Run Quantity Benchmark" to measure learning curves across varying sample sizes.
            </div>
          )}
        </div>
      )}

      {/* 2. Label Noise Study */}
      {activeStudy === 'noise' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Quality: Label Noise Sensitivity & State Explosion</h4>
              <p className="text-xs text-slate-400">
                Measures how corrupt training labels degrade generalization accuracy and trigger state overfitting.
              </p>
            </div>
            <button
              onClick={() => onRunNoiseExperiment({ benchmark_id: selectedBenchmark })}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? "Simulating Noise..." : "Run Noise Experiment"}</span>
            </button>
          </div>

          {noiseResults && noiseResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Noise Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-300">
                  Noise Degradation Profile
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Noise Rate (η)</th>
                      <th className="py-2.5 px-4">Accuracy</th>
                      <th className="py-2.5 px-4">Learned |Q|</th>
                      <th className="py-2.5 px-4">Ref |Q|</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {noiseResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 font-bold text-amber-400">{Math.round(r.noise_level * 100)}%</td>
                        <td className="py-2 px-4">
                          <span className={`font-semibold ${r.mean_accuracy >= 0.85 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(r.mean_accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-4 font-bold text-sky-400">{r.mean_state_count}</td>
                        <td className="py-2 px-4 text-slate-400">{r.reference_states}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* State Explosion Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 mb-1">State Count Explosion vs Noise Rate</h5>
                  <p className="text-[11px] text-slate-400 mb-4">Notice how false labels block valid merges, drastically inflating state count.</p>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="70" x2="380" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                    {(() => {
                      const maxStates = Math.max(...noiseResults.map(r => r.mean_state_count), 10);
                      const points = noiseResults.map((r, i) => {
                        const x = 50 + (i / (noiseResults.length - 1)) * 320;
                        const y = 160 - (r.mean_state_count / maxStates) * 140;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            points={points}
                          />
                          {noiseResults.map((r, i) => {
                            const x = 50 + (i / (noiseResults.length - 1)) * 320;
                            const y = 160 - (r.mean_state_count / maxStates) * 140;
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="#f59e0b" />
                                <text x={x} y="175" fill="#64748b" fontSize="8" textAnchor="middle">
                                  {Math.round(r.noise_level * 100)}%
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
              Click "Run Noise Experiment" to analyze label corruption and state explosion.
            </div>
          )}
        </div>
      )}

      {/* 3. Diversity Study */}
      {activeStudy === 'diversity' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Diversity: String Length & Generalization Coverage</h4>
              <p className="text-xs text-slate-400">
                Investigates how the maximum string length of training examples affects the inferred automaton.
              </p>
            </div>
            <button
              onClick={() => onRunDiversityExperiment({ benchmark_id: selectedBenchmark })}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? "Analyzing Diversity..." : "Run Diversity Benchmark"}</span>
            </button>
          </div>

          {diversityResults && diversityResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-300">
                  Length Diversity Profile
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Max String Length</th>
                      <th className="py-2.5 px-4">Mean Test Accuracy</th>
                      <th className="py-2.5 px-4">Learned |Q|</th>
                      <th className="py-2.5 px-4">Ref |Q|</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {diversityResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 font-bold text-teal-400">{r.max_length}</td>
                        <td className="py-2 px-4">
                          <span className={`font-semibold ${r.mean_accuracy >= 0.90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {(r.mean_accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-4 font-bold text-slate-200">{r.mean_state_count}</td>
                        <td className="py-2 px-4 text-slate-400">{r.reference_states}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 mb-1">Accuracy vs Maximum String Length</h5>
                  <p className="text-[11px] text-slate-400 mb-4">Shorter strings lack cyclic evidence needed to learn recurrent state loops.</p>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="70" x2="380" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                    {(() => {
                      const points = diversityResults.map((r, i) => {
                        const x = 50 + (i / (diversityResults.length - 1)) * 320;
                        const y = 160 - (r.mean_accuracy * 140);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#14b8a6"
                            strokeWidth="3"
                            points={points}
                          />
                          {diversityResults.map((r, i) => {
                            const x = 50 + (i / (diversityResults.length - 1)) * 320;
                            const y = 160 - (r.mean_accuracy * 140);
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="#14b8a6" />
                                <text x={x} y="175" fill="#64748b" fontSize="8" textAnchor="middle">{r.max_length}</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
              Click "Run Diversity Benchmark" to examine how training string lengths impact the inferred model.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
