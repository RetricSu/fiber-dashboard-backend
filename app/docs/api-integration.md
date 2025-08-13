# API 集成文档

## 数据格式规范

### Dashboard 数据响应格式

```typescript
interface ApiResponse {
  success: boolean;
  data: DashboardData;
  timestamp: string;
}

interface DashboardData {
  kpis: KpiData;
  timeSeries: TimeSeries[];
  geoNodes: GeoNode[];
  ispRankings: IspRanking[];
}
```

### KPI 数据格式

```typescript
interface KpiData {
  totalCapacity: number;        // 总容量 (BTC)
  totalNodes: number;          // 总节点数
  totalChannels: number;       // 总通道数
  averageChannelCapacity: number; // 平均通道容量 (BTC)
  networkGrowth: number;       // 网络增长率 (%)
}
```

### 时间序列数据格式

```typescript
interface TimeSeries {
  label: string;               // 数据标签
  data: TimeSeriesData[];
}

interface TimeSeriesData {
  timestamp: string;           // ISO 8601 时间戳
  value: number;              // 数值
}
```

### 地理节点数据格式

```typescript
interface GeoNode {
  country: string;             // 国家名称
  countryCode: string;         // 国家代码 (ISO 3166-1 alpha-2)
  nodeCount: number;          // 节点数量
  totalCapacity: number;      // 总容量 (BTC)
}
```

### ISP 排行榜数据格式

```typescript
interface IspRanking {
  isp: string;                 // ISP 名称
  nodeCount: number;          // 节点数量
  totalCapacity: number;      // 总容量 (BTC)
  averageCapacity: number;    // 平均容量 (BTC)
}
```

## API 端点

### 获取完整 Dashboard 数据

```
GET /api/dashboard
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalCapacity": 15420.5,
      "totalNodes": 18743,
      "totalChannels": 89234,
      "averageChannelCapacity": 0.173,
      "networkGrowth": 12.5
    },
    "timeSeries": [
      {
        "label": "Network Capacity (BTC)",
        "data": [
          {
            "timestamp": "2024-01-01T00:00:00Z",
            "value": 14500.2
          }
        ]
      }
    ],
    "geoNodes": [
      {
        "country": "United States",
        "countryCode": "US",
        "nodeCount": 3241,
        "totalCapacity": 2340.5
      }
    ],
    "ispRankings": [
      {
        "isp": "Cloudflare",
        "nodeCount": 2341,
        "totalCapacity": 1890.5,
        "averageCapacity": 0.808
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 数据验证

所有 API 响应都使用 Zod schema 进行验证：

```typescript
import { z } from 'zod';

const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: DashboardDataSchema,
  timestamp: z.string(),
});
```

## 错误处理

### HTTP 状态码

- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data format",
    "details": {}
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 轮询配置

### 推荐轮询间隔

- **KPI 数据**: 30秒
- **时间序列数据**: 1分钟
- **地理数据**: 5分钟
- **ISP 数据**: 5分钟

### 实现示例

```typescript
const { data: kpiData } = useQuery({
  queryKey: queryKeys.kpis,
  queryFn: fetchKpiData,
  refetchInterval: 30000, // 30秒
});
```

## 缓存策略

### TanStack Query 配置

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5分钟
      gcTime: 10 * 60 * 1000,      // 10分钟
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

## 环境变量配置

```env
# API 基础 URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# 是否使用假数据
NEXT_PUBLIC_USE_MOCK_DATA=true

# API 超时时间 (毫秒)
NEXT_PUBLIC_API_TIMEOUT=10000
```

## 开发调试

### 启用调试模式

```typescript
// 在浏览器控制台查看 API 请求
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('API Request:', endpoint, options);
}
```

### 网络请求监控

使用浏览器开发者工具的 Network 面板监控 API 请求：

1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 筛选 XHR/Fetch 请求
4. 查看请求/响应详情
