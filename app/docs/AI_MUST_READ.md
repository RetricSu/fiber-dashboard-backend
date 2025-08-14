# AI MUST READ

> 本文档是 AI 在协助本项目时必须首先阅读的简明上下文说明。  
> 它不是面向用户的文档，而是为了让 AI 在有限上下文中保持一致性和正确性。

---

## 1. 项目概览（Project Overview）

- **名称**：fiber-dashbord-backend（Rust 后端） + Next.js 应用（位于 `app/`）
- **一句话介绍**：闪电网络（Lightning Network）监控与分析：Rust 后端采集与聚合数据，TimescaleDB 存储与连续聚合；Next.js 前端可视化展示网络容量、节点分布、ISP 排行等指标。
- **核心目标**：
  - 后端：从 FIBER RPC 拉取 Node/Channel 图数据，标准化后写入 TimescaleDB，提供 HTTP API。
  - 前端：基于 TanStack Query 的数据拉取与缓存，使用 ECharts 进行可视化。
- **主要技术栈**：
  - 后端：Rust 2024 + Tokio、Salvo、Reqwest、SQLx、TimescaleDB（PostgreSQL 扩展）、ipinfo
  - 前端：Next.js 15、TypeScript、Tailwind CSS v4、shadcn/ui、ECharts 6、TanStack Query v5、Zod

---

## 2. 代码结构（Code Structure）

<目录结构简要描述>

```text
/                    # 仓库根
├─ Cargo.toml        # Rust 后端依赖与配置
├─ Dockerfile        # 后端容器构建
├─ compose.yaml      # TimescaleDB + 后端编排
├─ db_schema/
│  └─ create_table.sql  # TimescaleDB 表/物化视图/策略定义
├─ src/                 # Rust 后端源码
│  ├─ bin/
│  │  └─ fiber-dashbord.rs  # 程序入口：初始化 DB/缓存，定时拉取，启动 HTTP 服务
│  ├─ http_server.rs        # Salvo 路由与处理器（nodes/channels/UDT 等）
│  ├─ ip_location.rs        # ipinfo 缓存与查询
│  ├─ pg_read/              # 读取侧类型与查询（分页、统计、视图映射）
│  ├─ pg_write/             # 写入侧类型、批量插入与关系缓存
│  ├─ rpc_client.rs         # FIBER JSON-RPC 客户端（graph_nodes/graph_channels）
│  ├─ types.rs              # Graph/UDT/Channel 等领域类型与十六进制序列化
│  └─ lib.rs                # 入口导出、PG 连接池/初始化
└─ app/                     # Next.js 应用（前端）
   ├─ package.json          # 脚本与依赖
   ├─ src/
   │  ├─ app/               # App Router 页面
   │  │  ├─ page.tsx        # 首页
   │  │  └─ dashboard/page.tsx  # Dashboard 页面
   │  ├─ lib/               # 共享工具与常量
   │  │  ├─ utils.ts        # 工具函数（cn 等）
   │  │  ├─ constants.ts    # 应用常量
   │  │  └─ index.ts        # 导出
   │  ├─ shared/            # 共享组件与类型
   │  │  ├─ components/ui/  # UI 组件（shadcn/ui）
   │  │  ├─ types/          # 共享类型定义
   │  │  └─ index.ts        # 导出
   │  ├─ features/          # 功能模块（Feature-based 架构）
   │  │  └─ dashboard/      # Dashboard 功能模块
   │  │     ├─ api/         # API 客户端与类型
   │  │     │  ├─ client.ts # API 请求函数
   │  │     │  ├─ types.ts  # Dashboard 类型与 Zod Schema
   │  │     │  └─ maps/     # 地图数据
   │  │     ├─ hooks/       # 自定义 Hooks
   │  │     │  └─ useDashboard.ts  # TanStack Query 配置
   │  │     ├─ components/  # 功能组件
   │  │     │  ├─ DashboardContent.tsx  # 主内容组件
   │  │     │  ├─ KpiCard.tsx           # KPI 卡片组件
   │  │     │  └─ charts/               # 图表组件
   │  │     │     ├─ TimeSeriesChart.tsx
   │  │     │     ├─ WorldMapChart.tsx
   │  │     │     └─ IspRankingChart.tsx
   │  │     ├─ __tests__/   # 功能测试
   │  │     └─ index.ts     # 功能导出
   │  └─ test/              # 测试配置
   └─ docs/                 # 应用侧文档（API 集成、模板等）
```

---

## 3. 核心概念与约定（Core Concepts & Conventions）

