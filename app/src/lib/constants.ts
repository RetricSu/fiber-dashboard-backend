// App-wide constants
export const APP_CONFIG = {
  name: "Fiber Dashboard",
  description:
    "Real-time insights into the CKB Lightning Network infrastructure",
  version: "1.0.0",
} as const;

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true",
} as const;

// Query configuration
export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  refetchOnWindowFocus: false,
} as const;

// Chart configuration
export const CHART_CONFIG = {
  colors: {
    primary: "#0ea5e9",
    secondary: "#64748b",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  animation: {
    duration: 1000,
    easing: "cubicOut",
  },
} as const;
