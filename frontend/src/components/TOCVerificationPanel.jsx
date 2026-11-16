import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, Table, Check, X, Layers } from 'lucide-react';

export default function TOCVerificationPanel({
  learningResult,
  referenceDfa
}) {
  const [activeTab, setActiveTab] = useState('equivalence'); // 'equivalence', 'minimization', 'metrics'

  const evaluation = learningResult?.evaluation;
  const equiv = evaluation?.equivalence;
  const metrics = evaluation?.metrics;
  const minDetails = learningResult?.minimization_details;

  return (
    <div className="space-y-6">
      {/* Top Selector Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('equivalence')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'equivalence'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mr-1.5" />
          Formal Automata Equivalence & Counterexamples
        </button>
        <button
          onClick={() => setActiveTab('minimization')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'minimization'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-4 h-4 mr-1.5" />
          Myhill-Nerode Table-Filling Matrix
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'metrics'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 mr-1.5" />
          Generalization Performance & Confusion Matrix
        </button>
      </div>

      {/* 1. Formal Equivalence Section */}
      {activeTab === 'equivalence' && (
        <div className="space-y-5">
          {equiv ? (
            <div
              className={`p-5 rounded-xl border shadow-lg ${
                equiv.equivalent
                  ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/70 text-rose-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                {equiv.equivalent ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="space-y-1">
                  <h3 className="text-base font-bold">
                    {equiv.equivalent
                      ? "Formally Equivalent: L(M_inferred) ≡ L(M_reference)"
                      : "Not Equivalent: Language Discrepancy Found"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {equiv.equivalent
                      ? "Cross-product automaton verification confirmed that the symmetric difference language is empty: L(M1) ⊕ L(M2) = ∅. The inferred automaton has perfectly learned the regular language!"
                      : "The inferred automaton does not recognize the exact regular language. Shortest distinguishing counterexample discovered:"}
                  </p>
                </div>
              </div>

              {!equiv.equivalent && equiv.counterexample_details && (
                <div className="mt-4 p-4 bg-slate-900/90 border border-rose-800/60 rounded-lg font-mono text-xs text-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Shortest Counterexample String (w):</span>
                    <span className="text-amber-400 font-bold text-sm bg-slate-800 px-2.5 py-0.5 rounded">
                      "{equiv.counterexample_details.string || 'ε'}"
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="p-2 bg-slate-950 rounded">
                      <span className="text-slate-400 block text-[11px]">Inferred DFA:</span>
                      <strong className={equiv.counterexample_details.dfa1_accepts ? "text-emerald-400" : "text-rose-400"}>
                        {equiv.counterexample_details.dfa1_accepts ? "ACCEPTS (+)" : "REJECTS (−)"}
                      </strong>
                    </div>
                    <div className="p-2 bg-slate-950 rounded">
                      <span className="text-slate-400 block text-[11px]">Reference Ground Truth:</span>
                      <strong className={equiv.counterexample_details.dfa2_accepts ? "text-emerald-400" : "text-rose-400"}>
                        {equiv.counterexample_details.dfa2_accepts ? "ACCEPTS (+)" : "REJECTS (−)"}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    {equiv.counterexample_details.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              Run inference to perform formal cross-product equivalence checking.
            </div>
          )}

          {/* Theoretical Explanation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-xs text-slate-300 space-y-3">
            <h4 className="font-semibold text-slate-100 text-sm">Theory of Computation: Product Automaton Equivalence</h4>
            <p className="leading-relaxed">
              To verify whether two deterministic finite automata \(M_1\) and \(M_2\) recognize the same regular language (\(L(M_1) = L(M_2)\)), we construct their product automaton \(M_\oplus = M_1 \times M_2\) over the joint alphabet \(\Sigma\).
            </p>
            <p className="leading-relaxed font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800">
              F_xor = {'{'}(q1, q2) | (q1 ∈ F1 ∧ q2 ∉ F2) ∨ (q1 ∉ F1 ∧ q2 ∈ F2){'}'}
            </p>
            <p className="leading-relaxed">
              If BFS from the start state pair \((q_{0,1}, q_{0,2})\) cannot reach any state in \(F_\oplus\), the symmetric difference is empty, proving equivalence. If any state in \(F_\oplus\) is reached, the search path immediately yields the shortest counterexample string.
            </p>
          </div>
        </div>
      )}

      {/* 2. Myhill-Nerode Minimization Matrix Section */}
      {activeTab === 'minimization' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Myhill-Nerode Distinguishability Matrix</h4>
                <p className="text-xs text-slate-400">
                  Table-filling algorithm marks pairs of states (p, q) that are distinguishable by some suffix string.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">
                States: {minDetails?.original_states_count || 0} → <strong className="text-emerald-400">{minDetails?.minimized_states_count || 0} minimal</strong>
              </div>
            </div>

            {/* Matrix Grid */}
            {minDetails?.table_grid && minDetails.table_grid.length > 0 ? (
              <div className="overflow-x-auto pt-2">
                <table className="border-collapse font-mono text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 border border-slate-800 bg-slate-950 text-slate-500"></th>
                      {minDetails.states_list.slice(0, -1).map((s, idx) => (
                        <th key={idx} className="p-2 border border-slate-800 bg-slate-950 text-sky-400 font-bold min-w-[38px] text-center">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {minDetails.table_grid.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-2 border border-slate-800 bg-slate-950 text-sky-400 font-bold text-center">
                          {row.state}
                        </td>
                        {row.cells.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2 border border-slate-800 text-center text-xs font-bold transition-colors ${
                              cell.distinguishable
                                ? 'bg-rose-950/30 text-rose-400'
                                : 'bg-emerald-950/40 text-emerald-400 font-extrabold'
                            }`}
                            title={`Pair (${cell.state1}, ${cell.state2}): ${cell.reason || 'Equivalent / Indistinguishable'}`}
                          >
                            {cell.distinguishable ? 'X' : '≡'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center space-x-4 pt-3 text-xs text-slate-400">
                  <span className="flex items-center"><strong className="text-rose-400 mr-1">X</strong> = Distinguishable</span>
                  <span className="flex items-center"><strong className="text-emerald-400 mr-1">≡</strong> = Equivalent (Merged)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-4">No minimization table available yet.</p>
            )}

            {/* Equivalence classes */}
            {minDetails?.equivalence_classes && (
              <div className="pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block mb-1.5">Resulting Equivalence Classes:</span>
                <div className="flex flex-wrap gap-2">
                  {minDetails.equivalence_classes.map((cls, idx) => (
                    <span key={idx} className="px-3 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-300">
                      [{cls.join(', ')}]
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Generalization Performance & Confusion Matrix */}
      {activeTab === 'metrics' && (
        <div className="space-y-5">
          {metrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Test Accuracy</span>
                <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Precision</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {(metrics.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Recall</span>
                <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                  {(metrics.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">F1 Score</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {(metrics.f1_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
              No evaluation metrics available yet.
            </div>
          )}

          {/* Confusion Matrix Card */}
          {metrics && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h4 className="text-sm font-semibold text-slate-100">Confusion Matrix on Unseen Strings</h4>
              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-3 text-center font-mono">
                  <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl">
                    <span className="text-xs text-slate-400 block font-sans">True Positives (TP)</span>
                    <span className="text-2xl font-bold text-emerald-400">{metrics.confusion_matrix.tp}</span>
                  </div>
                  <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl">
                    <span className="text-xs text-slate-400 block font-sans">False Positives (FP)</span>
                    <span className="text-2xl font-bold text-rose-400">{metrics.confusion_matrix.fp}</span>
                  </div>
                  <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl">
                    <span className="text-xs text-slate-400 block font-sans">False Negatives (FN)</span>
                    <span className="text-2xl font-bold text-rose-400">{metrics.confusion_matrix.fn}</span>
                  </div>
                  <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl">
                    <span className="text-xs text-slate-400 block font-sans">True Negatives (TN)</span>
                    <span className="text-2xl font-bold text-emerald-400">{metrics.confusion_matrix.tn}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
