# 基金数据管理系统 (Fund Data Management System)

# 基金数据管理系统 (jidongSJ)

## 📖 项目概述

**基金数据管理系统**是一个基于 React + TypeScript 的现代化 Web 应用，用于基金数据的获取、管理和分析。支持基金净值查询、收益分析、LOF/ETF 数据、分红信息等多维度数据展示。


| 属性         | 详情                      |
| ------------ | ------------------------- |
| **项目名称** | jidongSJ                  |
| **技术栈**   | React + TypeScript + Vite |
| **UI 框架**  | Tailwind CSS + Radix UI   |
| **构建工具** | Vite                      |
| **代码规范** | ESLint + TypeScript       |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
cd app
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 预览生产构建

```bash
npm run preview
```

---

## 📁 项目结构

```
app/
├── src/
│   ├── components/          # React 组件
│   │   ├── FundList.tsx    # 基金列表
│   │   ├── FundRankList.tsx # 基金排名
│   │   ├── FundCompare.tsx  # 基金对比
│   │   ├── NavChart.tsx    # 净值走势图
│   │   ├── LOFList.tsx     # LOF 数据
│   │   ├── ETFList.tsx     # ETF 数据
│   │   ├── DividendList.tsx # 分红信息
│   │   ├── SettingsPanel.tsx # 设置面板
│   │   ├── ErrorAlert.tsx  # 错误提示
│   │   └── LoadingSpinner.tsx # 加载动画
│   ├── components/ui/       # UI 基础组件 (Radix UI)
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useFundManager.ts # 基金管理 Hook
│   │   └── useNavHistory.ts  # 净值历史 Hook
│   ├── services/            # API 服务
│   ├── types/               # TypeScript 类型定义
│   ├── lib/                 # 工具函数
│   ├── docs/                # 项目文档
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   ├── App.css              # 应用样式
│   └── index.css            # 全局样式
├── dist/                    # 构建输出
├── data/                    # 数据文件
├── docs/                    # 文档目录
├── package.json             # 依赖配置
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── postcss.config.js        # PostCSS 配置
├── tsconfig.json            # TypeScript 配置
└── eslint.config.js         # ESLint 配置
```

---

## ✨ 核心功能

### 1. 仪表盘 (Dashboard)

- 资产总览卡片
- 收益/亏损基金统计
- 净值走势图表
- 一键刷新数据

### 2. 基金管理

- 基金列表展示
- 基金排名查看
- **基金对比功能** ⭐ 新增
- 净值历史查询

### 3. 数据类型支持

- **基金数据** - 基础净值、累计净值
- **LOF 数据** - 上市开放式基金
- **ETF 数据** - 交易所交易基金 ⭐ 新增
- **分红信息** - 基金分红记录 ⭐ 新增

### 4. 设置面板

- 用户偏好设置
- 数据源配置
- 刷新频率设置

---

## 🛠 技术栈详解

### 前端框架


| 技术       | 版本    | 用途     |
| ---------- | ------- | -------- |
| React      | ^19.0.0 | UI 框架  |
| TypeScript | ^5.8.2  | 类型安全 |
| Vite       | ^6.2.4  | 构建工具 |

### UI 组件


| 技术         | 用途         |
| ------------ | ------------ |
| Tailwind CSS | 原子化 CSS   |
| Radix UI     | 无障碍组件库 |
| Lucide React | 图标库       |
| Sonner       | Toast 通知   |

### 状态管理

- React Hooks (useState, useEffect)
- 自定义 Hooks (useFundManager, useNavHistory)

### AI 集成

- LangChain MCP Adapters
- Model Context Protocol SDK

---

## 🔧 开发指南

### 添加新组件

1. 在 `src/components/` 创建组件文件
2. 使用 TypeScript 类型定义 Props
3. 导入所需 UI 组件
4. 在 `App.tsx` 中引入使用

### 添加新 Hook

1. 在 `src/hooks/` 创建 Hook 文件
2. 使用 `use` 前缀命名
3. 返回状态和操作方法
4. 处理错误和加载状态

### 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式声明
- Props 使用接口定义
- 错误使用 try-catch 处理

---

## 📊 API 审查报告

### API 覆盖

- ✅ 基金基础数据 API
- ✅ 净值历史 API
- ✅ 基金排名 API
- ✅ LOF 数据 API
- ✅ ETF 数据 API ⭐ 新增
- ✅ 分红数据 API ⭐ 新增

### 性能优化

- 数据缓存机制
- 按需加载组件
- 错误重试机制

---

## 🎨 UI 审查报告

### 界面组件

- ✅ Dashboard 布局
- ✅ Tab 导航
- ✅ 数据卡片
- ✅ 图表展示
- ✅ 加载状态
- ✅ 错误提示

### 响应式设计

- ✅ 移动端适配
- ✅ 平板适配
- ✅ 桌面端适配

---

## 📝 更新日志

### v0.0.0 (2026-02-28)

- ✨ 新增基金对比功能
- ✨ 新增 LOF/ETF/分红数据支持
- ✨ 新增净值走势图
- 🔧 优化代码结构
- 📝 完善项目文档

### v0.0.0 (2026-02-27)

- 🎉 项目初始化
- ✨ 基础基金数据获取
- ✨ Dashboard 界面
- ✨ 基金列表展示

---

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [LangChain](https://langchain.com/)

---

*最后更新: 2026-02-28*

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
