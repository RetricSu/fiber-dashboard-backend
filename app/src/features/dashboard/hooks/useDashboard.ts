import { QueryClient } from '@tanstack/react-query';
import { fetchDashboardData, fetchKpiData, fetchTimeSeriesData, fetchGeoNodeData, fetchIspRankingData } from '../api/client';

// 创建 QueryClient 实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  kpis: ['dashboard', 'kpis'] as const,
  timeSeries: ['dashboard', 'timeSeries'] as const,
  geoNodes: ['dashboard', 'geoNodes'] as const,
  ispRankings: ['dashboard', 'ispRankings'] as const,
} as const;

// 预取 Dashboard 数据
export async function prefetchDashboardData() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardData,
  });
}

// 预取 KPI 数据
export async function prefetchKpiData() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.kpis,
    queryFn: fetchKpiData,
  });
}

// 预取时间序列数据
export async function prefetchTimeSeriesData() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.timeSeries,
    queryFn: fetchTimeSeriesData,
  });
}

// 预取地理节点数据
export async function prefetchGeoNodeData() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.geoNodes,
    queryFn: fetchGeoNodeData,
  });
}

// 预取 ISP 排行榜数据
export async function prefetchIspRankingData() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.ispRankings,
    queryFn: fetchIspRankingData,
  });
}
