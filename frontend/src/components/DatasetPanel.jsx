import React, { useState } from 'react';
import { Database, Plus, Trash2, Shuffle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function DatasetPanel({
  benchmarks,
  selectedBenchmark,
  setSelectedBenchmark,
  dataset,
  onGenerateDataset,
  onUpdateDataset,
  loading
}) {
  const [trainSize, setTrainSize] = useState(40);
  const [testSize, setTestSize] = useState(60);
  const [maxLen, setMaxLen] = useState(7);
  const [noiseRate, setNoiseRate] = useState(0.0);
  const [customWord, setCustomWord] = useState('');
  const [customLabel, setCustomLabel] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('train');
  const [filterType, setFilterType] = useState('all');

  const currentBenchmark = benchmarks.find(b => b.id === selectedBenchmark) || benchmarks[0];

  const handleGenerate = () => {
    onGenerateDataset({
      benchmark_id: selectedBenchmark,
      train_size: trainSize,
      test_size: testSize,
      max_len: maxLen,
      noise_rate: noiseRate,
      seed: Math.floor(Math.random() * 100000)
    });
  };

  const handleAddCustomString = (e) => {
    e.preventDefault();
    if (!dataset || !dataset.train) return;
    const cleanWord = customWord.trim();
    const newItem = {
      word: cleanWord === '' ? 'ε' : cleanWord,
      raw_word: cleanWord,
      label: customLabel,
      original_label: customLabel,
      is_noisy: false,
      length: cleanWord.length
    };
    const updatedTrain = [newItem, ...dataset.train];
    onUpdateDataset({
      ...dataset,
      train: updatedTrain,
      train_stats: {
        ...dataset.train_stats,
        total: updatedTrain.length,
        positives: updatedTrain.filter(i => i.label).length,
        negatives: updatedTrain.filter(i => !i.label).length
      }
    });
    setCustomWord('');
  };

  const handleToggleLabel = (index) => {
    if (!dataset || !dataset.train) return;
    const updated = [...dataset.train];
    updated[index] = {
      ...updated[index],
      label: !updated[index].label,
      is_noisy: true
    };
    onUpdateDataset({
      ...dataset,
      train: updated,
      train_stats: {
        ...dataset.train_stats,
        positives: updated.filter(i => i.label).length,
        negatives: updated.filter(i => !i.label).length,
        noisy_labels: updated.filter(i => i.is_noisy).length
      }
    });
  };

  const handleDeleteItem = (index) => {
    if (!dataset || !dataset.train) return;
    const updated = dataset.train.filter((_, idx) => idx !== index);
    onUpdateDataset({
      ...dataset,
      train: updated,
      train_stats: {
        ...dataset.train_stats,
        total: updated.length,
        positives: updated.filter(i => i.label).length,
        negatives: updated.filter(i => !i.label).length
      }
    });
  };

  const items = activeSubTab === 'train' ? dataset?.train || [] : dataset?.test || [];
  const filteredItems = items.filter(it => {
    if (filterType === 'positives') return it.label;
    if (filterType === 'negatives') return !it.label;
    if (filterType === 'noisy') return it.is_noisy;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Column */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center">
            <Database className="w-5 h-5 text-sky-400 mr-2" />
            Language & Sampling Config
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose a target formal regular language and configure sample distribution parameters.
          </p>
        </div>

        {/* Benchmark Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Target TOC Benchmark Language
          </label>
          <select
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (Σ = {'{'}{b.alphabet.join(', ')}{'}'})
              </option>
            ))}
          </select>
        </div>

        {/* Benchmark Details Card */}
        {currentBenchmark && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Alphabet:</span>
              <span className="font-mono text-sky-400">Σ = {'{'}{currentBenchmark.alphabet?.join(', ')}{'}'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Min States:</span>
              <span className="font-mono text-emerald-400">{currentBenchmark.state_count} states</span>
            </div>
            <div className="text-slate-300 italic pt-1 border-t border-slate-800/50">
              {currentBenchmark.formal_definition}
            </div>
            <div className="text-slate-400">
              {currentBenchmark.description}
            </div>
          </div>
        )}

        {/* Parameter Sliders */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Training Samples (N_train)</span>
              <span className="font-mono text-sky-400 font-semibold">{trainSize}</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={trainSize}
              onChange={(e) => setTrainSize(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Test Samples (N_test, Unseen)</span>
              <span className="font-mono text-sky-400 font-semibold">{testSize}</span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={testSize}
              onChange={(e) => setTestSize(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Max String Length (L_max)</span>
              <span className="font-mono text-sky-400 font-semibold">{maxLen}</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              value={maxLen}
              onChange={(e) => setMaxLen(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Synthetic Label Noise (η)
              </span>
              <span className="font-mono text-amber-400 font-semibold">{Math.round(noiseRate * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.4"
              step="0.05"
              value={noiseRate}
              onChange={(e) => setNoiseRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Flips labels of a fraction η of training examples to simulate imperfect / corrupted observations.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Shuffle className="w-4 h-4" />
          <span>{loading ? "Generating..." : "Generate Dataset"}</span>
        </button>

        {/* Add custom string */}
        <form onSubmit={handleAddCustomString} className="pt-3 border-t border-slate-800 space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Add Custom Training String
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. 10101 (or blank for ε)"
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setCustomLabel(!customLabel)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                customLabel
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                  : 'bg-rose-950 text-rose-400 border-rose-700'
              }`}
            >
              {customLabel ? '+ Accept' : '− Reject'}
            </button>
            <button
              type="submit"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 transition-colors"
              title="Add to training set"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Dataset Table Column */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
        {/* Table Header & Controls */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('train')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeSubTab === 'train'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Training Set ({dataset?.train?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('test')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeSubTab === 'test'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unseen Test Set ({dataset?.test?.length || 0})
            </button>
          </div>

          {/* Filter options */}
          <div className="flex items-center space-x-1 text-xs">
            {['all', 'positives', 'negatives', 'noisy'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  filterType === type
                    ? 'bg-slate-700 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex space-x-4">
            <span>Total: <strong className="text-slate-200">{filteredItems.length}</strong></span>
            <span className="text-emerald-400">Positives (+): {items.filter(i => i.label).length}</span>
            <span className="text-rose-400">Negatives (−): {items.filter(i => !i.label).length}</span>
            {activeSubTab === 'train' && (
              <span className="text-amber-400">Flipped Noisy: {items.filter(i => i.is_noisy).length}</span>
            )}
          </div>
          <span>Avg Length: {activeSubTab === 'train' ? dataset?.train_stats?.avg_length : dataset?.test_stats?.avg_length || 0}</span>
        </div>

        {/* Table content */}
        <div className="flex-1 overflow-y-auto max-h-[440px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/40 text-slate-400 uppercase sticky top-0 z-10 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">String (w)</th>
                <th className="py-2.5 px-4">Length |w|</th>
                <th className="py-2.5 px-4">Observed Label</th>
                {activeSubTab === 'train' && <th className="py-2.5 px-4">Status / Quality</th>}
                {activeSubTab === 'train' && <th className="py-2.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-4 text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-4 font-semibold text-sky-300">
                    {item.word === '' || item.word === 'ε' ? (
                      <span className="text-amber-400 italic">ε (empty)</span>
                    ) : (
                      item.word
                    )}
                  </td>
                  <td className="py-2 px-4 text-slate-400">{item.length}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.label
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                      }`}
                    >
                      {item.label ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {item.label ? '+ POSITIVE' : '− NEGATIVE'}
                    </span>
                  </td>
                  {activeSubTab === 'train' && (
                    <td className="py-2 px-4">
                      {item.is_noisy ? (
                        <span className="inline-flex items-center text-amber-400 text-[11px]">
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
                          Corrupted Label
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Clean Truth</span>
                      )}
                    </td>
                  )}
                  {activeSubTab === 'train' && (
                    <td className="py-2 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleLabel(idx)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                        title="Invert label"
                      >
                        Flip
                      </button>
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete string"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No strings match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
