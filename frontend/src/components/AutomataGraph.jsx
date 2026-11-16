import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { Maximize2, RefreshCw } from 'lucide-react';

export default function AutomataGraph({
  dfa,
  title = "Automaton Graph",
  subtitle = "",
  activeState = null,
  highlightEdge = null,
  height = "380px"
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !dfa || !dfa.states) return;

    // Aggregate parallel transitions between same source and target
    const edgeMap = new Map();
    (dfa.transitions || []).forEach(edge => {
      const key = `${edge.from}->${edge.to}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { from: edge.from, to: edge.to, labels: [] });
      }
      edgeMap.get(key).labels.push(edge.label);
    });

    const elements = [];

    // Nodes
    dfa.states.forEach(state => {
      const isStart = state === dfa.start_state;
      const isAccepting = (dfa.accepting_states || []).includes(state);
      const isActive = activeState === state;

      elements.push({
        group: 'nodes',
        data: {
          id: state,
          label: isStart ? `→ ${state}` : state,
          isStart,
          isAccepting,
          isActive
        }
      });
    });

    // Edges
    edgeMap.forEach((val, key) => {
      const combinedLabel = val.labels.sort().join(', ');
      elements.push({
        group: 'edges',
        data: {
          id: key,
          source: val.from,
          target: val.to,
          label: combinedLabel
        }
      });
    });

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      boxSelectionEnabled: false,
      autounselectify: true,
      style: [
        {
          selector: 'node',
          style: {
            'content': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#f8fafc',
            'font-family': 'monospace',
            'font-size': '13px',
            'font-weight': 'bold',
            'background-color': '#1e293b',
            'border-width': '2px',
            'border-color': '#38bdf8',
            'width': '46px',
            'height': '46px',
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node[?isAccepting]',
          style: {
            'border-style': 'double',
            'border-width': '5px',
            'border-color': '#34d399',
            'background-color': '#064e3b'
          }
        },
        {
          selector: 'node[?isStart]',
          style: {
            'border-color': '#60a5fa'
          }
        },
        {
          selector: 'node[?isActive]',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#fbbf24',
            'border-width': '6px',
            'color': '#0f172a',
            'width': '52px',
            'height': '52px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'color': '#cbd5e1',
            'font-size': '11px',
            'font-weight': 'bold',
            'font-family': 'monospace',
            'text-background-opacity': 0.85,
            'text-background-color': '#0f172a',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'arrow-scale': 1.1,
            'loop-direction': '-45deg',
            'loop-sweep': '-90deg'
          }
        }
      ],
      layout: {
        name: dfa.states.length <= 4 ? 'circle' : 'cose',
        animate: false,
        padding: 30,
        nodeOverlap: 20
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [dfa, activeState]);

  const fitView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 30);
    }
  };

  const relayout = () => {
    if (cyRef.current && dfa && dfa.states) {
      const layout = cyRef.current.layout({
        name: dfa.states.length <= 4 ? 'circle' : 'cose',
        animate: true,
        animationDuration: 300,
        padding: 30
      });
      layout.run();
    }
  };

  if (!dfa || !dfa.states || dfa.states.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500" style={{ height }}>
        <p className="text-sm">No automaton model loaded.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            |Q|={dfa.states?.length || 0}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono">
            |F|={dfa.accepting_states?.length || 0}
          </span>
          <button
            onClick={fitView}
            title="Fit to view"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={relayout}
            title="Re-layout nodes"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="w-full relative" style={{ height }} />
      <div className="px-3 py-1.5 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-900/40 inline-block mr-1"></span> Start</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-emerald-900/40 inline-block mr-1"></span> Accepting (F)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mr-1"></span> Active State</span>
        </div>
        <span className="text-slate-500 font-mono">Drag nodes to reposition</span>
      </div>
    </div>
  );
}