- **核心领域概念**：
  - **GraphNodes/GraphChannels**：来自 FIBER RPC 的图数据接口（方法名：`graph_nodes`、`graph_channels`），用于拉取节点与通道的全量/分页数据（见 `src/rpc_client.rs` 与 `src/bin/fiber-dashbord.rs`）。
  - **NodeInfo / ChannelInfo（后端领域模型）**：统一后的节点与通道信息结构；包含 `node_id`、`addresses`（Multiaddr）、`chain_hash`、`capacity`、更新信息等（见 `src/types.rs`、`src/pg_read/types.rs`）。
  - **UDT（User Defined Token）与依赖（Deps）**：每个节点/通道可关联 UDT 配置（`script`、`cell_deps` 或 `type_id`），并在数据库中通过 `udt_infos`、`udt_dep`、`node_udt_relations` 建模与缓存（见 `db_schema/create_table.sql`、`src/pg_write/*`、`src/pg_read/operates.rs`）。
  - **十六进制编码（Hex）约定**：
    - 数值存储为小端十六进制文本（如 `u128` 容量、`u64` 时间/费率等），序列化时常使用自定义 `U64Hex`、`U128Hex` 转换器（见 `src/types.rs`、`src/pg_write/types.rs`）。
    - 对外返回的若干 ID/OutPoint 常带 `0x` 前缀；内部转换需严格遵守无多余前导零的格式检查。
  - **连续聚合（TimescaleDB Continuous Aggregates）**：
    - 通过物化视图 `online_nodes_hourly`、`online_channels_hourly` 将原始表按小时聚合，配合保留策略与定期刷新策略（见 `db_schema/create_table.sql`）。
  - **分页读取（Hourly/Monthly/ByPage）**：读取接口支持按小时窗口与近 30 天窗口的分页查询（见 `src/pg_read/types.rs` 和 `src/pg_read/operates.rs`）。
- **前端架构约定**：
  - **Feature-based 架构**：按功能模块组织代码，每个功能包含 API、Hooks、Components、Tests（见 `app/src/features/dashboard/`）。
  - **共享资源分离**：UI 组件、工具函数、常量、类型定义分别放在 `shared/` 和 `lib/` 目录。
  - **类型命名**：前端类型以 `Schema`/`Data`/`Response` 等后缀区分 Zod 校验与业务数据（见 `app/src/features/dashboard/api/types.ts`）。
- **代码风格**：
  - 前端：ESLint + Prettier，TypeScript + Zod 进行运行时校验与类型推断（见 `app/package.json`、`app/docs/api-integration.md`）。
  - 后端：显式错误处理与日志记录（`log`/`env_logger`），异步运行时（Tokio），SQLx 参数绑定，批量插入使用 `QueryBuilder`。
- **分支策略**：
  - 仓库未给出明确策略；遵循常规 Git Flow/PR 评审即可。

---

## 4. 核心依赖（Key Dependencies）

- 后端（Cargo.toml）
  - `tokio@1` - 异步运行时
  - `salvo@0.81` - HTTP 服务与路由（含 CORS）
  - `reqwest@0.12` - HTTP 客户端（JSON-RPC）
  - `sqlx@0.8` - PostgreSQL/TimescaleDB 访问
  - `serde@1` / `serde_json@1` / `serde_with@3.7.0` - 序列化
  - `ckb-jsonrpc-types@0.200.0` / `ckb-types@0.200.0` - CKB/FIBER 类型
  - `multiaddr@0.3` - 网络地址格式
  - `ipinfo@3` - IP 地理信息
  - 其他：`log@0.4`、`env_logger@0.11`、`jsonrpc-core@18.0`、`arc-swap@1`、`faster-hex@0.10.0`、`chrono@0.4`
- 前端（app/package.json）
  - `next@15.4.6`、`react@19.1.0`、`react-dom@19.1.0`
  - `@tanstack/react-query@5.85.0`、`@tanstack/react-table@8.21.3`
  - `echarts@6.0.0`
  - `tailwindcss@4`、`tailwind-merge@3.3.1`、`tailwind-variants@2.1.0`
  - `zod@4.0.17`
  - UI/工具：`@radix-ui/react-*`、`lucide-react`、`clsx`、`class-variance-authority`、`date-fns`、`numeral`

---

## 5. 常用命令（Common Commands）

```bash
# 前端（app/）
pnpm dev         # 启动开发环境（Next.js）
pnpm build       # 构建项目
pnpm start       # 启动生产构建
pnpm test        # 运行测试
pnpm test:ui     # 测试 UI
pnpm test:coverage  # 覆盖率

# 后端（参考 Dockerfile 构建步骤）
cargo build --release
```

---

## 6. 开发与运行流程（Workflow）

- 新功能开发流程：
  - 后端：
    - `src/bin/fiber-dashbord.rs` 初始化 PG 连接池与数据库（首次运行会执行 `db_schema/create_table.sql`），加载 UDT 关系缓存，定时任务每 30 分钟周期性从 `FIBER_RPC_URL` 拉取 `graph_nodes` 与 `graph_channels`，经 `pg_write` 批量落库。
    - 启动 HTTP 服务（端口由 `HTTP_PORT` 控制，Compose 中映射为 8080），暴露路由见下文。
  - 前端：
    - 基于 `app/src/features/dashboard/api/client.ts` 与 `app/src/features/dashboard/hooks/useDashboard.ts` 封装数据请求与缓存；默认在缺少真实 API 时回退本地假数据（由 `NEXT_PUBLIC_USE_MOCK_DATA` 控制）。
    - 采用 Feature-based 架构，新功能应在 `app/src/features/` 下创建独立模块。
