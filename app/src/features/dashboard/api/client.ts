import { DashboardData, KpiData, TimeSeries, GeoNode, IspRanking } from './types';

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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

// 获取 Dashboard 数据 - 聚合多个后端端点
export async function fetchDashboardData(): Promise<DashboardData> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return generateMockData();
  }

  try {
    // 并行获取所有需要的数据
    const [nodesResponse, channelsResponse] = await Promise.all([
      apiRequest<any>('/nodes_hourly?page=0'),
      apiRequest<any>('/channels_hourly?page=0'),
    ]);

    // 处理节点数据 - 使用正确的字段名
    const nodes = nodesResponse.nodes || [];
    const channels = channelsResponse.channels || [];

    // 计算KPI数据
    const totalNodes = nodes.length;
    const totalChannels = channels.length;
    
    // Handle capacity - the backend uses string format for capacity
    const totalCapacity = channels.reduce((sum: number, channel: any) => {
      const capacity = typeof channel.capacity === 'string' 
        ? parseInt(channel.capacity, 10) || 0 
        : Number(channel.capacity) || 0;
      return sum + capacity;
    }, 0);
    
    const averageChannelCapacity = totalChannels > 0 ? totalCapacity / totalChannels : 0;
    
    // 计算地理分布 - 基于节点地理位置
    const countryMap = new Map<string, { count: number; capacity: number }>();
    
    // 建立节点到国家的映射
    const nodeCountryMap = new Map<string, string>();
    nodes.forEach((node: any) => {
      const country = node.country || 'Unknown';
      nodeCountryMap.set(node.node_id, country);
      
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, capacity: 0 });
      }
      countryMap.get(country)!.count++;
    });

    // 计算每个国家的总容量（基于通道两端的节点）
    channels.forEach((channel: any) => {
      const capacity = typeof channel.capacity === 'string' 
        ? parseInt(channel.capacity, 10) || 0 
        : Number(channel.capacity) || 0;
      
      // 将容量分配给两个节点所在的国家
      const node1Country = nodeCountryMap.get(channel.node1) || 'Unknown';
      const node2Country = nodeCountryMap.get(channel.node2) || 'Unknown';
      
      if (countryMap.has(node1Country)) {
        countryMap.get(node1Country)!.capacity += capacity / 2;
      }
      if (countryMap.has(node2Country)) {
        countryMap.get(node2Country)!.capacity += capacity / 2;
      }
    });

    const geoNodes: GeoNode[] = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        countryCode: getCountryCode(country),
        nodeCount: data.count,
        totalCapacity: Math.round(data.capacity / 100000000 * 100) / 100, // Convert to BTC and round
      }))
      .sort((a, b) => b.nodeCount - a.nodeCount)
      .slice(0, 10);

    // 计算ISP分布 - 从地址中提取ISP信息
    const ispMap = new Map<string, { count: number; capacity: number }>();
    
    // 初始化ISP映射
    nodes.forEach((node: any) => {
      const isp = extractISPFromAddresses(node.addresses || []) || 'Unknown ISP';
      if (!ispMap.has(isp)) {
        ispMap.set(isp, { count: 0, capacity: 0 });
      }
      ispMap.get(isp)!.count++;
    });

    // 分配容量到ISP
    channels.forEach((channel: any) => {
      const capacity = typeof channel.capacity === 'string' 
        ? parseInt(channel.capacity, 10) || 0 
        : Number(channel.capacity) || 0;
      
      // 获取节点对应的ISP
      const node1 = nodes.find((n: any) => n.node_id === channel.node1);
      const node2 = nodes.find((n: any) => n.node_id === channel.node2);
      
      const isp1 = extractISPFromAddresses(node1?.addresses || []) || 'Unknown ISP';
      const isp2 = extractISPFromAddresses(node2?.addresses || []) || 'Unknown ISP';
      
      if (ispMap.has(isp1)) {
        ispMap.get(isp1)!.capacity += capacity / 2;
      }
      if (ispMap.has(isp2)) {
        ispMap.get(isp2)!.capacity += capacity / 2;
      }
    });

    const ispRankings: IspRanking[] = Array.from(ispMap.entries())
      .map(([isp, data]) => ({
        isp,
        nodeCount: data.count,
        totalCapacity: Math.round(data.capacity / 100000000 * 100) / 100, // Convert to BTC
        averageCapacity: data.count > 0 
          ? Math.round((data.capacity / data.count) / 100000000 * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.nodeCount - a.nodeCount)
      .slice(0, 10);

    // 生成时间序列数据 - 使用最近的数据模拟
    const now = new Date();
    const timeSeriesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      timeSeriesData.push({
        timestamp: date.toISOString(),
        value: Math.floor(totalCapacity * (0.8 + Math.random() * 0.4)),
      });
    }

    return {
      kpis: {
        totalCapacity: Math.round(totalCapacity / 100000000 * 100) / 100, // Convert to BTC
        totalNodes,
        totalChannels,
        averageChannelCapacity: Math.round(averageChannelCapacity / 100000000 * 100) / 100, // Convert to BTC
        networkGrowth: 12.5, // Placeholder - can be calculated from historical data
      },
      timeSeries: [
        {
          label: 'Network Capacity (BTC)',
          data: timeSeriesData,
        },
      ],
      geoNodes,
      ispRankings,
    };
  } catch (error) {
    console.warn('Real API failed, falling back to mock data:', error);
    return generateMockData();
  }
}

// 假数据生成函数（保留作为fallback）
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

// Helper function to get country code from country name
function getCountryCode(country: string): string {
  const countryCodes: Record<string, string> = {
    'United States': 'US',
    'Germany': 'DE',
    'Netherlands': 'NL',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'France': 'FR',
    'Japan': 'JP',
    'Australia': 'AU',
    'Switzerland': 'CH',
    'Singapore': 'SG',
    'China': 'CN',
    'Russia': 'RU',
    'Brazil': 'BR',
    'India': 'IN',
    'South Korea': 'KR',
  };
  return countryCodes[country] || 'UNKNOWN';
}

// Helper function to extract ISP from addresses
function extractISPFromAddresses(addresses: string[]): string {
  if (!addresses || addresses.length === 0) return 'Unknown ISP';
  
  const address = addresses[0];
  if (address.includes('cloudflare')) return 'Cloudflare';
  if (address.includes('digitalocean')) return 'DigitalOcean';
  if (address.includes('amazon') || address.includes('aws')) return 'AWS';
  if (address.includes('ovh')) return 'OVH';
  if (address.includes('hetzner')) return 'Hetzner';
  if (address.includes('linode')) return 'Linode';
  if (address.includes('vultr')) return 'Vultr';
  if (address.includes('google')) return 'Google Cloud';
  if (address.includes('azure') || address.includes('microsoft')) return 'Azure';
  
  return 'Other ISP';
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

// 获取原始节点数据
export async function fetchNodesRaw(page = 0): Promise<any> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { nodes: [], next_page: 0 };
  }
  
  try {
    return await apiRequest(`/nodes_hourly?page=${page}`);
  } catch (error) {
    console.error('Failed to fetch raw nodes:', error);
    return { nodes: [], next_page: 0 };
  }
}

// 获取原始通道数据
export async function fetchChannelsRaw(page = 0): Promise<any> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { channels: [], next_page: 0 };
  }
  
  try {
    return await apiRequest(`/channels_hourly?page=${page}`);
  } catch (error) {
    console.error('Failed to fetch raw channels:', error);
    return { channels: [], next_page: 0 };
  }
}
