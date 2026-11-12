'use client';

import React, { useState } from 'react';
import { FeatureImportanceData } from '../lib/types';
import { Activity, Target, Compass, Sparkles } from 'lucide-react';
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

interface FeatureImportanceProps {
  data: FeatureImportanceData;
}

const FEATURE_EXPLANATIONS: Record<string, string> = {
  Perimeter: 'Circumference boundary distance. Strongly discriminates large vs small beans.',
  ConvexArea: 'Area of minimal convex polygon wrapping the seed. Key differentiator for Bombay and Cali.',
  MinorAxisLength: 'Shortest diameter. Critical in separating elongated (Horoz) from spherical (Seker) seeds.',
  MajorAxisLength: 'Longest axis length. Differentiates elongated kidney types from squat varieties.',
  Area: 'Total pixel count inside bean perimeter. Absolute seed mass proxy.',
  EquivDiameter: 'Diameter of an equivalent circle. Strongly correlated with volumetric mass.',
  Compactness: 'Measure of spherical compactness. Maximized in Seker (nearly 0.90) and lowest in Horoz.',
  ShapeFactor1: 'Ratio of Major Axis to Area. Highly sensitive to oblong elongation.',
  ShapeFactor3: 'Morphological ratio isolating boundary convexity.',
  Eccentricity: 'Elliptic flatness factor. Differentiates round beans from elongated beans.',
  AspectRation: 'Ratio of Major to Minor axis. Horoz seeds exhibit the highest aspect ratio (~2.0+).',
  roundness: 'Circularity factor: 4*pi*Area/Perimeter^2. Critical in identifying Seker varieties.',
  ShapeFactor2: 'Ratio of Minor Axis to Area.',
  Solidity: 'Density of pixel occupancy within convex polygon (Area / ConvexArea).',
  ShapeFactor4: 'Fourth morphological harmonic descriptor.',
  Extent: 'Bounding box area fill fraction.',
};

export const FeatureImportanceView: React.FC<FeatureImportanceProps> = ({ data }) => {
  const [activeMethod, setActiveMethod] = useState<'rf' | 'anova'>('rf');

  // Chart data for Random Forest
  const rfChartData = data.random_forest_importance.map((item) => ({
    feature: item.feature,
    value: item.importance_percentage,
    rank: item.rank,
  }));

  // Chart data for ANOVA
  const anovaChartData = data.anova_f_test.map((item) => ({
    feature: item.feature,
    value: item.score_normalized,
    fScore: item.f_score,
    rank: item.rank,
  }));

  const chartData = activeMethod === 'rf' ? rfChartData : anovaChartData;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>Morphological Feature Importance & Ranking</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Analysis combining univariate statistical significance (ANOVA F-test) and multi-variate non-linear decision tree entropy reduction (Random Forest Gini Impurity).
            </p>
          </div>

          {/* Method Toggle Buttons */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs self-start md:self-auto">
            <button
              onClick={() => setActiveMethod('rf')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
                activeMethod === 'rf'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Random Forest (Gini %)</span>
            </button>
            <button
              onClick={() => setActiveMethod('anova')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
                activeMethod === 'anova'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>ANOVA F-Test (Normalized)</span>
            </button>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                domain={[0, 'dataMax + 2']}
              />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [
                  activeMethod === 'rf' ? `${val}% Importance` : `${val} / 100 Score`,
                  activeMethod === 'rf' ? 'Gini Contribution' : 'F-Score Index',
                ]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index < 3 ? '#f59e0b' : index < 7 ? '#10b981' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composite Ranking Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Composite Feature Discriminability Matrix</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Overall Rank</th>
                <th className="py-2.5 px-3">Feature Name</th>
                <th className="py-2.5 px-3">ANOVA Rank</th>
                <th className="py-2.5 px-3">Random Forest Rank</th>
                <th className="py-2.5 px-3">Morphological Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {data.composite_ranking.map((item) => (
                <tr
                  key={item.feature}
                  className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        item.final_rank <= 3
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : item.final_rank <= 7
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.final_rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">{item.feature}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">#{item.anova_rank}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">#{item.rf_rank}</td>
                  <td className="py-2.5 px-3 text-slate-400 max-w-md">
                    {FEATURE_EXPLANATIONS[item.feature] || 'Geometric bean property.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
