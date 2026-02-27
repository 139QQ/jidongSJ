# 服务模块文档

本文档详细描述项目中所有服务模块的用途、接口和使用方法。

## 目录

- [服务概览](#服务概览)
- [API Client](#api-client)
- [Cache Adapter](#cache-adapter)
- [Fund Service](#fund-service)
- [Nav Service](#nav-service)
- [Fund Manager](#fund-manager)
- [Request Scheduler](#request-scheduler)

---

## 服务概览

| 服务名 | 文件路径 | 职责 |
|--------|----------|------|
| ApiClient | `services/apiClient.ts` | 统一 HTTP 客户端 |
| CacheAdapter | `services/cacheAdapter.ts` | 缓存抽象层 |
| FundService | `services/fundService.ts` | 基金数据获取 |
| NavService | `services/navService.ts` | 净值数据获取 |
| FundManager | `services/fundManager.ts` | 用户基金管理 |
| RequestScheduler | `services/requestScheduler.ts` | 请求频率控制 |

---

## API Client

统一的 HTTP 客户端，封装 axios，提供请求调度、重试、日志等功能。

### 基本用法

```typescript
import { apiClient, apiGet, apiPost } from '@/services';

// 使用实例方法
const data = await apiClient.get<Fund[]>('fund_open_fund_daily_em');

// 带参数的请求
const ranks = await apiClient.get('fund_open_fund_rank_em', { 
  symbol: '股票型',
  limit: 100 
});

// 使用便捷函数
const data = await apiGet<Fund[]>('fund_open_fund_daily_em');
```

### API 参考

```typescript
class ApiClient {
  constructor(options?: ApiClientOptions)
  
  // GET 请求
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>
  
  // POST 请求
  async post<T>(endpoint: string, data?: unknown): Promise<T>
  
  // 获取原始 axios 实例（高级用法）
  getAxiosInstance(): AxiosInstance
  
  // 更新配置
  updateConfig(options: Partial<ApiClientOptions>): void
}

interface ApiClientOptions {
  baseURL?: string;        // 默认从 config 读取
  timeout?: number;        // 默认 180000ms
  retryCount?: number;     // 默认 3
  retryInterval?: number;  // 默认 3000ms
  headers?: Record<string, string>;
}
```

### 错误处理

```typescript
try {
  const data = await apiClient.get('endpoint');
} catch (error) {
  if (error.message.includes('超时')) {
    // 处理超时
  } else if (error.message.includes('Network')) {
    // 处理网络错误
  }
}
```

---

## Cache Adapter

为服务层提供统一的缓存接口，封装底层缓存实现细节。

### 缓存实例

```typescript
import { 
  serviceCache,    // 通用缓存（5分钟/30分钟）
  rankingCache,    // 排行数据（10分钟/1小时）
  realtimeCache,   // 实时数据（1分钟/5分钟）
  historyCache     // 历史数据（30分钟/24小时）
} from '@/services';
```

### 基本用法

```typescript
// 获取或设置缓存
const data = await serviceCache.getOrSet(
  'my_key',
  async () => {
    // 数据不存在时调用
    return await fetchData();
  },
  10 * 60 * 1000  // TTL: 10分钟
);

// 手动设置缓存
serviceCache.set('my_key', data, 60000);

// 生成缓存键
const key = rankingCache.generateKey('rank', { symbol: '股票型' });
// 结果: "rank?symbol=股票型"
```

### API 参考

```typescript
interface ICacheAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttl?: number): void
  has(key: string): boolean
  delete(key: string): void
}

class ServiceCacheAdapter implements ICacheAdapter {
  constructor(options?: ServiceCacheOptions)
  
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttl?: number): void
  has(key: string): boolean
  delete(key: string): void
  
  // 获取或设置（原子操作）
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T>
  
  // 生成缓存键
  generateKey(
    prefix: string, 
    params?: Record<string, string | number | boolean>
  ): string
}

interface ServiceCacheOptions {
  memoryTTL?: number;       // 内存缓存 TTL
  persistentTTL?: number;   // 持久化缓存 TTL
  compress?: boolean;       // 是否压缩
}
```

---

## Fund Service

提供基金相关的数据获取功能。

### 方法列表

```typescript
class FundService {
  // 获取开放式基金列表（约 8000+ 只）
  async getOpenFundList(): Promise<FundRealtime[]>
  
  // 搜索基金
  async searchFunds(keyword: string): Promise<FundRealtime[]>
  
  // 获取基金排行
  async getFundRank(
    symbol?: string,  // '全部' | '股票型' | '混合型' | ...
    limit?: number    // 默认 500
  ): Promise<FundRank[]>
  
  // 分页获取排行
  async getFundRankPaged(
    symbol?: string,
    page?: number,     // 从 1 开始
    pageSize?: number
  ): Promise<{ data: FundRank[]; total: number; hasMore: boolean }>
  
  // 获取净值估算
  async getFundEstimate(symbol?: string): Promise<FundEstimate[]>
  
  // 获取货币基金列表
  async getMoneyFundList(): Promise<unknown[]>
  
  // 获取 ETF 列表
  async getETFFundList(): Promise<unknown[]>
  
  // 获取 LOF 列表（可能返回空数组）
  async getLOFFundList(): Promise<unknown[]>
  
  // 获取基金概况
  async getFundOverview(code: string): Promise<unknown>
  
  // 获取香港基金排行
  async getHKFundRank(): Promise<unknown[]>
  
  // 获取规模变动
  async getFundScaleChange(): Promise<unknown[]>
  
  // 清除缓存
  clearCache(): void
}
```

### 使用示例

```typescript
import { fundService } from '@/services';

// 获取基金排行
const ranks = await fundService.getFundRank('股票型');
console.log(ranks[0]);
// {
//   rank: 1,
//   code: '000001',
//   name: '华夏成长',
//   unitNav: 1.2345,
//   dailyGrowthRate: 1.23,
//   year1: 15.6,
//   ...
// }

// 搜索基金
const results = await fundService.searchFunds('000001');
// 优先精确匹配代码，其次匹配名称

// 分页获取
const page1 = await fundService.getFundRankPaged('全部', 1, 50);
console.log(page1.hasMore); // 是否还有更多
```

---

## Nav Service

提供基金净值相关的数据获取和计算功能。

### 方法列表

```typescript
class NavService {
  // 获取历史净值
  async getNavHistory(
    code: string,
    indicator?: NavIndicator,  // '单位净值走势' | '累计净值走势' | ...
    period?: NavPeriod         // '1月' | '3月' | '1年' | '成立来' | ...
  ): Promise<FundNAV[]>
  
  // 获取货币基金历史
  async getMoneyFundHistory(code: string): Promise<MoneyFundNAV[]>
  
  // 获取 ETF 历史净值
  async getETFNavHistory(
    code: string,
    startDate?: string,  // 'YYYYMMDD'
    endDate?: string
  ): Promise<FundNAV[]>
  
  // 获取分级基金历史（容错处理）
  async getGradedFundHistory(code: string): Promise<FundNAV[]>
  
  // 获取香港基金历史
  async getHKFundHistory(code: string): Promise<FundNAV[]>
  
  // 获取最新净值
  async getLatestNav(code: string): Promise<FundNAV | null>
  
  // 批量获取历史净值
  async batchGetNavHistory(
    codes: string[],
    indicator?: NavIndicator
  ): Promise<Record<string, FundNAV[]>>
  
  // 计算收益率
  calculateReturns(navHistory: FundNAV[]): ReturnCalculation
  
  // 清除缓存
  clearCache(): void
}

// 类型定义
type NavIndicator = '单位净值走势' | '累计净值走势' | '累计收益率走势' | '同类排名走势' | '同类排名百分比';
type NavPeriod = '1月' | '3月' | '6月' | '1年' | '3年' | '5年' | '今年来' | '成立来';

interface ReturnCalculation {
  totalReturn: number;       // 总收益率(%)
  annualizedReturn: number;  // 年化收益率(%)
  maxDrawdown: number;       // 最大回撤(%)
  volatility: number;        // 年化波动率(%)
}
```

### 使用示例

```typescript
import { navService } from '@/services';

// 获取近1年历史净值
const history = await navService.getNavHistory(
  '000001',
  '单位净值走势',
  '1年'
);

// 获取最新净值
const latest = await navService.getLatestNav('000001');
console.log(latest?.unitNav);

// 计算收益率
const returns = navService.calculateReturns(history);
console.log(returns);
// {
//   totalReturn: 15.6,
//   annualizedReturn: 15.2,
//   maxDrawdown: 8.5,
//   volatility: 12.3
// }
```

---

## Fund Manager

管理用户关注的基金列表，提供 CRUD 和资产计算功能。

### 方法列表

```typescript
class FundManager {
  // 添加基金
  async addFund(
    code: string,
    remark?: string,       // 备注
    holdShares?: number,   // 持有份额
    costPrice?: number     // 成本价
  ): Promise<UserFund | null>
  
  // 删除基金
  deleteFund(code: string): boolean
  
  // 更新基金
  updateFund(code: string, data: FundUpdateData): boolean
  
  // 获取所有基金
  getAllFunds(): UserFund[]
  
  // 查询基金
  queryFunds(options: FundQueryOptions): UserFund[]
  
  // 检查是否已存在
  hasFund(code: string): boolean
  
  // 刷新基金净值
  async refreshFundNav(code: string): Promise<boolean>
  
  // 刷新所有基金净值
  async refreshAllNavs(): Promise<number>
  
  // 计算总资产
  calculateTotalAssets(): {
    totalCost: number;      // 总成本
    totalValue: number;     // 总市值
    totalProfit: number;    // 总收益
    totalProfitRate: number;// 总收益率
  }
}

// 更新数据类型
interface FundUpdateData {
  remark?: string;
  holdShares?: number;
  costPrice?: number;
  status?: FundStatus;
}

// 查询选项
interface FundQueryOptions {
  type?: FundType;
  status?: FundStatus;
  keyword?: string;
}
```

### 使用示例

```typescript
import { fundManager } from '@/services';

// 添加基金（带持仓信息）
const fund = await fundManager.addFund(
  '000001',
  '长期持有',
  1000,      // 持有 1000 份
  1.5        // 成本价 1.5 元
);

// 更新持仓
fundManager.updateFund('000001', {
  holdShares: 1500,
  costPrice: 1.45
});

// 计算资产
const assets = fundManager.calculateTotalAssets();
console.log(`总收益: ${assets.totalProfit}元 (${assets.totalProfitRate}%)`);

// 刷新所有净值
const updatedCount = await fundManager.refreshAllNavs();
console.log(`已更新 ${updatedCount} 只基金的净值`);
```

---

## Request Scheduler

控制 HTTP 请求的频率，防止触发 API 限流。

### 基本用法

```typescript
import { 
  scheduleRequest, 
  withRetry, 
  withTimeout,
  RequestScheduler 
} from '@/services';

// 调度单个请求（自动频率控制）
const data = await scheduleRequest(() => fetch('/api/data'));

// 高优先级请求（插队）
const urgentData = await scheduleRequest(() => fetch('/api/urgent'), 10);

// 带重试的请求
const data = await withRetry(
  () => fetch('/api/data'),
  3,          // 重试 3 次
  2000        // 间隔 2 秒
);

// 带超时的请求
const data = await withTimeout(
  () => fetch('/api/data'),
  5000        // 5秒超时
);
```

### 高级用法

```typescript
// 批量调度
const [data1, data2] = await Promise.all([
  scheduleRequest(() => fetch('/api/1')),
  scheduleRequest(() => fetch('/api/2'))
]);

// 串行执行
const results = await RequestScheduler.getInstance().scheduleSequential([
  () => fetch('/api/1'),
  () => fetch('/api/2'),
  () => fetch('/api/3')
]);

// 查看队列状态
const state = RequestScheduler.getInstance().getState();
console.log(state.queueLength);  // 待处理请求数
```

### API 参考

```typescript
class RequestScheduler {
  static getInstance(): RequestScheduler
  
  // 调度单个请求
  async schedule<T>(task: RequestTask<T>, priority?: number): Promise<T>
  
  // 批量调度（并行）
  async scheduleBatch<T>(tasks: RequestTask<T>[]): Promise<T[]>
  
  // 串行执行
  async scheduleSequential<T>(tasks: RequestTask<T>[]): Promise<T[]>
  
  // 清空队列
  clearQueue(): number
  
  // 获取状态
  getState(): SchedulerState
}

// 便捷函数
async function scheduleRequest<T>(task: RequestTask<T>, priority?: number): Promise<T>
async function withRetry<T>(task: RequestTask<T>, retryCount?: number, retryInterval?: number): Promise<T>
async function withTimeout<T>(task: RequestTask<T>, timeout: number): Promise<T>
```

---

## 服务组合使用

### 典型场景：加载基金详情

```typescript
import { fundService, navService } from '@/services';

async function loadFundDetail(code: string) {
  // 并行加载基础信息和历史净值
  const [overview, history, latest] = await Promise.all([
    fundService.getFundOverview(code),
    navService.getNavHistory(code, '单位净值走势', '1年'),
    navService.getLatestNav(code)
  ]);
  
  // 计算收益率
  const returns = navService.calculateReturns(history);
  
  return {
    overview,
    history,
    latest,
    returns
  };
}
```

### 典型场景：搜索并添加基金

```typescript
import { fundService, fundManager } from '@/services';

async function searchAndAdd(keyword: string) {
  // 搜索基金
  const results = await fundService.searchFunds(keyword);
  if (results.length === 0) {
    throw new Error('未找到基金');
  }
  
  const fund = results[0];
  
  // 添加到关注列表
  const added = await fundManager.addFund(fund.code, fund.name);
  
  return added;
}
```

---

## 更新记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-02-26 | v2.0 | 重构服务层，新增 ApiClient 和 CacheAdapter |
| 2026-02-26 | v1.0 | 初始版本 |
