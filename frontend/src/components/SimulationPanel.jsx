import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import AutomataGraph from './AutomataGraph';

export default function SimulationPanel({
  inferredDfa,
  referenceDfa,
  alphabet = ['0', '1']
}) {
  const [testString, setTestString] = useState('0101');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(800); // ms per step

  const [inferredTrace, setInferredTrace] = useState([]);
  const [refTrace, setRefTrace] = useState([]);

  // Precompute traces on client or whenever testString or DFA changes
  useEffect(() => {
    const simulateClient = (dfa, word) => {
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

    setInferredTrace(simulateClient(inferredDfa, testString));
    setRefTrace(simulateClient(referenceDfa, testString));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [testString, inferredDfa, referenceDfa]);

  // Autoplay timer
  const timerRef = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      const maxSteps = Math.max(inferredTrace.length, refTrace.length) - 1;
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
  }, [isPlaying, inferredTrace, refTrace, playSpeed]);

  const maxSteps = Math.max(inferredTrace.length, refTrace.length) - 1;
  const currentInferredStep = inferredTrace[Math.min(currentStep, inferredTrace.length - 1)];
  const currentRefStep = refTrace[Math.min(currentStep, refTrace.length - 1)];

  const isFinalStep = currentStep === maxSteps && maxSteps >= 0;

  return (
    <div className="space-y-6">
      {/* Simulation Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Input String to Simulate (w ∈ Σ*)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter string e.g. 10101"
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={() => setTestString('')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition-colors"
                title="Simulate empty string ε"
              >
                ε (Empty)
              </button>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1">Quick Presets:</span>
            <div className="flex space-x-1.5">
              {['0', '1', '00', '01', '10', '101', '1001', '1101'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTestString(preset)}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-sky-400 text-xs font-mono rounded-md border border-slate-700/60 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stepper Toolbar */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset to step 0"
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

          {/* Step indicator */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Inferred Model Status */}
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

          {/* Reference Model Status */}
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
      </div>

      {/* Side-by-Side Dual Automata Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AutomataGraph
            dfa={inferredDfa}
            title="Inferred DFA"
            subtitle="Pulsing node shows live active state"
            activeState={currentInferredStep?.state}
            height="380px"
          />
        </div>
        <div>
          <AutomataGraph
            dfa={referenceDfa}
            title="Reference Ground Truth DFA"
            subtitle="Comparing real-time transition behavior"
            activeState={currentRefStep?.state}
            height="380px"
          />
        </div>
      </div>

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
                <th className="py-2.5 px-4">Inferred State</th>
                <th className="py-2.5 px-4">Reference State</th>
                <th className="py-2.5 px-4">Remaining Unread</th>
                <th className="py-2.5 px-4">Agreement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {inferredTrace.map((itStep, idx) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
