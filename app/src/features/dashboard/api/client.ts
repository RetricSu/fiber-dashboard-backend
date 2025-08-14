import { DashboardData, GeoNode, IspRanking, RustNodeInfo, RustChannelInfo, NodeResponse, ChannelResponse } from './types';

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// CKB 转换常量
const SHANNONS_PER_CKB = 100_000_000;

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


// 工具函数：将十六进制字符串转换为十进制数
function hexToDecimal(hex: string): bigint {
  if (hex.startsWith('0x')) {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}

// 获取 Dashboard 数据 - 聚合多个后端端点
export async function fetchDashboardData(): Promise<DashboardData> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return generateMockData();
  }

  try {
    // 并行获取所有需要的数据
    const [nodesResponse, channelsResponse] = await Promise.all([
      apiRequest<NodeResponse>('/nodes_hourly?page=0'),
      apiRequest<ChannelResponse>('/channels_hourly?page=0'),
    ]);

    // 处理节点数据
    const nodes: RustNodeInfo[] = nodesResponse.nodes || [];
    const channels: RustChannelInfo[] = channelsResponse.channels || [];

    // 计算KPI数据
    const totalNodes = nodes.length;
    const totalChannels = channels.length;
    
    // 处理容量数据 - 从十六进制字符串转换为十进制并转换为CKB
    const totalCapacity = channels.reduce((sum: number, channel: RustChannelInfo) => {
      try {
        const capacity = channel.capacity;
        const capacityInShannons = typeof capacity === 'string' ? hexToDecimal(capacity) : BigInt(capacity);
        return sum + Number(capacityInShannons) / SHANNONS_PER_CKB;
      } catch (error) {
        console.warn('Error parsing channel capacity:', error, channel);
        return sum;
      }
    }, 0);
    
    const averageChannelCapacity = totalChannels > 0 ? totalCapacity / totalChannels : 0;
    
    // 计算地理分布 - 基于节点地理位置
    const countryMap = new Map<string, { count: number; capacity: number }>();
    
    // 建立节点到国家的映射
    const nodeCountryMap = new Map<string, string>();
    nodes.forEach((node: RustNodeInfo) => {
      const country = node.country || 'Unknown';
      nodeCountryMap.set(node.node_id, country);
      
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, capacity: 0 });
      }
      countryMap.get(country)!.count++;
    });

    // 计算每个国家的总容量（基于通道两端的节点）
    channels.forEach((channel: RustChannelInfo) => {
      try {
        const capacity = channel.capacity;
        const capacityInShannons = typeof capacity === 'string' ? hexToDecimal(capacity) : BigInt(capacity);
        const capacityInCKB = Number(capacityInShannons) / SHANNONS_PER_CKB;
        
        // 将容量分配给两个节点所在的国家
        const node1Country = nodeCountryMap.get(channel.node1);
        const node2Country = nodeCountryMap.get(channel.node2);
        
        // 只处理有明确国家信息的节点
        if (node1Country && node1Country !== 'Unknown' && countryMap.has(node1Country)) {
          countryMap.get(node1Country)!.capacity += capacityInCKB / 2;
        }
        if (node2Country && node2Country !== 'Unknown' && countryMap.has(node2Country)) {
          countryMap.get(node2Country)!.capacity += capacityInCKB / 2;
        }
      } catch (error) {
        console.warn('Error processing channel for geo data:', error, channel);
      }
    });

    const geoNodes: GeoNode[] = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country: getCountryName(country),
        countryCode: country,
        nodeCount: data.count,
        totalCapacity: Math.round(Math.max(0, data.capacity) * 100) / 100, // Ensure non-negative
      }))
      .filter(item => item.country !== 'Unknown' && item.country !== 'undefined' && item.countryCode !== 'Unknown')
      .sort((a, b) => b.nodeCount - a.nodeCount)
      .slice(0, 10);

    // 计算ISP分布 - 从地址中提取ISP信息
    const ispMap = new Map<string, { count: number; capacity: number }>();
    
    // 初始化ISP映射
    nodes.forEach((node: RustNodeInfo) => {
      const isp = extractISPFromAddresses(node.addresses || []) || 'Unknown ISP';
      if (!ispMap.has(isp)) {
        ispMap.set(isp, { count: 0, capacity: 0 });
      }
      ispMap.get(isp)!.count++;
    });

    // 分配容量到ISP
    channels.forEach((channel: RustChannelInfo) => {
      try {
        const capacity = channel.capacity;
        const capacityInShannons = typeof capacity === 'string' ? hexToDecimal(capacity) : BigInt(capacity);
        const capacityInCKB = Number(capacityInShannons) / SHANNONS_PER_CKB;
        
        // 获取节点对应的ISP
        const node1 = nodes.find((n: RustNodeInfo) => n.node_id === channel.node1);
        const node2 = nodes.find((n: RustNodeInfo) => n.node_id === channel.node2);
        
        const isp1 = extractISPFromAddresses(node1?.addresses || []) || 'Unknown ISP';
        const isp2 = extractISPFromAddresses(node2?.addresses || []) || 'Unknown ISP';
        
        if (ispMap.has(isp1)) {
          ispMap.get(isp1)!.capacity += capacityInCKB / 2;
        }
        if (ispMap.has(isp2)) {
          ispMap.get(isp2)!.capacity += capacityInCKB / 2;
        }
      } catch (error) {
        console.warn('Error processing channel for ISP data:', error, channel);
      }
    });

    const ispRankings: IspRanking[] = Array.from(ispMap.entries())
      .map(([isp, data]) => ({
        isp,
        nodeCount: data.count,
        totalCapacity: Math.round(data.capacity * 100) / 100, // Round to 2 decimal places
        averageCapacity: data.count > 0 
          ? Math.round((data.capacity / data.count) * 100) / 100
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
        totalCapacity: Math.round(totalCapacity * 100) / 100, // Already in CKB, round to 2 decimal places
        totalNodes,
        totalChannels,
        averageChannelCapacity: Math.round(averageChannelCapacity * 100) / 100, // Already in CKB
        networkGrowth: 12.5, // Placeholder - can be calculated from historical data
      },
      timeSeries: [
        {
          label: 'Network Capacity (CKB)',
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
  
  // 生成过去30天的时间序列数据 (CKB values)
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    timeSeriesData.push({
      timestamp: date.toISOString(),
      value: Math.floor(Math.random() * 500000) + 1000000, // CKB values instead of BTC
    });
  }

  return {
    kpis: {
      totalCapacity: 1542050.75, // CKB values (much larger than BTC)
      totalNodes: 18743,
      totalChannels: 89234,
      averageChannelCapacity: 17.28, // CKB per channel
      networkGrowth: 12.5,
    },
    timeSeries: [
      {
        label: 'Network Capacity (CKB)',
        data: timeSeriesData,
      },
    ],
    geoNodes: [
      { country: 'United States', countryCode: 'US', nodeCount: 3241, totalCapacity: 234050.5 },
      { country: 'Germany', countryCode: 'DE', nodeCount: 2156, totalCapacity: 189020.2 },
      { country: 'Netherlands', countryCode: 'NL', nodeCount: 1892, totalCapacity: 156780.8 },
      { country: 'United Kingdom', countryCode: 'GB', nodeCount: 1654, totalCapacity: 134560.6 },
      { country: 'Canada', countryCode: 'CA', nodeCount: 1432, totalCapacity: 112340.4 },
      { country: 'France', countryCode: 'FR', nodeCount: 1234, totalCapacity: 98760.6 },
      { country: 'Japan', countryCode: 'JP', nodeCount: 1156, totalCapacity: 87650.5 },
      { country: 'Australia', countryCode: 'AU', nodeCount: 987, totalCapacity: 76540.4 },
      { country: 'Switzerland', countryCode: 'CH', nodeCount: 876, totalCapacity: 65430.3 },
      { country: 'Singapore', countryCode: 'SG', nodeCount: 765, totalCapacity: 54320.2 },
    ],
    ispRankings: [
      { isp: 'Cloudflare', nodeCount: 2341, totalCapacity: 189050.5, averageCapacity: 80.8 },
      { isp: 'DigitalOcean', nodeCount: 2156, totalCapacity: 167890.9, averageCapacity: 77.8 },
      { isp: 'AWS', nodeCount: 1987, totalCapacity: 145670.7, averageCapacity: 73.3 },
      { isp: 'OVH', nodeCount: 1765, totalCapacity: 123450.5, averageCapacity: 69.9 },
      { isp: 'Hetzner', nodeCount: 1543, totalCapacity: 112340.4, averageCapacity: 72.8 },
      { isp: 'Linode', nodeCount: 1321, totalCapacity: 98760.6, averageCapacity: 74.8 },
      { isp: 'Vultr', nodeCount: 1198, totalCapacity: 87650.5, averageCapacity: 73.2 },
      { isp: 'Google Cloud', nodeCount: 1087, totalCapacity: 76540.4, averageCapacity: 70.4 },
      { isp: 'Azure', nodeCount: 976, totalCapacity: 65430.3, averageCapacity: 67.0 },
      { isp: 'Scaleway', nodeCount: 865, totalCapacity: 54320.2, averageCapacity: 62.8 },
    ],
  };
};

// Helper function to get full country name for world map matching
function getCountryName(country: string): string {
  // Map 2-letter codes to full country names for world map (matching GeoJSON)
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'HK': 'Hong Kong',
    'SG': 'Singapore',
    'DE': 'Germany',
    'AU': 'Australia',
    'ZA': 'South Africa',
    'BR': 'Brazil',
    'ID': 'Indonesia',
    'JP': 'Japan',
    'CN': 'China',
    'RU': 'Russia',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'FR': 'France',
    'CH': 'Switzerland',
    'IN': 'India',
    'KR': 'South Korea',
    'NL': 'Netherlands',
    'IT': 'Italy',
    'ES': 'Spain',
    'SE': 'Sweden',
    'NO': 'Norway',
    'FI': 'Finland',
    'DK': 'Denmark',
    'BE': 'Belgium',
    'AT': 'Austria',
    'PL': 'Poland',
    'IE': 'Ireland',
  };
  return countryNames[country] || country || 'Unknown';
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
export async function fetchNodesRaw(page = 0): Promise<NodeResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { nodes: [], next_page: 0 };
  }
  
  try {
    return await apiRequest<NodeResponse>(`/nodes_hourly?page=${page}`);
  } catch (error) {
    console.error('Failed to fetch raw nodes:', error);
    return { nodes: [], next_page: 0 };
  }
}

// 获取原始通道数据
export async function fetchChannelsRaw(page = 0): Promise<ChannelResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return { channels: [], next_page: 0 };
  }
  
  try {
    return await apiRequest<ChannelResponse>(`/channels_hourly?page=${page}`);
  } catch (error) {
    console.error('Failed to fetch raw channels:', error);
    return { channels: [], next_page: 0 };
  }
}
