import { z } from 'zod';

// KPI 数据类型
export const KpiDataSchema = z.object({
  totalCapacity: z.number(),
  totalNodes: z.number(),
  totalChannels: z.number(),
  averageChannelCapacity: z.number(),
  networkGrowth: z.number(),
});

export type KpiData = z.infer<typeof KpiDataSchema>;

// 时间序列数据类型
export const TimeSeriesDataSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});

export const TimeSeriesSchema = z.object({
  label: z.string(),
  data: z.array(TimeSeriesDataSchema),
});

export type TimeSeriesData = z.infer<typeof TimeSeriesDataSchema>;
export type TimeSeries = z.infer<typeof TimeSeriesSchema>;

// 地理节点数据类型
export const GeoNodeSchema = z.object({
  country: z.string(),
  countryCode: z.string(),
  nodeCount: z.number(),
  totalCapacity: z.number(),
});

export type GeoNode = z.infer<typeof GeoNodeSchema>;

// ISP 排行榜数据类型
export const IspRankingSchema = z.object({
  isp: z.string(),
  nodeCount: z.number(),
  totalCapacity: z.number(),
  averageCapacity: z.number(),
});

export type IspRanking = z.infer<typeof IspRankingSchema>;

// Dashboard 数据聚合类型
export const DashboardDataSchema = z.object({
  kpis: KpiDataSchema,
  timeSeries: z.array(TimeSeriesSchema),
  geoNodes: z.array(GeoNodeSchema),
  ispRankings: z.array(IspRankingSchema),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

// API 响应类型
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: DashboardDataSchema,
  timestamp: z.string(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Backend API response types
export const NodeResponseSchema = z.object({
  next_page: z.number(),
  nodes: z.array(z.any()),
});

export const ChannelResponseSchema = z.object({
  next_page: z.number(),
  channels: z.array(z.any()),
});

export type NodeResponse = z.infer<typeof NodeResponseSchema>;
export type ChannelResponse = z.infer<typeof ChannelResponseSchema>;
