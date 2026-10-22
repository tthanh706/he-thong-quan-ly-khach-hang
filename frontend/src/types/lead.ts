export interface ScoringConfig {
  criteria_key: 'industry' | 'company_size' | 'source' | 'interest_level';
  criteria_value: string;
  score: number;
}

export interface ThresholdConfig {
  classification: 'Hot' | 'Warm' | 'Cold';
  min_score: number;
  max_score: number;
}