import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle, XCircle, GitFork, ArrowRight, Sparkles } from 'lucide-react';
import AutomataGraph from './AutomataGraph';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function SimulationPanel({
  inferredDfa,
  referenceDfa,
  referenceNfa,
  alphabet = ['0', '1']
}) {
  const [modelMode, setModelMode] = useState('dfa'); // 'dfa' or 'nfa'
  const [testString, setTestString] = useState('0101');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(800);

  const [inferredTrace, setInferredTrace] = useState([]);
  const [refTrace, setRefTrace] = useState([]);
  const [nfaTrace, setNfaTrace] = useState([]);
  const [subsetDfa, setSubsetDfa] = useState(null);
  const [subsetLoading, setSubsetLoading] = useState(false);

  // 1. Client-side DFA Simulation
  const simulateDfa = (dfa, word) => {
    if (!dfa || !dfa.states) return [];
    const trace = [];
    let curr = dfa.start_state;
    trace.push({
      step: 0,
      state: curr,
      char: null,
      is_accepting: (dfa.accepting_states || []).includes(curr),
      remaining: word
    });

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const nextState = dfa.transition_table?.[curr]?.[ch];
      if (!nextState) {
        trace.push({
          step: i + 1,
          state: null,
          char: ch,
          is_accepting: false,
          remaining: word.slice(i + 1),
          stuck: true
        });
        break;
      }
      trace.push({
        step: i + 1,
        state: nextState,
        char: ch,
        is_accepting: (dfa.accepting_states || []).includes(nextState),
        remaining: word.slice(i + 1),
        stuck: false
      });
      curr = nextState;
    }
    return trace;
  };

  // 2. Client-side NFA Simulation (tracking active state sets)
  const simulateNfa = (nfa, word) => {
    if (!nfa || !nfa.states) return [];
    const transitions = {};
    (nfa.transitions || []).forEach(e => {
      if (!transitions[e.from]) transitions[e.from] = {};
      if (!transitions[e.from][e.label]) transitions[e.from][e.label] = new Set();
      transitions[e.from][e.label].add(e.to);
    });

    const trace = [];
    let currentStates = new Set([nfa.start_state]);
    const isAcc = (states) => Array.from(states).some(s => (nfa.accepting_states || []).includes(s));

    trace.push({
      step: 0,
      active_states: Array.from(currentStates),
      char: null,
      is_accepting: isAcc(currentStates),
      remaining: word
    });

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const nextStates = new Set();
      currentStates.forEach(s => {
        const targets = transitions[s]?.[ch];
        if (targets) {
          targets.forEach(t => nextStates.add(t));
        }
      });

      currentStates = nextStates;
      trace.push({
        step: i + 1,
        active_states: Array.from(currentStates),
        char: ch,
        is_accepting: isAcc(currentStates),
        remaining: word.slice(i + 1),
        stuck: currentStates.size === 0
      });

      if (currentStates.size === 0) break;
    }
    return trace;
  };

  useEffect(() => {
    setInferredTrace(simulateDfa(inferredDfa, testString));
    setRefTrace(simulateDfa(referenceDfa, testString));
    setNfaTrace(simulateNfa(referenceNfa, testString));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [testString, inferredDfa, referenceDfa, referenceNfa]);

  // Autoplay timer
  const timerRef = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      const maxSteps = modelMode === 'dfa'
        ? Math.max(inferredTrace.length, refTrace.length) - 1
        : nfaTrace.length - 1;

      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, inferredTrace, refTrace, nfaTrace, playSpeed, modelMode]);

  // Handle Subset Construction
  const handleSubsetConstruction = async () => {
    if (!referenceNfa) return;
    try {
      setSubsetLoading(true);
      const res = await fetch(`${API_BASE}/nfa/to_dfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfa_data: referenceNfa })
      });
      if (!res.ok) throw new Error("Subset construction failed");
      const data = await res.json();
      setSubsetDfa(data.dfa);
    } catch (err) {
      console.error(err);
    } finally {
      setSubsetLoading(false);
    }
  };

  const currentInferredStep = inferredTrace[currentStep] || inferredTrace[inferredTrace.length - 1];
  const currentRefStep = refTrace[currentStep] || refTrace[refTrace.length - 1];
  const currentNfaStep = nfaTrace[currentStep] || nfaTrace[nfaTrace.length - 1];

  const maxSteps = modelMode === 'dfa'
    ? Math.max(inferredTrace.length, refTrace.length) - 1
    : Math.max(0, nfaTrace.length - 1);

  const isFinalStep = currentStep === maxSteps;

  return (
    <div className="space-y-6">
      {/* Mode Switch: DFA Mode vs NFA Mode */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => { setModelMode('dfa'); setCurrentStep(0); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              modelMode === 'dfa'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            DFA Mode (Deterministic Simulation)
          </button>
          <button
            onClick={() => { setModelMode('nfa'); setCurrentStep(0); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              modelMode === 'nfa'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>NFA Mode (Nondeterministic Simulation)</span>
          </button>
        </div>

        {modelMode === 'nfa' && referenceNfa && (
          <button
            onClick={handleSubsetConstruction}
            disabled={subsetLoading}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium rounded-lg shadow transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{subsetLoading ? "Determinizing..." : "Convert NFA to DFA (Subset Construction)"}</span>
          </button>
        )}
      </div>

      {/* Top Test String Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[260px]">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Input String to Test & Simulate:
            </label>
            <div className="relative">
              <input
                type="text"
                value={testString}
                onChange={(e) => setTestString(e.target.value.trim())}
                placeholder="e.g. 0101 or empty for ε"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="block text-xs text-slate-400 mb-1.5">Quick Examples:</span>
            <div className="flex space-x-1.5">
              {['', '0', '1', '01', '101', '0101', '0000', '1111'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTestString(preset)}
                  className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                >
                  {preset === '' ? 'ε' : preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCurrentStep(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
              disabled={currentStep === 0}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              title="Step backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
            </button>
            <button
              onClick={() => { setCurrentStep(prev => Math.min(maxSteps, prev + 1)); setIsPlaying(false); }}
              disabled={currentStep >= maxSteps}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              title="Step forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono text-slate-400">
              Step: <strong className="text-sky-400 text-sm">{currentStep}</strong> / {maxSteps}
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span>Speed:</span>
              <select
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1"
              >
                <option value={1200}>0.5x</option>
                <option value={800}>1.0x</option>
                <option value={400}>2.0x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current Execution State Banner */}
        {modelMode === 'dfa' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Inferred DFA State:</span>
                <span className="font-mono text-lg font-bold text-sky-400">
                  {currentInferredStep?.state || 'TRAP/DEAD'}
                </span>
              </div>
              {isFinalStep && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  currentInferredStep?.is_accepting
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {currentInferredStep?.is_accepting ? (
                    <><CheckCircle className="w-3.5 h-3.5 mr-1" /> ACCEPTED</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5 mr-1" /> REJECTED</>
                  )}
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Reference Ground Truth State:</span>
                <span className="font-mono text-lg font-bold text-indigo-400">
                  {currentRefStep?.state || 'TRAP/DEAD'}
                </span>
              </div>
              {isFinalStep && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  currentRefStep?.is_accepting
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {currentRefStep?.is_accepting ? (
                    <><CheckCircle className="w-3.5 h-3.5 mr-1" /> ACCEPTED</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5 mr-1" /> REJECTED</>
                  )}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950/70 border border-purple-900/40 rounded-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-purple-300 font-semibold block">Nondeterministic Active State Set:</span>
              <span className="font-mono text-xl font-bold text-purple-400">
                {currentNfaStep?.active_states?.length > 0
                  ? `{ ${currentNfaStep.active_states.join(', ')} }`
                  : '∅ (No Active Paths)'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Notice multiple states can be occupied in parallel!
              </span>
            </div>
            {isFinalStep && (
              <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold ${
                currentNfaStep?.is_accepting
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {currentNfaStep?.is_accepting ? (
                  <><CheckCircle className="w-3.5 h-3.5 mr-1" /> NFA ACCEPTS (Intersection with F ≠ ∅)</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5 mr-1" /> NFA REJECTS (No accepting path)</>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Graphs Area */}
      {modelMode === 'dfa' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AutomataGraph
            dfa={inferredDfa}
            title="Inferred DFA"
            subtitle="Pulsing node shows live active state"
            activeState={currentInferredStep?.state}
            height="380px"
          />
          <AutomataGraph
            dfa={referenceDfa}
            title="Reference Ground Truth DFA"
            subtitle="Comparing real-time transition behavior"
            activeState={currentRefStep?.state}
            height="380px"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AutomataGraph
            dfa={referenceNfa}
            title="Reference Nondeterministic Finite Automaton (NFA)"
            subtitle="Amber nodes show the active state set at current step"
            activeStates={currentNfaStep?.active_states}
            height="380px"
          />
          {subsetDfa ? (
            <AutomataGraph
              dfa={subsetDfa}
              title="Determinized DFA (via Subset Construction)"
              subtitle={`Generated by Rabin-Scott Powerset Construction (${subsetDfa.states?.length || 0} states)`}
              height="380px"
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <GitFork className="w-10 h-10 text-purple-400 mb-3 opacity-60" />
              <h5 className="text-sm font-semibold text-slate-200">Subset Construction Not Yet Computed</h5>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                Click "Convert NFA to DFA (Subset Construction)" above to mathematically determinize this NFA into an equivalent DFA!
              </p>
              <button
                onClick={handleSubsetConstruction}
                disabled={subsetLoading || !referenceNfa}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg shadow transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Subset Construction</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step Trace Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <h4 className="text-sm font-semibold text-slate-100">Step-by-Step Transition Log</h4>
          <span className="text-xs text-slate-400 font-mono">Word: "{testString || 'ε'}"</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Step</th>
                <th className="py-2.5 px-4">Symbol Read</th>
                {modelMode === 'dfa' ? (
                  <>
                    <th className="py-2.5 px-4">Inferred State</th>
                    <th className="py-2.5 px-4">Reference State</th>
                    <th className="py-2.5 px-4">Remaining Unread</th>
                    <th className="py-2.5 px-4">Agreement</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-4">NFA Active State Set</th>
                    <th className="py-2.5 px-4">Remaining Unread</th>
                    <th className="py-2.5 px-4">Acceptance Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {modelMode === 'dfa'
                ? inferredTrace.map((itStep, idx) => {
                    const refStep = refTrace[idx] || {};
                    const isCurrent = idx === currentStep;
                    const match = itStep.is_accepting === refStep.is_accepting;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`cursor-pointer transition-colors ${
                          isCurrent ? 'bg-sky-950/50 text-sky-200 font-semibold' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-4">{itStep.step}</td>
                        <td className="py-2 px-4 text-amber-300 font-bold">
                          {itStep.char !== null ? `'${itStep.char}'` : <span className="text-slate-500 italic">start</span>}
                        </td>
                        <td className="py-2 px-4 font-bold text-sky-400">{itStep.state}</td>
                        <td className="py-2 px-4 font-bold text-indigo-400">{refStep.state}</td>
                        <td className="py-2 px-4 text-slate-400">"{itStep.remaining || 'ε'}"</td>
                        <td className="py-2 px-4">
                          {idx === inferredTrace.length - 1 ? (
                            match ? (
                              <span className="text-emerald-400 font-semibold">Both Agree</span>
                            ) : (
                              <span className="text-rose-400 font-semibold">Disagreement</span>
                            )
                          ) : (
                            <span className="text-slate-500">In transit</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                : nfaTrace.map((nStep, idx) => {
                    const isCurrent = idx === currentStep;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`cursor-pointer transition-colors ${
                          isCurrent ? 'bg-purple-950/50 text-purple-200 font-semibold' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-4">{nStep.step}</td>
                        <td className="py-2 px-4 text-amber-300 font-bold">
                          {nStep.char !== null ? `'${nStep.char}'` : <span className="text-slate-500 italic">start</span>}
                        </td>
                        <td className="py-2 px-4 font-bold text-purple-300">
                          {nStep.active_states.length > 0 ? `{ ${nStep.active_states.join(', ')} }` : '∅'}
                        </td>
                        <td className="py-2 px-4 text-slate-400">"{nStep.remaining || 'ε'}"</td>
                        <td className="py-2 px-4">
                          {idx === nfaTrace.length - 1 ? (
                            nStep.is_accepting ? (
                              <span className="text-emerald-400 font-semibold">ACCEPTED</span>
                            ) : (
                              <span className="text-rose-400 font-semibold">REJECTED</span>
                            )
                          ) : (
                            <span className="text-slate-500">In transit</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
