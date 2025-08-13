# 项目必读

你是一个熟练的前端开发 AI，接下来我要你帮我基于 Next.js（App Router）+ TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + ECharts 搭建一个闪电网络（Lightning Network）的 Dashboard 前端骨架。

要求：
1. 开始工作前阅读 docs/ 中必要的文档，补充背景知识。
2. 目录结构要清晰，所有页面放在 src/app 下，组件放在 src/components 下，API 请求封装和类型定义放在 src/libs 下。
3. 集成 TanStack Query 用于数据获取与轮询，API 响应用 Zod 校验。
4. 集成 shadcn/ui 和 lucide-react，样式用 Tailwind，暗色模式支持。
5. 图表统一使用 ECharts（含 geo），示例包含：
   - KPI 卡片（总容量、节点数、通道数等）
   - 一个时间序列面积图
   - 一个世界地图（Nodes per Country 示例）
   - 一个 ISP 排行榜（柱状图）
6. 提供假数据和 API 请求封装，方便替换成真实 HTTP API。
7. 全部用 TypeScript，避免 any，严格类型检查。
8. 添加 ESLint + Prettier 配置，保证 no-explicit-any 规则。
9. 添加 Vitest + Testing Library 基础测试用例。
10. 按需懒加载图表和地图组件。
11. 在 docs/ 中记录必要的文档，以合适的名字命名，方便后续 AI 查看维护。
