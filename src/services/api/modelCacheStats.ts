import { apiClient } from './client';

export interface ModelCacheHourlyBucket {
  hour_unix: number;
  requests: number;
  failed_requests: number;
  cache_hit_requests: number;
  input_tokens: number;
  uncached_input_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  output_tokens: number;
}

export interface ModelCacheStatsEntry {
  model: string;
  requests: number;
  failed_requests: number;
  cache_hit_requests: number;
  request_hit_rate: number;
  input_tokens: number;
  uncached_input_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  output_tokens: number;
  token_hit_rate: number;
  hourly?: ModelCacheHourlyBucket[];
}

export interface ModelCacheStatsResponse {
  window_hours: number;
  generated_at: string;
  models: ModelCacheStatsEntry[];
}

const MODEL_CACHE_STATS_TIMEOUT_MS = 15 * 1000;

export const modelCacheStatsApi = {
  getStats: (hours = 24) =>
    apiClient.get<ModelCacheStatsResponse>(`/model-cache-stats?hours=${hours}&hourly=true`, {
      timeout: MODEL_CACHE_STATS_TIMEOUT_MS,
    }),
};