- 测试与调试：
  - 前端使用 Vitest + Testing Library（见 `app/package.json` 与 `app/src/features/dashboard/__tests__`）。
  - 后端通过日志（`RUST_LOG`）与 SQLx 报错进行调试。
- 发布与部署：
  - 后端提供 `Dockerfile` 与 `compose.yaml`（TimescaleDB + 后端服务；环境变量包括 `DATABASE_URL`、`HTTP_PORT`、`FIBER_RPC_URL`）。
  - 前端按 Next.js 常规流程构建与启动（见 `app/README.md` 配置段）。

---

## 7. AI 使用注意事项（AI Usage Notes）

- **十六进制与大小端**：
  - 严格遵守小端十六进制文本存储规则（如容量 `u128`、时间/费率 `u64` 等）；解析/序列化使用现有转换逻辑（`U64Hex`、`U128Hex`、`faster_hex`），禁止更改为大端或移除 `0x` 前缀约定。
- **连续聚合与查询窗口**：
  - 不要修改 `db_schema/create_table.sql` 中物化视图定义、刷新策略与保留策略，依赖其提供的最新快照；读取侧查询窗口（近 3 小时/近 30 天）与分页逻辑需保持一致。
- **UDT 关系缓存与外键映射**：
  - 写入侧依赖全局缓存将 `Script` 映射为 `udt_infos.id`；变更 `pg_write` 缓存或关联查询前需同步审查 `init_global_cache`、`from_rpc_to_db_schema` 与插入顺序（UDT -> 依赖 -> 关系 -> 节点/通道）。
- **HTTP 路由与参数约定（后端）**：
  - 现有路由见 `src/bin/fiber-dashbord.rs` 与 `src/http_server.rs`：
    - `GET /nodes_hourly?page=0`
    - `GET /channels_hourly?page=0`
    - `GET /nodes_nearly_monthly?page=0`
    - `GET /channels_nearly_monthly?page=0`
    - `GET /node_udt_infos?node_id=0x...`
    - `POST /nodes_by_udt`（body 为 `ckb_jsonrpc_types::Script`）
    - `GET /channel_capacitys_hourly`
  - 修改时应保持参数名与分页/返回结构不变，避免破坏前后兼容。
- **前端架构与导入约定**：
  - 保持 `app/src/features/dashboard/api/types.ts` 中 Zod Schema 与 `app/docs/api-integration.md` 一致；避免直接绕过校验或更改 Schema 字段名。
  - Query Key 稳定性与缓存时间（`staleTime`/`gcTime`）请遵循 `app/src/features/dashboard/hooks/useDashboard.ts` 设定。
  - 新功能开发应遵循 Feature-based 架构，在 `app/src/features/` 下创建独立模块。
  - 共享组件使用 `@/shared/components/ui/` 路径，功能组件使用相对导入。
- **环境变量**：
  - 后端：`DATABASE_URL`、`HTTP_PORT`、`FIBER_RPC_URL`、`IPINFO_IO_TOKEN`（可选）。
  - 前端：`NEXT_PUBLIC_API_BASE_URL`、`NEXT_PUBLIC_USE_MOCK_DATA`、`NEXT_PUBLIC_API_TIMEOUT`。
  - 注意当前前端默认 `http://localhost:3001/api`，而后端默认 `HTTP_PORT=8080`（Compose 中设置并映射）；对接真实后端时需显式配置。
- **易错点**：
  - Multiaddr 解析仅支持 `Ip{4,6}+Tcp` 组合；地址转换逻辑位于 `pg_write::multiaddr_to_socketaddr`，勿引入阻塞或不兼容变更。
  - `ipinfo` 查询使用全局缓存；注意 `OnceLock` 的并发与生命周期。
  - SQLx 批量插入使用 `QueryBuilder::push_values(...take(...))` 有批量上限控制，调整需审慎。
  - 初次运行会根据表是否存在自动初始化 schema；不要在运行期随意更改存在性检查语句与初始化顺序。

---

## 8. 最近变更摘要（Recent Changes）

> 记录近 3-5 次重要变更的简述和日期。

- **2024-12-19**: 前端架构重构为 Feature-based 组织
  - 将 `app/src/libs/` 重构为 `app/src/features/dashboard/` 功能模块
  - 将 UI 组件移至 `app/src/shared/components/ui/`
  - 新增 `app/src/lib/` 存放工具函数和常量
  - 新增 `app/src/shared/types/` 存放共享类型定义
  - 更新所有导入路径，确保功能模块的独立性和可维护性
- 关键定义可参考：
  - HTTP 路由（`src/bin/fiber-dashbord.rs`、`src/http_server.rs`）
  - TimescaleDB 结构与策略（`db_schema/create_table.sql`）
  - 前端 API 契约（`app/docs/api-integration.md`、`app/src/features/dashboard/api/types.ts`）
