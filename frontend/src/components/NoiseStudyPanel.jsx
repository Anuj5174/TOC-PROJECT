import React, { useState } from 'react';
import { BarChart3, AlertTriangle, Layers, Play, ScatterChart } from 'lucide-react';

export default function NoiseStudyPanel({
  selectedBenchmark,
  inferredDfa,
  dataset,
  onRunQuantityExperiment,
  onRunNoiseExperiment,
  onRunClustering,
  quantityResults,
  noiseResults,
  clusterResults,
  loading
}) {
  const [activeStudy, setActiveStudy] = useState('quantity'); // 'quantity', 'noise', 'clustering'

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
          Sample Quantity Learning Curve
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
          Label Noise Sensitivity Study
        </button>
        <button
          onClick={() => setActiveStudy('clustering')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeStudy === 'clustering'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 mr-1.5" />
          ML Exploratory Clustering (PCA 2D)
        </button>
      </div>

      {/* 1. Sample Quantity Study */}
      {activeStudy === 'quantity' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Learning Efficiency vs Training Set Size (N)</h4>
              <p className="text-xs text-slate-400">
                Measures convergence speed: how many samples are required before RPNI achieves 100% generalization.
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
                      <th className="py-2.5 px-4">Mean |Q|</th>
                      <th className="py-2.5 px-4">Equivalence Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {quantityResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 font-bold text-sky-400">{r.training_samples}</td>
                        <td className="py-2 px-4">
                          <span className={`font-semibold ${r.mean_accuracy >= 0.95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {(r.mean_accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-4">{r.mean_state_count}</td>
                        <td className="py-2 px-4 font-semibold text-sky-300">{(r.equivalence_rate * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visual SVG Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 mb-1">Learning Curve: Accuracy vs Sample Size</h5>
                  <p className="text-[11px] text-slate-400 mb-4">Sample efficiency curve showing rapid accuracy convergence.</p>
                </div>
                {/* Responsive SVG Polyline Chart */}
                <div className="h-56 w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="70" x2="380" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                    {/* Y Labels */}
                    <text x="32" y="24" fill="#64748b" fontSize="9" textAnchor="end">100%</text>
                    <text x="32" y="74" fill="#64748b" fontSize="9" textAnchor="end">75%</text>
                    <text x="32" y="124" fill="#64748b" fontSize="9" textAnchor="end">50%</text>

                    {/* Accuracy Line Plot */}
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
                                <circle cx={x} cy={y} r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                                <text x={x} y="174" fill="#94a3b8" fontSize="9" textAnchor="middle">{r.training_samples}</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex justify-center items-center space-x-2 text-xs text-slate-400 mt-2">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block"></span>
                  <span>Generalization Accuracy (%)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              Click "Run Quantity Benchmark" to compute the sample quantity learning curve.
            </div>
          )}
        </div>
      )}

      {/* 2. Label Noise Study */}
      {activeStudy === 'noise' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Robustness against Label Noise (η)</h4>
              <p className="text-xs text-slate-400">
                Studies state explosion and accuracy decay as training labels become corrupted (0% to 30%).
              </p>
            </div>
            <button
              onClick={() => onRunNoiseExperiment({ benchmark_id: selectedBenchmark })}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? "Running Experiment..." : "Run Noise Benchmark"}</span>
            </button>
          </div>

          {noiseResults && noiseResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-300">
                  Noise Sensitivity Table
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Noise Rate (η)</th>
                      <th className="py-2.5 px-4">Mean Accuracy</th>
                      <th className="py-2.5 px-4">Mean |Q| (State Explosion)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {noiseResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-4 font-bold text-amber-400">{r.noise_percentage}</td>
                        <td className="py-2 px-4 font-semibold text-slate-200">{(r.mean_accuracy * 100).toFixed(1)}%</td>
                        <td className="py-2 px-4 text-rose-400 font-semibold">{r.mean_state_count} states</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Noise Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 mb-1">State Explosion under Label Noise</h5>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Inconsistent noisy samples block valid merges, forcing the inferred automaton to overfit with more states.
                  </p>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="80" x2="380" y2="80" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                    {/* Polyline */}
                    {(() => {
                      const maxState = Math.max(...noiseResults.map(r => r.mean_state_count), 5);
                      const points = noiseResults.map((r, i) => {
                        const x = 50 + (i / (noiseResults.length - 1)) * 320;
                        const y = 160 - ((r.mean_state_count / maxState) * 140);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="3"
                            points={points}
                          />
                          {noiseResults.map((r, i) => {
                            const x = 50 + (i / (noiseResults.length - 1)) * 320;
                            const y = 160 - ((r.mean_state_count / maxState) * 140);
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="#be123c" stroke="#f43f5e" strokeWidth="2" />
                                <text x={x} y="174" fill="#94a3b8" fontSize="9" textAnchor="middle">{r.noise_percentage}</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex justify-center items-center space-x-2 text-xs text-slate-400 mt-2">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
                  <span>Inferred Automaton State Count |Q|</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              Click "Run Noise Benchmark" to study the effects of noisy labels.
            </div>
          )}
        </div>
      )}

      {/* 3. ML Exploratory Clustering (PCA 2D) */}
      {activeStudy === 'clustering' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Exploratory Clustering of Labeled Strings (PCA 2D)</h4>
              <p className="text-xs text-slate-400">
                Embeds strings using character n-gram frequencies and automata state visitation patterns, projected to 2D.
              </p>
            </div>
            <button
              onClick={() => onRunClustering({
                strings_data: dataset?.train || [],
                dfa_data: inferredDfa,
                n_clusters: 2
              })}
              disabled={loading || !dataset?.train?.length}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? "Clustering..." : "Compute 2D Projection"}</span>
            </button>
          </div>

          {clusterResults && clusterResults.points && clusterResults.points.length > 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-4 text-xs text-slate-400">
                <span>Explained Variance: <strong className="text-sky-300">{(clusterResults.explained_variance_ratio * 100).toFixed(1)}%</strong></span>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5"></span> Positive String (+)</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5"></span> Negative String (−)</span>
                </div>
              </div>

              {/* 2D Scatter Plot Canvas / SVG */}
              <div className="h-80 w-full bg-slate-950/70 border border-slate-800 rounded-xl relative p-4 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="-120 -80 240 160">
                  {/* Axis */}
                  <line x1="-110" y1="0" x2="110" y2="0" stroke="#334155" strokeWidth="0.8" />
                  <line x1="0" y1="-70" x2="0" y2="70" stroke="#334155" strokeWidth="0.8" />

                  {/* Scatter points */}
                  {clusterResults.points.map((pt, idx) => {
                    const color = pt.true_label ? '#34d399' : '#f87171';
                    // Scale coordinates
                    const cx = Math.max(-105, Math.min(105, pt.x * 20));
                    const cy = Math.max(-65, Math.min(65, -pt.y * 20));

                    return (
                      <g key={idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="4"
                          fill={color}
                          opacity="0.85"
                          className="hover:r-6 cursor-pointer transition-all"
                        >
                          <title>{`String: "${pt.word}" | Label: ${pt.true_label ? '+' : '−'} | Cluster: ${pt.cluster}`}</title>
                        </circle>
                        <text
                          x={cx + 5}
                          y={cy + 3}
                          fill="#94a3b8"
                          fontSize="6"
                          fontFamily="monospace"
                        >
                          {pt.word.length <= 4 ? pt.word : ''}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              Click "Compute 2D Projection" to perform dimensionality reduction and clustering.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
