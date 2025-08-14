import { DashboardData, ApiResponse, ApiResponseSchema } from './types';

// 假数据生成函数
const generateMockData = (): DashboardData => {
  const now = new Date();
  const timeSeriesData = [];
  
  // 生成过去30天的时间序列数据
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    timeSeriesData.push({
      timestamp: date.toISOString(),
      value: Math.floor(Math.random() * 1000) + 5000,
    });
  }

  return {
    kpis: {
      totalCapacity: 15420.5,
      totalNodes: 18743,
      totalChannels: 89234,
      averageChannelCapacity: 0.173,
      networkGrowth: 12.5,
    },
    timeSeries: [
      {
        label: 'Network Capacity (BTC)',
        data: timeSeriesData,
      },
    ],
    geoNodes: [
      { country: 'United States', countryCode: 'US', nodeCount: 3241, totalCapacity: 2340.5 },
      { country: 'Germany', countryCode: 'DE', nodeCount: 2156, totalCapacity: 1890.2 },
      { country: 'Netherlands', countryCode: 'NL', nodeCount: 1892, totalCapacity: 1567.8 },
      { country: 'United Kingdom', countryCode: 'GB', nodeCount: 1654, totalCapacity: 1345.6 },
      { country: 'Canada', countryCode: 'CA', nodeCount: 1432, totalCapacity: 1123.4 },
      { country: 'France', countryCode: 'FR', nodeCount: 1234, totalCapacity: 987.6 },
      { country: 'Japan', countryCode: 'JP', nodeCount: 1156, totalCapacity: 876.5 },
      { country: 'Australia', countryCode: 'AU', nodeCount: 987, totalCapacity: 765.4 },
      { country: 'Switzerland', countryCode: 'CH', nodeCount: 876, totalCapacity: 654.3 },
      { country: 'Singapore', countryCode: 'SG', nodeCount: 765, totalCapacity: 543.2 },
    ],
    ispRankings: [
      { isp: 'Cloudflare', nodeCount: 2341, totalCapacity: 1890.5, averageCapacity: 0.808 },
      { isp: 'DigitalOcean', nodeCount: 2156, totalCapacity: 1678.9, averageCapacity: 0.778 },
      { isp: 'AWS', nodeCount: 1987, totalCapacity: 1456.7, averageCapacity: 0.733 },
      { isp: 'OVH', nodeCount: 1765, totalCapacity: 1234.5, averageCapacity: 0.699 },
      { isp: 'Hetzner', nodeCount: 1543, totalCapacity: 1123.4, averageCapacity: 0.728 },
      { isp: 'Linode', nodeCount: 1321, totalCapacity: 987.6, averageCapacity: 0.748 },
      { isp: 'Vultr', nodeCount: 1198, totalCapacity: 876.5, averageCapacity: 0.732 },
      { isp: 'Google Cloud', nodeCount: 1087, totalCapacity: 765.4, averageCapacity: 0.704 },
      { isp: 'Azure', nodeCount: 976, totalCapacity: 654.3, averageCapacity: 0.670 },
      { isp: 'Scaleway', nodeCount: 865, totalCapacity: 543.2, averageCapacity: 0.628 },
    ],
  };
};

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// 通用 API 请求函数
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// 获取 Dashboard 数据
export async function fetchDashboardData(): Promise<DashboardData> {
  // 如果配置了真实 API，则使用真实 API
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true' && API_BASE_URL !== 'http://localhost:3001/api') {
    try {
      const response = await apiRequest<ApiResponse>('/dashboard');
      const validatedResponse = ApiResponseSchema.parse(response);
      return validatedResponse.data;
    } catch (error) {
      console.warn('Real API failed, falling back to mock data:', error);
    }
  }
  
  // 使用假数据
  return generateMockData();
}

// 获取 KPI 数据
export async function fetchKpiData(): Promise<DashboardData['kpis']> {
  const data = await fetchDashboardData();
  return data.kpis;
}

// 获取时间序列数据
export async function fetchTimeSeriesData(): Promise<DashboardData['timeSeries']> {
  const data = await fetchDashboardData();
  return data.timeSeries;
}

// 获取地理节点数据
export async function fetchGeoNodeData(): Promise<DashboardData['geoNodes']> {
  const data = await fetchDashboardData();
  return data.geoNodes;
}

// 获取 ISP 排行榜数据
export async function fetchIspRankingData(): Promise<DashboardData['ispRankings']> {
  const data = await fetchDashboardData();
  return data.ispRankings;
}
