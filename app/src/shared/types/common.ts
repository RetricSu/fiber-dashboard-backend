// Shared common types used across the application

export interface BaseApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
}

export interface ChartSeries {
  label: string;
  data: ChartDataPoint[];
}

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface RefreshableData<T> extends LoadingState {
  data: T | null;
  lastUpdated: string | null;
}
