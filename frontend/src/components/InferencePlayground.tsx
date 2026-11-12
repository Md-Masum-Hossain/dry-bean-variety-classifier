'use client';

import React, { useState } from 'react';
import {
  BeanFeatures,
  PredictionResponse,
  SampleRecord,
} from '../lib/types';
import { predictBeanVariety } from '../lib/api';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sliders,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface InferencePlaygroundProps {
  samples: SampleRecord[];
  modelsList: string[];
}

const CULTIVAR_DESCRIPTIONS: Record<string, { desc: string; color: string; badge: string }> = {
  BARBUNYA: {
    desc: 'Oval mottled pinto-type bean with medium-large size and characteristic shape.',
    color: '#f97316',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  BOMBAY: {
    desc: 'Massive white bean with the largest Area, Perimeter, and ConvexArea in the dataset.',
    color: '#ec4899',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  CALI: {
    desc: 'Long elliptical cultivar with high MajorAxisLength and medium eccentricity.',
    color: '#8b5cf6',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  DERMASON: {
    desc: 'Medium-small flattened white bean, the most prevalent commercial dry bean.',
    color: '#3b82f6',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  HOROZ: {
    desc: 'Distinctive elongated cylindrical white kidney-type bean with high Aspect Ratio.',
    color: '#06b6d4',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  SEKER: {
    desc: 'Small spherical pea-bean with exceptionally high Roundness and Compactness.',
    color: '#10b981',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  SIRA: {
    desc: 'Small oblong bean sharing morphological proximity to Dermason with distinct shape factors.',
    color: '#eab308',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
};

const DEFAULT_FEATURES: BeanFeatures = {
  Area: 42339.0,
  Perimeter: 759.526,
  MajorAxisLength: 273.49,
  MinorAxisLength: 197.66,
  AspectRation: 1.3836,
  Eccentricity: 0.6917,
  ConvexArea: 42795.0,
  EquivDiameter: 232.18,
  Extent: 0.7634,
  Solidity: 0.9893,
  roundness: 0.9231,
  Compactness: 0.8489,
  ShapeFactor1: 0.006459,
  ShapeFactor2: 0.002166,
  ShapeFactor3: 0.7207,
  ShapeFactor4: 0.9972,
};

export const InferencePlayground: React.FC<InferencePlaygroundProps> = ({
  samples,
  modelsList,
}) => {
  const [features, setFeatures] = useState<BeanFeatures>(DEFAULT_FEATURES);
  const [selectedModel, setSelectedModel] = useState<string>('Support Vector Machine');
  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loadedGroundTruth, setLoadedGroundTruth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof BeanFeatures, value: string) => {
    const num = parseFloat(value);
    setFeatures((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num,
    }));
  };

  const handleLoadSample = (sample: SampleRecord) => {
    setFeatures({ ...sample.features });
    setLoadedGroundTruth(sample.ground_truth);
    setError(null);
  };

  const handleReset = () => {
    setFeatures(DEFAULT_FEATURES);
    setLoadedGroundTruth(null);
    setPrediction(null);
    setError(null);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictBeanVariety(features, selectedModel);
      setPrediction(res);
    } catch (err: any) {
      setError(err?.message || 'Inference execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for probability distribution
  const chartData = prediction
    ? Object.entries(prediction.class_probabilities)
        .map(([cls, prob]) => ({
          name: cls,
          probability: Math.round(prob * 1000) / 10,
        }))
        .sort((a, b) => b.probability - a.probability)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Real-Time Geometric Inference Engine</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Test variety classification using 16 morphological parameters or load real test specimens below.
            </p>
          </div>

          {/* Model Selector Dropdown */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Classifier:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {modelsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Sample Beans Quick Loader */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Test Presets (Ground-Truth Verified):</span>
            </span>
            {loadedGroundTruth && (
              <span className="text-xs font-medium text-amber-400 flex items-center space-x-1">
                <span>Loaded specimen:</span>
                <strong className="underline">{loadedGroundTruth}</strong>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {samples.slice(0, 7).map((s, idx) => {
              const meta = CULTIVAR_DESCRIPTIONS[s.ground_truth] || {
                color: '#94a3b8',
                badge: 'bg-slate-800 text-slate-300',
              };
              const isSelected = loadedGroundTruth === s.ground_truth;
              return (
                <button
                  key={`${s.ground_truth}-${idx}`}
                  onClick={() => handleLoadSample(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>Sample {s.ground_truth}</span>
                </button>
              );
            })}
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-white transition-all flex items-center space-x-1"
              title="Reset values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs Left, Prediction Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 16 Feature Inputs Grouped */}
        <div className="lg:col-span-7 space-y-4">
          {/* Group 1: Area & Circumference */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center space-x-1.5">
              <span>1. Area & Circumference Metrics</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Area', 'Perimeter', 'ConvexArea', 'EquivDiameter'] as const).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-300 mb-1 truncate" title={key}>
                    {key}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={features[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Axis Measurements & Ratios */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center space-x-1.5">
              <span>2. Axis Dimensions & Eccentricity</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['MajorAxisLength', 'MinorAxisLength', 'AspectRation', 'Eccentricity'] as const).map(
                (key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-300 mb-1 truncate" title={key}>
                      {key}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={features[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Group 3: Morphological Shape Factors */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center space-x-1.5">
              <span>3. Form & Shape Factors (Morphology)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  'Extent',
                  'Solidity',
                  'roundness',
                  'Compactness',
                  'ShapeFactor1',
                  'ShapeFactor2',
                  'ShapeFactor3',
                  'ShapeFactor4',
                ] as const
              ).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-300 mb-1 truncate" title={key}>
                    {key}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={features[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Predict Action Button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Computing Morphological Inference...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-950" />
                <span>Classify Bean Variety with {selectedModel}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Prediction Results Card */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {prediction ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none rounded-full"
                style={{
                  backgroundColor:
                    CULTIVAR_DESCRIPTIONS[prediction.predicted_class]?.color || '#f59e0b',
                }}
              />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Predicted Cultivar
                </span>
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prediction.inference_time_ms} ms</span>
                </span>
              </div>

              {/* Cultivar Hero Badge */}
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-md"
                  style={{
                    backgroundColor: `${
                      CULTIVAR_DESCRIPTIONS[prediction.predicted_class]?.color || '#f59e0b'
                    }20`,
                    border: `1px solid ${
                      CULTIVAR_DESCRIPTIONS[prediction.predicted_class]?.color || '#f59e0b'
                    }50`,
                  }}
                >
                  🌾
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {prediction.predicted_class}
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Model: {prediction.model_used}
                    </span>
                    {loadedGroundTruth && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          loadedGroundTruth === prediction.predicted_class
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          {loadedGroundTruth === prediction.predicted_class
                            ? 'Matches Ground Truth'
                            : `GT: ${loadedGroundTruth}`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 mb-5 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                {CULTIVAR_DESCRIPTIONS[prediction.predicted_class]?.desc ||
                  'High confidence classification based on geometric aspect ratio and pixel moments.'}
              </p>

              {/* Confidence Meter */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Model Confidence</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(prediction.confidence * 100, 5)}%`,
                      backgroundColor:
                        CULTIVAR_DESCRIPTIONS[prediction.predicted_class]?.color || '#f59e0b',
                    }}
                  />
                </div>
              </div>

              {/* Class Probability Distribution Recharts */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cultivar Probability Spectrum
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        width={75}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Probability']}
                      />
                      <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => {
                          const isTop = entry.name === prediction.predicted_class;
                          const color = CULTIVAR_DESCRIPTIONS[entry.name]?.color || '#3b82f6';
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isTop ? color : '#334155'}
                              opacity={isTop ? 1.0 : 0.6}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Awaiting Prediction</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Choose any preset cultivar specimen above or modify geometric sliders, then click{' '}
                <strong className="text-amber-400">Classify Bean Variety</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
