'use client';

import React, { useState } from 'react';
import { ModelComparisonData, ModelMetric } from '../lib/types';
import {
  Trophy,
  Award,
  Zap,
  BarChart3,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ModelBenchmarkingProps {
  data: ModelComparisonData;
}

export const ModelBenchmarking: React.FC<ModelBenchmarkingProps> = ({ data }) => {
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [useNormalizedCm, setUseNormalizedCm] = useState<boolean>(true);

  const selectedModel: ModelMetric = data.models[selectedModelIdx] || data.models[0];

  // Recharts data for model comparison
  const comparisonData = data.models.map((m) => ({
    name: m.model_name.replace(' (MLP)', '').replace(' Machine', ''),
    fullName: m.model_name,
    Accuracy: Math.round(m.accuracy * 1000) / 10,
    'F1-Weighted': Math.round(m.f1_weighted * 1000) / 10,
    '5-Fold CV': Math.round(m.cv_f1_mean * 1000) / 10,
    TrainingTime: m.training_time_sec,
  }));

  const matrix = useNormalizedCm
    ? selectedModel.confusion_matrix_normalized
    : selectedModel.confusion_matrix;

  return (
    <div className="space-y-6">
      {/* Best Model Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Top Performing Classifier
              </span>
              <span className="text-xs text-slate-400">Evaluated on 2,709 holdout specimens</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              {data.best_model.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Achieved highest harmonic precision and recall across all 7 bean varieties with exceptional generalization stability in 5-fold stratified cross-validation.
            </p>
          </div>
        </div>

        {/* Highlight Score Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-3 text-center min-w-[95px]">
            <div className="text-xs font-semibold text-slate-400 uppercase">Test Acc</div>
            <div className="text-xl font-black text-amber-400">
              {(data.best_model.accuracy * 100).toFixed(2)}%
            </div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-3 text-center min-w-[95px]">
            <div className="text-xs font-semibold text-slate-400 uppercase">Weighted F1</div>
            <div className="text-xl font-black text-emerald-400">
              {(data.best_model.f1_weighted * 100).toFixed(2)}%
            </div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-3 text-center min-w-[95px]">
            <div className="text-xs font-semibold text-slate-400 uppercase">5-Fold CV</div>
            <div className="text-xl font-black text-cyan-400">
              {(data.best_model.cv_f1_mean * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Model Benchmark Comparison Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>Multi-Model Benchmark Metrics (Test vs CV)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Comparison across Classical ML and Deep Learning architectures (stratified holdout test set)
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis domain={[85, 95]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Accuracy" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1-Weighted" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="5-Fold CV" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Selector & Confusion Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Model Leaderboard */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Model Leaderboard</span>
          </h3>

          <div className="space-y-2">
            {data.models.map((model, idx) => {
              const isSelected = idx === selectedModelIdx;
              return (
                <button
                  key={model.model_name}
                  onClick={() => setSelectedModelIdx(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        model.rank === 1
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {model.rank}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{model.model_name}</div>
                      <div className="text-xs text-slate-400">
                        Training: {model.training_time_sec}s
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {(model.f1_weighted * 100).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-slate-400">F1 Score</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Confusion Matrix Heatmap */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Confusion Matrix: {selectedModel.model_name}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Rows = True Variety | Columns = Predicted Variety
              </p>
            </div>

            {/* Toggle Normalize */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setUseNormalizedCm(true)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  useNormalizedCm
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Percentages (%)
              </button>
              <button
                onClick={() => setUseNormalizedCm(false)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  !useNormalizedCm
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sample Counts
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-slate-400 font-semibold text-left">True \ Pred</th>
                  {selectedModel.class_labels.map((lbl) => (
                    <th key={lbl} className="p-2 text-slate-300 font-semibold truncate max-w-[60px]" title={lbl}>
                      {lbl.slice(0, 4)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedModel.class_labels.map((rowLabel, rIdx) => (
                  <tr key={rowLabel} className="border-t border-slate-800">
                    <td className="p-2 text-slate-300 font-semibold text-left truncate max-w-[80px]" title={rowLabel}>
                      {rowLabel}
                    </td>
                    {selectedModel.class_labels.map((colLabel, cIdx) => {
                      const val = matrix[rIdx]?.[cIdx] ?? 0;
                      const isDiagonal = rIdx === cIdx;
                      const normVal = selectedModel.confusion_matrix_normalized[rIdx]?.[cIdx] ?? 0;

                      // Color interpolation for diagonal and errors
                      let bgColor = 'rgba(30, 41, 59, 0.4)';
                      let textColor = '#64748b';
                      if (isDiagonal) {
                        bgColor = `rgba(16, 185, 129, ${Math.max(normVal, 0.2)})`;
                        textColor = normVal > 0.6 ? '#ffffff' : '#6ee7b7';
                      } else if (val > 0) {
                        bgColor = `rgba(239, 68, 68, ${Math.min(normVal * 3, 0.7)})`;
                        textColor = '#fca5a5';
                      }

                      return (
                        <td
                          key={`${rowLabel}-${colLabel}`}
                          className="p-2 font-mono font-medium rounded transition-colors"
                          style={{ backgroundColor: bgColor, color: textColor }}
                          title={`True: ${rowLabel}, Pred: ${colLabel}: ${val}`}
                        >
                          {useNormalizedCm ? `${(val * 100).toFixed(1)}%` : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Per-Class Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Per-Class Classification Report: {selectedModel.model_name}</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Bean Variety</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">Test Support</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(selectedModel.per_class_metrics).map(([cls, metric]) => (
                <tr key={cls} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white">{cls}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {(metric.precision * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {(metric.recall * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {(metric.f1_score * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{metric.support} beans</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
