# AKShare API 接口对照表

本文档列出项目中使用的所有 AKShare API 接口及其参数对照。

## 目录

- [基金数据接口](#基金数据接口)
- [净值数据接口](#净值数据接口)
- [缓存策略](#缓存策略)
- [错误处理](#错误处理)

---

## 基金数据接口

### 1. 开放式基金实时数据

**接口名称**: `fund_open_fund_daily_em`

**AKShare 文档**: https://akshare.akfamily.xyz/data/fund/fund_public.html

**项目实现**: `fundService.getOpenFundList()`

**请求示例**:
```typescript
import { fundService } from '@/services';

const funds = await fundService.getOpenFundList();
// 返回: FundRealtime[]
```

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| code | string | 基金代码 |
| name | string | 基金简称 |
| unitNav | number | 单位净值 |
| cumulativeNav | number | 累计净值 |
| dailyGrowthValue | number | 日增长值 |
| dailyGrowthRate | number | 日增长率(%) |
| purchaseStatus | string | 申购状态 |
| redeemStatus | string | 赎回状态 |
| fee | string | 手续费 |

**缓存策略**:
- 内存缓存: 10 分钟
- 持久化缓存: 30 分钟

---

### 2. 开放式基金排行

**接口名称**: `fund_open_fund_rank_em`

**项目实现**: `fundService.getFundRank(symbol, limit)`

**请求示例**:
```typescript
// 获取全部基金排行
const ranks = await fundService.getFundRank('全部');

// 获取股票型基金排行，限制前 100 条
const stockRanks = await fundService.getFundRank('股票型', 100);
```

**参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金类型: "全部", "股票型", "混合型", "债券型", "指数型" |
| limit | number | 否 | 限制返回条数，默认 500 |

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| rank | number | 排名 |
| code | string | 基金代码 |
| name | string | 基金简称 |
| unitNav | number | 单位净值 |
| dailyGrowthRate | number | 日增长率(%) |
| week1 | number | 近1周收益率(%) |
| month1 | number | 近1月收益率(%) |
| month3 | number | 近3月收益率(%) |
| month6 | number | 近6月收益率(%) |
| year1 | number | 近1年收益率(%) |
| thisYear | number | 今年来收益率(%) |

**缓存策略**:
- 内存缓存: 30 分钟
- 持久化缓存: 1 小时
- 使用专用 `rankingCache`（支持压缩）

---

### 3. 基金净值估算

**接口名称**: `fund_value_estimation_em`

**项目实现**: `fundService.getFundEstimate(symbol)`

**请求示例**:
```typescript
const estimates = await fundService.getFundEstimate('全部');
```

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| code | string | 基金代码 |
| name | string | 基金名称 |
| estimateNav | number | 估算净值 |
| estimateGrowthRate | string | 估算增长率 |
| publishedNav | number | 公布单位净值 |
| estimateDeviation | string | 估算偏差 |

**缓存策略**:
- 内存缓存: 5 分钟（更新频繁，不持久化）
- 使用 `realtimeCache`

---

### 4. 货币基金实时数据

**接口名称**: `fund_money_fund_daily_em`

**项目实现**: `fundService.getMoneyFundList()`

**缓存策略**:
- 内存缓存: 10 分钟
- 持久化缓存: 30 分钟

---

### 5. ETF 基金实时数据

**接口名称**: `fund_etf_fund_daily_em`

**项目实现**: `fundService.getETFFundList()`

**缓存策略**:
- 内存缓存: 10 分钟
- 持久化缓存: 30 分钟

---

### 6. LOF 基金实时数据

**接口名称**: `fund_lof_spot_em`

**项目实现**: `fundService.getLOFFundList()`

**⚠️ 注意**: 该接口当前服务器返回 500 错误，已实现优雅降级返回空数组。

---

### 7. 基金概况信息

**接口名称**: `fund_overview_em`

**项目实现**: `fundService.getFundOverview(code)`

**参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金代码 |

**缓存策略**:
- 内存缓存: 1 小时
- 持久化缓存: 24 小时

---

## 净值数据接口

### 8. 开放式基金历史净值

**接口名称**: `fund_open_fund_info_em`

**项目实现**: `navService.getNavHistory(code, indicator, period)`

**请求示例**:
```typescript
import { navService } from '@/services';

// 获取近1年单位净值走势
const history = await navService.getNavHistory(
  '000001',           // 基金代码
  '单位净值走势',     // 指标
  '1年'               // 时间段
);
```

**参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金代码 |
| indicator | string | 否 | 指标类型: "单位净值走势"(默认), "累计净值走势", "累计收益率走势" |
| period | string | 否 | 时间段: "1月", "3月", "6月", "1年", "3年", "5年", "今年来", "成立来"(默认) |

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| date | string | 净值日期 |
| unitNav | number | 单位净值 |
| cumulativeNav | number | 累计净值 |
| dailyGrowthRate | number | 日增长率(%) |
| purchaseStatus | string | 申购状态 |
| redeemStatus | string | 赎回状态 |

**缓存策略**:
- 内存缓存: 30 分钟
- 持久化缓存: 24 小时
- 使用专用 `historyCache`（长期缓存）

---

### 9. 货币基金历史收益

**接口名称**: `fund_money_fund_info_em`

**项目实现**: `navService.getMoneyFundHistory(code)`

**参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金代码 |

**返回字段**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| date | string | 净值日期 |
| tenThousandIncome | number | 每万份收益 |
| sevenDayAnnualized | number | 7日年化收益率(%) |

---

### 10. ETF 基金历史净值

**接口名称**: `fund_etf_fund_info_em`

**项目实现**: `navService.getETFNavHistory(code, startDate, endDate)`

**参数**:
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| fund | string | 是 | 基金代码 |
| start_date | string | 否 | 开始日期(YYYYMMDD) |
| end_date | string | 否 | 结束日期(YYYYMMDD) |

**⚠️ 注意**: 必须使用 `fund` 参数，而非 `symbol`。

---

## 缓存策略

### 多级缓存架构

```
┌─────────────────────────────────────────┐
│           应用层 (Application)           │
│         fundService / navService        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           缓存抽象层 (Adapter)           │
│  serviceCache / rankingCache / historyCache│
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         缓存管理器 (CacheManager)        │
│     统一接口，自动多级缓存管理            │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐   ┌─────▼─────┐
│ cache │    │persistent│   │ cacheManager│
│(内存) │    │  Cache   │   │  (统一接口) │
│  5分钟│    │(localStorage) │            │
│       │    │  30分钟-24小时 │           │
└───────┘    └─────────┘   └─────────────┘
```

### 缓存类型说明

| 缓存类型 | 用途 | 内存TTL | 持久化TTL |
|---------|------|---------|----------|
| `serviceCache` | 通用服务缓存 | 5分钟 | 30分钟 |
| `rankingCache` | 排行数据 | 10分钟 | 1小时 |
| `realtimeCache` | 实时数据 | 1分钟 | 5分钟 |
| `historyCache` | 历史数据 | 30分钟 | 24小时 |

---

## 错误处理

### HTTP 错误码处理

| 错误码 | 处理方式 | 用户提示 |
|--------|---------|---------|
| 500 | 返回空数组（LOF/分级基金） | 数据暂时不可用 |
| 404 | 抛出错误 | API接口不存在 |
| 超时 | 重试3次后失败 | 服务器响应较慢，请稍后重试 |
| 网络错误 | 重试3次后失败 | 网络错误，请检查网络连接 |

### 重试策略

```typescript
// 请求流程
apiClient.get() 
  → scheduleRequest()  // 频率控制
    → withRetry()      // 重试3次，间隔3秒
      → axios.get()    // HTTP请求
```

---

## 快速参考

### 常用函数速查表

```typescript
// 基金数据
fundService.getOpenFundList()           // 开放式基金列表
fundService.getFundRank(type)           // 基金排行
fundService.getFundEstimate(type)       // 净值估算
fundService.searchFunds(keyword)        // 搜索基金

// 净值数据
navService.getNavHistory(code)          // 历史净值
navService.getLatestNav(code)           // 最新净值
navService.getMoneyFundHistory(code)    // 货币基金历史
navService.calculateReturns(history)    // 计算收益率

// 缓存管理
cacheManager.get(key)                   // 获取缓存
cacheManager.set(key, data, strategy)   // 设置缓存
cacheManager.invalidate('fund_*')       // 批量失效
```

---

## 更新记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-02-26 | v1.1 | 重构缓存系统，新增 cacheAdapter 抽象层 |
| 2026-02-26 | v1.0 | 初始版本，整合所有 API 接口 |
