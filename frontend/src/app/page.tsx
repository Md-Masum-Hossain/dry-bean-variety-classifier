'use client';

import React, { useState, useEffect } from 'react';
import {
  fetchHealth,
  fetchEdaMetrics,
  fetchModelBenchmarks,
  fetchFeatureImportance,
  fetchSampleRecords,
  fallbackEda,
  fallbackModels,
  fallbackFeatures,
  fallbackSamples,
} from '../lib/api';
import {
  EdaMetrics,
  FeatureImportanceData,
  ModelComparisonData,
  SampleRecord,
} from '../lib/types';
import { Header } from '../components/Header';
import { InferencePlayground } from '../components/InferencePlayground';
import { ModelBenchmarking } from '../components/ModelBenchmarking';
import { FeatureImportanceView } from '../components/FeatureImportanceView';
import { EdaExplorer } from '../components/EdaExplorer';

export default function Home() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('playground');

  const [health, setHealth] = useState<{
    status: string;
    models_loaded: string[];
    default_model: string;
  }>({
    status: 'checking',
    models_loaded: [
      'Support Vector Machine',
      'Deep Learning (MLP)',
      'XGBoost',
      'Logistic Regression',
      'Random Forest',
      'K-Nearest Neighbors',
    ],
    default_model: 'Support Vector Machine',
  });

  // Pre-initialize synchronously with verified fallback data for 0ms loading time
  const [eda, setEda] = useState<EdaMetrics>(fallbackEda as unknown as EdaMetrics);
  const [models, setModels] = useState<ModelComparisonData>(fallbackModels as unknown as ModelComparisonData);
  const [features, setFeatures] = useState<FeatureImportanceData>(fallbackFeatures as unknown as FeatureImportanceData);
  const [samples, setSamples] = useState<SampleRecord[]>(fallbackSamples as unknown as SampleRecord[]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Theme toggle
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    // Background health check & live sync
    async function syncLiveData() {
      try {
        const healthRes = await fetchHealth();
        setHealth(healthRes);

        if (healthRes.status === 'healthy') {
          const [edaRes, modelsRes, featuresRes, samplesRes] = await Promise.all([
            fetchEdaMetrics(),
            fetchModelBenchmarks(),
            fetchFeatureImportance(),
            fetchSampleRecords(),
          ]);
          setEda(edaRes);
          setModels(modelsRes);
          setFeatures(featuresRes);
          setSamples(samplesRes);
        }
      } catch (err) {
        console.warn('Backend sync skipped, running on local artifacts:', err);
      }
    }
    syncLiveData();
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const modelsList = models
    ? models.models.map((m) => m.model_name)
    : [
        'Support Vector Machine',
        'Deep Learning (MLP)',
        'XGBoost',
        'Logistic Regression',
        'Random Forest',
        'K-Nearest Neighbors',
      ];

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header
        isDark={isDark}
        toggleTheme={toggleTheme}
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'playground' && (
          <InferencePlayground samples={samples} modelsList={modelsList} />
        )}

        {activeTab === 'models' && models && (
          <ModelBenchmarking data={models} />
        )}

        {activeTab === 'features' && features && (
          <FeatureImportanceView data={features} />
        )}

        {activeTab === 'eda' && eda && (
          <EdaExplorer data={eda} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-300">
              Dry Bean Variety Classification & Analytics Platform
            </span>{' '}
            • Kaggle & UCI Machine Learning Repository (13,611 Instances, 16 Features, 7 Cultivars)
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              FastAPI
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Scikit-Learn
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              XGBoost
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Next.js 14
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Tailwind CSS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
