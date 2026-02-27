# 基金数据管理系统

基于 React + TypeScript + AKShare/AKTools 构建的基金数据获取和管理系统。

## 功能特性

- **基金数据获取**: 从 AKTools API 获取基金实时数据、历史净值、排行等信息
- **请求间隔控制**: 可配置的请求间隔，避免请求过于频繁
- **基金CRUD管理**: 完整的基金增删改查功能
- **净值数据展示**: 净值走势图、历史数据表格
- **基金排行**: 查看各类基金排行和估算净值
- **数据导入导出**: 支持基金数据的备份和恢复

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + shadcn/ui
- **图表**: Recharts
- **数据源**: AKShare / AKTools

## 项目结构

```
src/
├── components/          # React 组件
│   ├── FundList.tsx        # 基金列表组件
│   ├── FundSearchDialog.tsx # 基金搜索对话框
│   ├── FundDetailDialog.tsx # 基金详情对话框
│   ├── FundRankList.tsx     # 基金排行列表
│   ├── NavChart.tsx         # 净值走势图
│   └── SettingsPanel.tsx    # 设置面板
├── hooks/              # 自定义 React Hooks
│   ├── useFundManager.ts   # 基金管理 Hook
│   ├── useNavHistory.ts    # 净值历史 Hook
│   └── useFundRank.ts      # 基金排行 Hook
├── services/           # 服务模块
│   ├── config.ts           # 配置管理
│   ├── requestScheduler.ts # 请求调度器
│   ├── fundService.ts      # 基金数据服务
│   ├── navService.ts       # 净值数据服务
│   ├── fundManager.ts      # 基金管理器
│   ├── storage.ts          # 本地存储服务
│   └── index.ts            # 模块导出
├── types/              # TypeScript 类型定义
│   └── fund.ts             # 基金相关类型
├── docs/               # 文档
│   └── README.md           # 项目说明
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 模块文档

### 1. 配置模块 (services/config.ts)

管理 API 请求配置，包括基础 URL、超时时间、请求间隔等。

```typescript
import { getConfig, updateConfig, setRequestInterval } from '@/services/config';

// 获取当前配置
const config = getConfig();

// 更新配置
updateConfig({ timeout: 60000 });

// 设置请求间隔
setRequestInterval(2000); // 2秒
```

### 2. 请求调度模块 (services/requestScheduler.ts)

控制 HTTP 请求的间隔时间，防止请求过于频繁。

```typescript
import { RequestScheduler, scheduleRequest } from '@/services/requestScheduler';

// 使用调度器执行请求
const scheduler = RequestScheduler.getInstance();
const result = await scheduler.schedule(() => fetch('/api/data'));

// 批量执行请求
const results = await scheduler.scheduleBatch([
  () => fetch('/api/fund/000001'),
  () => fetch('/api/fund/000002'),
]);
```

### 3. 基金数据服务 (services/fundService.ts)

封装 AKTools API 的基金数据获取功能。

```typescript
import { fundService } from '@/services/fundService';

// 获取开放式基金列表
const funds = await fundService.getOpenFundList();

// 搜索基金
const results = await fundService.searchFunds('白酒');

// 获取基金排行
const ranks = await fundService.getFundRank('混合型');
```

### 4. 净值数据服务 (services/navService.ts)

获取基金历史净值数据。

```typescript
import { navService } from '@/services/navService';

// 获取基金历史净值
const history = await navService.getNavHistory('000001', '单位净值走势');

// 获取货币基金历史
const moneyHistory = await navService.getMoneyFundHistory('000009');

// 计算收益率
const returns = navService.calculateReturns(history);
```

### 5. 基金管理模块 (services/fundManager.ts)

管理用户关注的基金列表，提供完整的 CRUD 功能。

```typescript
import { fundManager } from '@/services/fundManager';

// 添加基金
await fundManager.addFund('000001', '我的基金', 1000, 1.5);

// 获取所有基金
const funds = fundManager.getAllFunds();

// 更新基金
fundManager.updateFund('000001', { holdShares: 2000 });

// 删除基金
fundManager.deleteFund('000001');

// 刷新净值
await fundManager.refreshAllNavs();

// 计算总资产
const assets = fundManager.calculateTotalAssets();
```

### 6. 存储服务 (services/storage.ts)

封装 localStorage 操作，提供类型安全的存储功能。

```typescript
import { storage, StorageKey } from '@/services/storage';

// 存储数据
storage.set(StorageKey.USER_FUNDS, fundList);

// 读取数据
const funds = storage.get<UserFund[]>(StorageKey.USER_FUNDS, []);

// 带过期时间的存储
storage.setWithExpiry('cache', data, 60000); // 1分钟过期
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 配置说明

### 请求间隔设置

在"设置"页面可以配置数据请求的间隔时间，默认为 1000ms（1秒）。

### API 地址配置

默认使用 `http://45.152.66.117:8080/api/public`，可以在设置页面修改。

## 数据备份

支持基金数据的导入和导出：

- **导出**: 将关注的基金数据导出为 JSON 文件
- **导入**: 从 JSON 文件恢复基金数据

## 注意事项

1. 基金数据仅供参考，投资有风险，入市需谨慎
2. 请求间隔不宜设置过短，避免对服务器造成压力
3. 建议定期导出数据备份

## 许可证

MIT
