# 基金数据管理系统 (Fund Data Management System)

基于 AKShare / AKTools 构建的基金数据管理和可视化系统。

## 功能特性

### 核心功能

- **我的基金** - 管理和跟踪关注的基金，支持实时净值更新、持仓统计、收益计算
- **基金排行** - 查看各类基金排行榜，包括收益排行、规模排行等
- **LOF 基金** - 实时查看 LOF 基金行情数据，包括最新价、涨跌幅、成交量、溢价率等
- **ETF 基金** - 实时查看 ETF 基金行情数据，支持总市值、流通市值展示
- **分红送配** - 查询基金分红历史和拆分记录
- **仪表盘** - 资产概览、收益统计、净值走势图表
- **设置** - 自定义配置和系统设置
- **文档中心** - API 文档、架构说明、开发计划

### 数据支持

- 开放式基金（实时净值、历史净值、排行）
- 货币基金（列表、历史收益）
- ETF 基金（实时行情）
- LOF 基金（实时行情）
- 基金概况、费率、持仓、公告
- 基金评级、基金经理信息
- 基金分红、拆分历史

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 组件**: shadcn/ui
- **样式**: Tailwind CSS
- **图表**: Recharts
- **数据源**: AKShare / AKTools

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Python >= 3.8 (用于 AKShare)

### 安装依赖

`ash npm install `

### 启动开发服务器

`ash npm run dev `

### 构建生产版本

`ash npm run build `

### 预览生产构建

`ash npm run preview `

## 项目结构

` app/ ├── src/ │   ├── components/          # React 组件 │   │   ├── ui/             # shadcn/ui 基础组件 │   │   ├── FundList.tsx    # 基金列表组件 │   │   ├── FundRankList.tsx # 基金排行组件 │   │   ├── LOFList.tsx     # LOF 基金列表组件 │   │   ├── ETFList.tsx     # ETF 基金列表组件 │   │   ├── DividendList.tsx # 分红送配组件 │   │   └── ... │   ├── services/           # API 服务层 │   │   ├── fundService.ts  # 基金服务 │   │   ├── fundInfoService.ts # 基金信息服务 │   │   ├── navService.ts   # 净值服务 │   │   └── ... │   ├── hooks/              # 自定义 Hooks │   ├── types/              # TypeScript 类型定义 │   └── docs/               # 前端文档 ├── docs/                   # 后端文档 │   ├── API_REFERENCE.md    # API 参考 │   ├── ARCHITECTURE.md     # 架构文档 │   ├── DEVELOPMENT_PLAN.md # 开发计划 │   └── ... └── data/ └── db/                 # 数据库文件`

## API 文档

详细的 API 文档请参阅 [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

## 架构文档

系统架构说明请参阅 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 开发计划

项目开发计划和进度请参阅 [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)

## 版本历史

### v1.5.0 (2026-02-28)

- ✨ 新增 LOF 基金实时行情支持
- ✨ 新增 ETF 基金实时行情支持
- ✨ 新增基金分红送配查询功能
- ✨ 新增文档中心
- 🐛 修复类型定义导出问题
- 📝 更新开发计划文档

### v1.0.0 (2026-02-27)

- 🎉 初始版本发布
- 基础基金列表管理
- 基金排行功能
- 净值走势图表

## 开发团队

基于 AKShare / AKTools 构建

## 免责声明

数据仅供参考，投资有风险，入市需谨慎
