export interface BeanFeatures {
  Area: number;
  Perimeter: number;
  MajorAxisLength: number;
  MinorAxisLength: number;
  AspectRation: number;
  Eccentricity: number;
  ConvexArea: number;
  EquivDiameter: number;
  Extent: number;
  Solidity: number;
  roundness: number;
  Compactness: number;
  ShapeFactor1: number;
  ShapeFactor2: number;
  ShapeFactor3: number;
  ShapeFactor4: number;
}

export interface PredictionResponse {
  predicted_class: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  model_used: string;
  inference_time_ms: number;
  ground_truth?: string;
}

export interface EdaSummary {
  total_samples: number;
  feature_count: number;
  missing_values: number;
  duplicate_records: number;
  target_classes_count: number;
}

export interface ClassDistributionItem {
  class: string;
  count: number;
  percentage: number;
}

export interface FeatureStat {
  name: string;
  description: string;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  skewness: number;
  kurtosis: number;
}

export interface CorrelationData {
  features: string[];
  matrix: number[][];
}

export interface EdaMetrics {
  dataset_summary: EdaSummary;
  class_distribution: ClassDistributionItem[];
  feature_statistics: Record<string, FeatureStat>;
  class_wise_means: Record<string, Record<string, number>>;
  correlation: CorrelationData;
}

export interface AnovaItem {
  feature: string;
  f_score: number;
  p_value: number;
  score_normalized: number;
  rank: number;
}

export interface RfItem {
  feature: string;
  importance: number;
  importance_percentage: number;
  rank: number;
}

export interface CompositeRankItem {
  feature: string;
  anova_rank: number;
  rf_rank: number;
  average_rank: number;
  final_rank: number;
}

export interface FeatureImportanceData {
  anova_f_test: AnovaItem[];
  random_forest_importance: RfItem[];
  composite_ranking: CompositeRankItem[];
}

export interface PerClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ModelMetric {
  model_name: string;
  rank: number;
  accuracy: number;
  f1_weighted: number;
  f1_macro: number;
  precision_weighted: number;
  precision_macro: number;
  recall_weighted: number;
  recall_macro: number;
  cv_f1_mean: number;
  cv_f1_std: number;
  training_time_sec: number;
  confusion_matrix: number[][];
  confusion_matrix_normalized: number[][];
  class_labels: string[];
  per_class_metrics: Record<string, PerClassMetric>;
}

export interface ModelComparisonData {
  best_model: {
    name: string;
    accuracy: number;
    f1_weighted: number;
    cv_f1_mean: number;
  };
  models: ModelMetric[];
  classes: string[];
}

export interface SampleRecord {
  ground_truth: string;
  features: BeanFeatures;
}
