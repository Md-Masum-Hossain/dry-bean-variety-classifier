import {
  BeanFeatures,
  PredictionResponse,
  EdaMetrics,
  FeatureImportanceData,
  ModelComparisonData,
  SampleRecord,
} from './types';

import fallbackEda from './data/eda_stats.json';
import fallbackModels from './data/model_comparison.json';
import fallbackFeatures from './data/feature_importance.json';
import fallbackSamples from './data/sample_test_records.json';

export { fallbackEda, fallbackModels, fallbackFeatures, fallbackSamples };

// Dynamically resolve API URL with localhost fallback and normalize trailing slashes
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function fetchHealth(): Promise<{ status: string; models_loaded: string[]; default_model: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/health`, { cache: 'no-store' }, 1500);
    if (!res.ok) throw new Error('Health check non-200');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      models_loaded: ['Support Vector Machine', 'Random Forest', 'XGBoost', 'Deep Learning (MLP)', 'Logistic Regression', 'K-Nearest Neighbors'],
      default_model: 'Support Vector Machine',
    };
  }
}

export async function fetchEdaMetrics(): Promise<EdaMetrics> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/metrics/eda`, { cache: 'no-store' }, 1500);
    if (!res.ok) throw new Error('EDA fetch failed');
    return await res.json();
  } catch (err) {
    return fallbackEda as unknown as EdaMetrics;
  }
}

export async function fetchModelBenchmarks(): Promise<ModelComparisonData> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/metrics/models`, { cache: 'no-store' }, 1500);
    if (!res.ok) throw new Error('Model metrics fetch failed');
    return await res.json();
  } catch (err) {
    return fallbackModels as unknown as ModelComparisonData;
  }
}

export async function fetchFeatureImportance(): Promise<FeatureImportanceData> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/metrics/features`, { cache: 'no-store' }, 1500);
    if (!res.ok) throw new Error('Feature metrics fetch failed');
    return await res.json();
  } catch (err) {
    return fallbackFeatures as unknown as FeatureImportanceData;
  }
}

export async function fetchSampleRecords(): Promise<SampleRecord[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/sample-data`, { cache: 'no-store' }, 1500);
    if (!res.ok) throw new Error('Sample data fetch failed');
    return await res.json();
  } catch (err) {
    return fallbackSamples as unknown as SampleRecord[];
  }
}

export async function predictBeanVariety(
  features: BeanFeatures,
  modelName?: string
): Promise<PredictionResponse> {
  const payload = {
    features,
    model_name: modelName || null,
  };

  const res = await fetchWithTimeout(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 10000);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Prediction failed with HTTP ${res.status}`);
  }

  return await res.json();
}
