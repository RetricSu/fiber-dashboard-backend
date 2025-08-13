# 项目结构文档

## 目录结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── dashboard/         # Dashboard 页面
│   │   └── page.tsx      # Dashboard 主页面
│   ├── api/              # API 路由（预留）
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
├── components/           # React 组件
│   ├── ui/              # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   └── skeleton.tsx
│   ├── charts/          # ECharts 图表组件
│   │   ├── TimeSeriesChart.tsx
│   │   ├── WorldMapChart.tsx
│   │   └── IspRankingChart.tsx
│   └── dashboard/       # Dashboard 专用组件
│       ├── KpiCard.tsx
│       └── DashboardContent.tsx
├── libs/                # 工具库和类型定义
│   ├── types.ts         # TypeScript 类型定义
│   ├── api.ts           # API 请求封装
│   └── query.ts         # TanStack Query 配置
└── test/                # 测试设置
    └── setup.ts         # Vitest 测试配置
```

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI 组件**: shadcn/ui + lucide-react
- **数据获取**: TanStack Query v5
- **图表**: ECharts 6
- **数据验证**: Zod
- **测试**: Vitest + Testing Library
- **代码质量**: ESLint + Prettier

## 核心功能

### 1. KPI 卡片
- 总容量 (Total Capacity)
- 节点数 (Total Nodes)
- 通道数 (Total Channels)
- 平均通道容量 (Average Channel Capacity)
- 网络增长率 (Network Growth)

### 2. 图表展示
- **时间序列面积图**: 网络容量变化趋势
- **世界地图**: 全球节点分布
- **ISP 排行榜**: 柱状图展示

### 3. 数据轮询
- KPI 数据: 30秒轮询
- 时间序列: 1分钟轮询
- 地理数据: 5分钟轮询
- ISP 数据: 5分钟轮询

### 4. 响应式设计
- 移动端适配
- 暗色模式支持
- 图表自适应

## 开发指南

### 环境变量
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### 开发命令
```bash
# 开发服务器
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码格式化
pnpm format

# 代码检查
pnpm lint
```

### 添加新图表
1. 在 `src/components/charts/` 创建新组件
2. 在 `src/libs/types.ts` 添加类型定义
3. 在 `src/libs/api.ts` 添加数据获取函数
4. 在 Dashboard 中集成新图表

### 替换真实 API
1. 设置 `NEXT_PUBLIC_API_BASE_URL` 环境变量
2. 设置 `NEXT_PUBLIC_USE_MOCK_DATA=false`
3. 确保 API 返回符合 Zod schema 的数据格式
