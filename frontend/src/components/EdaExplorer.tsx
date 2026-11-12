'use client';

import React, { useState } from 'react';
import { EdaMetrics } from '../lib/types';
import {
  Database,
  PieChart as PieIcon,
  Table as TableIcon,
  Search,
  Grid,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface EdaExplorerProps {
  data: EdaMetrics;
}

const CLASS_COLORS: Record<string, string> = {
  DERMASON: '#3b82f6',
  SIRA: '#eab308',
  SEKER: '#10b981',
  HOROZ: '#06b6d4',
  CALI: '#8b5cf6',
  BARBUNYA: '#f97316',
  BOMBAY: '#ec4899',
};

export const EdaExplorer: React.FC<EdaExplorerProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorrFeature, setSelectedCorrFeature] = useState<string>('Area');

  // Distribution chart data
  const distData = data.class_distribution.map((d) => ({
    name: d.class,
    count: d.count,
    percentage: d.percentage,
    color: CLASS_COLORS[d.class] || '#64748b',
  }));

  // Filter features
  const filteredFeatures = Object.values(data.feature_statistics).filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featureNames = data.correlation.features;
  const selectedCorrIdx = featureNames.indexOf(selectedCorrFeature);
  const corrRow = selectedCorrIdx >= 0 ? data.correlation.matrix[selectedCorrIdx] : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Total Dataset Records
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {data.dataset_summary.total_samples.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">
            {data.dataset_summary.duplicate_records} duplicates cleaned
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Geometric Features
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {data.dataset_summary.feature_count} Continuous
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Computer vision segmented</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Target Cultivars
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {data.dataset_summary.target_classes_count} Varieties
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dry bean cultivars</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Missing Values
          </div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {data.dataset_summary.missing_values}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">100% clean completeness</div>
        </div>
      </div>

      {/* Class Distribution Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-amber-400" />
              <span>Target Class Frequency & Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of specimens across the 7 commercial dry bean classes
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} beans (${item.payload.percentage}%)`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Correlation Interactive Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Grid className="w-5 h-5 text-amber-400" />
              <span>Pearson Correlation Coefficients Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a target feature to inspect positive and negative collinearities
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Focus Feature:</span>
            <select
              value={selectedCorrFeature}
              onChange={(e) => setSelectedCorrFeature(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {featureNames.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Correlation Bar Chart for Selected Feature */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mt-4">
          {featureNames.map((fn, idx) => {
            const corr = corrRow[idx] ?? 0;
            const isSelf = fn === selectedCorrFeature;
            let bgColor = 'bg-slate-800/60';
            let textColor = 'text-slate-300';
            if (isSelf) {
              bgColor = 'bg-amber-500/20 border-amber-500/40';
              textColor = 'text-amber-300';
            } else if (corr > 0.7) {
              bgColor = 'bg-emerald-500/20 border-emerald-500/30';
              textColor = 'text-emerald-400';
            } else if (corr < -0.7) {
              bgColor = 'bg-rose-500/20 border-rose-500/30';
              textColor = 'text-rose-400';
            }

            return (
              <div
                key={fn}
                className={`p-2 rounded-xl border border-slate-800 text-center transition-all ${bgColor}`}
              >
                <div className="text-[10px] text-slate-400 font-medium truncate" title={fn}>
                  {fn}
                </div>
                <div className={`text-xs font-mono font-bold mt-1 ${textColor}`}>
                  {corr > 0 ? `+${corr.toFixed(2)}` : corr.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Summary Statistics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TableIcon className="w-4 h-4 text-cyan-400" />
            <span>Descriptive Statistics (16 Morphological Features)</span>
          </h3>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search feature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3">Mean</th>
                <th className="py-2.5 px-3">Std Dev</th>
                <th className="py-2.5 px-3">Min</th>
                <th className="py-2.5 px-3">Median</th>
                <th className="py-2.5 px-3">Max</th>
                <th className="py-2.5 px-3">Skewness</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((f) => (
                <tr
                  key={f.name}
                  className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2 px-3 font-semibold text-white">{f.name}</td>
                  <td className="py-2 px-3 font-mono text-slate-300">
                    {f.mean.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {f.std.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {f.min.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-cyan-400">
                    {f.median.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {f.max.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">{f.skewness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
