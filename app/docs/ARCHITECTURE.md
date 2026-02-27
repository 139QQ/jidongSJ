# 项目架构文档

本文档描述基金数据管理系统的整体架构设计。

## 目录

- [架构概览](#架构概览)
- [分层架构](#分层架构)
- [核心模块](#核心模块)
- [数据流](#数据流)
- [缓存策略](#缓存策略)
- [扩展指南](#扩展指南)

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      表现层 (Presentation)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   App.tsx    │  │  Components  │  │      Hooks       │  │
│  │   (路由)      │  │   (UI组件)   │  │  (状态管理)       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼────────────┘
          │                 │                   │
┌─────────▼─────────────────▼───────────────────▼────────────┐
│                    业务逻辑层 (Business)                     │
│         ┌─────────────────────────────────────┐              │
│         │         FundManager                 │              │
│         │   (用户基金增删改查/资产计算)         │              │
│         └─────────────────────────────────────┘              │
│         ┌─────────────────────────────────────┐              │
│         │         DataLoader                  │              │
│         │   (数据预加载/批量加载/进度管理)      │              │
│         └─────────────────────────────────────┘              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    服务层 (Services)                         │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  FundService    │  │   NavService    │                   │
│  │  (基金数据API)   │  │  (净值数据API)   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼────────────────────┼─────────────────────────────┘
            │                    │
┌───────────▼────────────────────▼─────────────────────────────┐
│                   基础设施层 (Infrastructure)                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ ApiClient  │  │CacheAdapter│  │   RequestScheduler     │ │
│  │ (HTTP客户端)│  │ (缓存抽象)  │  │     (请求调度)          │ │
│  └─────┬──────┘  └─────┬──────┘  └───────────┬────────────┘ │
│        │               │                     │              │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌───────────▼───────────┐  │
│  │   cache    │  │persistent  │  │       config          │  │
│  │  (内存缓存) │  │  Cache     │  │    (配置管理)          │  │
│  └────────────┘  │(localStorage)│  └───────────────────────┘  │
│                  └────────────┘                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 分层架构

### 1. 表现层 (Presentation Layer)

**职责**: 用户界面展示和用户交互处理

**核心组件**:
- `App.tsx` - 应用主入口，路由管理
- `FundList.tsx` - 我的基金列表
- `FundRankList.tsx` - 基金排行展示
- `FundSearchDialog.tsx` - 基金搜索添加
- `NavChart.tsx` - 净值走势图

**Hooks**:
- `useFundManager.ts` - 基金管理 Hook
- `useFundRank.ts` - 排行数据 Hook
- `useNavHistory.ts` - 净值历史 Hook

**设计原则**:
- 组件只负责 UI 渲染，业务逻辑交给 Hooks
- 通过 Props 和回调函数进行组件通信
- 使用 shadcn/ui 组件库保持 UI 一致性

---

### 2. 业务逻辑层 (Business Layer)

**职责**: 核心业务逻辑，数据协调

#### FundManager
```typescript
class FundManager {
  async addFund(code, remark?, holdShares?, costPrice?): Promise<UserFund>
  deleteFund(code): boolean
  updateFund(code, data): boolean
  getAllFunds(): UserFund[]
  calculateTotalAssets(): AssetSummary
  refreshFundNav(code): Promise<boolean>
}
```

#### DataLoader
```typescript
class DataLoader {
  async loadAllData(onProgress?): Promise<LoadResult>
  async preload(): Promise<void>
  checkCache(): CacheStatus
}
```

**设计原则**:
- 封装业务规则（如收益计算、持仓管理）
- 协调多个服务完成复杂操作
- 提供统一的数据变更通知机制

---

### 3. 服务层 (Service Layer)

**职责**: 外部 API 对接，数据获取和转换

#### FundService
负责基金列表、排行、估算等数据的获取。

```typescript
class FundService {
  // 数据来源: AKTools API
  async getOpenFundList(): Promise<FundRealtime[]>
  async getFundRank(symbol, limit): Promise<FundRank[]>
  async getFundEstimate(symbol): Promise<FundEstimate[]>
  async searchFunds(keyword): Promise<FundRealtime[]>
}
```

#### NavService
负责净值历史、收益率计算等。

```typescript
class NavService {
  // 数据来源: AKTools API
  async getNavHistory(code, indicator, period): Promise<FundNAV[]>
  async getLatestNav(code): Promise<FundNAV | null>
  calculateReturns(navHistory): ReturnCalculation
}
```

**设计原则**:
- 每个服务只负责一类数据
- 统一返回 TypeScript 类型化的数据
- 通过 CacheAdapter 自动处理缓存

---

### 4. 基础设施层 (Infrastructure Layer)

**职责**: 提供底层技术支持

#### ApiClient - HTTP 客户端
统一的 HTTP 请求封装，处理配置、调度、重试。

```typescript
class ApiClient {
  async get<T>(endpoint, params?): Promise<T>
  async post<T>(endpoint, data?): Promise<T>
  updateConfig(options): void
}
```

#### CacheAdapter - 缓存抽象
为服务层提供统一的缓存接口。

```typescript
interface ICacheAdapter {
  get<T>(key): T | null
  set<T>(key, data, ttl?): void
  has(key): boolean
  delete(key): void
}
```

实现类:
- `serviceCache` - 通用缓存
- `rankingCache` - 排行数据专用
- `realtimeCache` - 实时数据专用
- `historyCache` - 历史数据专用

#### RequestScheduler - 请求调度
控制请求频率，防止 API 限流。

```typescript
class RequestScheduler {
  async schedule<T>(task, priority?): Promise<T>
  clearQueue(): number
}
```

---

## 核心模块

### 模块依赖关系

```
App.tsx
├── FundList.tsx
│   └── useFundManager.ts
│       └── fundManager.ts
│           ├── fundService.ts ───┐
│           └── navService.ts ────┤
│                                 │
├── FundRankList.tsx              │
│   └── fundService.ts ───────────┤
│                                 │
└── FundSearchDialog.tsx          │
    └── fundService.ts ───────────┘
              │
              ├── apiClient.ts
              │   ├── requestScheduler.ts
              │   └── config.ts
              │
              └── cacheAdapter.ts
                  └── cacheManager.ts
                      ├── cache.ts
                      └── persistentCache.ts
```

### 解耦设计

**依赖倒置原则**:
- 服务层依赖 `CacheAdapter` 接口，而非具体缓存实现
- `FundManager` 通过接口使用服务，不直接依赖 `fundService` 实例

**实现方式**:
```typescript
// 好的实践：依赖抽象
class FundService {
  private cache = serviceCache  // 通过适配器
}

// 避免：直接依赖具体实现
class FundService {
  private cache = cache         // 直接依赖底层
  private persistent = persistentCache
}
```

---

## 数据流

### 场景 1: 初次加载基金排行

```
用户打开"排行"页面
       │
       ▼
FundRankList 调用 loadRankData('全部')
       │
       ▼
检查缓存 (loadedTypes / Cache)
       │
       ├── 命中 → 直接显示数据
       │
       └── 未命中
              │
              ▼
       fundService.getFundRank('全部')
              │
              ▼
       apiClient.get('fund_open_fund_rank_em')
              │
              ▼
       数据转换 (API → TypeScript 类型)
              │
              ▼
       写入缓存 (serviceCache + persistentCache)
              │
              ▼
       返回数据给组件
              │
              ▼
       渲染表格
```

### 场景 2: 搜索添加基金

```
用户打开搜索对话框
       │
       ▼
预加载基金列表 (后台)
       │
       ├── 从 persistentCache 恢复
       └── 或调用 fundService.getOpenFundList()
              │
              ▼
用户输入关键词
       │
       ▼
防抖搜索 (300ms)
       │
       ▼
本地过滤 allFunds 数组
       │
       ▼
显示搜索结果
       │
       ▼
用户点击"添加"
       │
       ▼
fundManager.addFund(code, name)
       │
       ▼
调用 navService.getLatestNav(code) 获取最新净值
       │
       ▼
保存到 storage (localStorage)
       │
       ▼
更新 UI，显示成功提示
```

---

## 缓存策略

### 多级缓存架构

```
┌──────────────────────────────────────────┐
│  L1: 组件状态 (React State)               │
│  - 生命周期: 组件挂载期间                  │
│  - 用途: 当前页面数据展示                  │
└──────────────────────────────────────────┘
                    │
                    ▼ (未命中)
┌──────────────────────────────────────────┐
│  L2: 内存缓存 (Map)                       │
│  - 生命周期: 应用运行期间                  │
│  - TTL: 1-30 分钟                         │
│  - 用途: 快速响应，减少重复请求            │
└──────────────────────────────────────────┘
                    │
                    ▼ (未命中)
┌──────────────────────────────────────────┐
│  L3: 持久化缓存 (localStorage)            │
│  - 生命周期: 长期保存                      │
│  - TTL: 30 分钟 - 7 天                    │
│  - 用途: 应用重启后快速恢复                │
└──────────────────────────────────────────┘
                    │
                    ▼ (未命中)
┌──────────────────────────────────────────┐
│  L4: 网络请求 (AKTools API)               │
│  - 实时数据，最慢但最准确                  │
└──────────────────────────────────────────┘
```

### 缓存一致性

```typescript
// 读取：从 L1 → L2 → L3
const getData = async () => {
  // L1: 检查组件状态
  if (state.data) return state.data;
  
  // L2: 检查内存缓存
  const memory = cache.get(key);
  if (memory) {
    setState(memory);
    return memory;
  }
  
  // L3: 检查持久化缓存
  const persistent = persistentCache.get(key);
  if (persistent) {
    cache.set(key, persistent); // 回填内存
    setState(persistent);
    return persistent;
  }
  
  // L4: 网络请求
  const data = await api.get(endpoint);
  cache.set(key, data);
  persistentCache.set(key, data);
  setState(data);
  return data;
};
```

---

## 扩展指南

### 添加新的 API 接口

1. **在 Service 中添加方法**:
```typescript
// fundService.ts
async getNewDataType(param: string): Promise<NewDataType[]> {
  return serviceCache.getOrSet(
    `new_data_${param}`,
    async () => {
      const data = await apiClient.get<ApiItem[]>('new_endpoint', { param });
      return data.map(item => ({ /* 转换 */ }));
    },
    10 * 60 * 1000  // TTL
  );
}
```

2. **在 types/fund.ts 中添加类型**:
```typescript
export interface NewDataType {
  field1: string;
  field2: number;
}
```

3. **更新 API_REFERENCE.md**

---

### 添加新的缓存类型

```typescript
// cacheAdapter.ts
export const customCache = new ServiceCacheAdapter({
  memoryTTL: 60 * 1000,        // 1分钟
  persistentTTL: 10 * 60 * 1000, // 10分钟
  compress: true
});
```

---

## 性能优化

### 已实施的优化

| 优化项 | 实现方式 | 效果 |
|--------|---------|------|
| 请求频率控制 | RequestScheduler | 避免 API 限流 |
| 多级缓存 | CacheManager | 减少 90%+ 的重复请求 |
| 防抖搜索 | useRef + setTimeout | 减少无效搜索 |
| 虚拟列表 | (待实现) | 处理大量数据 |
| 数据压缩 | persistentCache 压缩 | 减少 20-40% 存储 |

---

## 更新记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-02-26 | v2.0 | 重构为分层架构，添加 CacheAdapter 抽象层 |
| 2026-02-26 | v1.0 | 初始架构设计 |
