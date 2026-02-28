# AKShare 基金数据 API 完整参考

生成时间：2026-02-28 17:17:23

官方文档：[https://akshare.akfamily.xyz/data/fund/fund_public.html](https://akshare.akfamily.xyz/data/fund/fund_public.html)

---

## 基础数据

### fund_open_fund_daily_em

**开放式基金实时数据**

_获取所有开放式基金的实时净值数据_

**返回值**: 基金列表，包含代码、名称、净值、增长率等

**缓存策略**: 交易时间 30 分钟，非交易时间 24 小时

**示例代码**:

```typescript
apiClient.get('fund_open_fund_daily_em')
```

---

### fund_open_fund_rank_em

**开放式基金排行**

_获取开放式基金按收益率排序的排行榜_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 可选值：`全部`, `股票型`, `混合型`, `债券型`, `指数型`, `QDII`, `FOF` |

**返回值**: 基金排行列表，包含排名、代码、名称、各周期收益率等

**缓存策略**: 交易时间 10 分钟，非交易时间 2 小时

**示例代码**:

```typescript
apiClient.get('fund_open_fund_rank_em', { symbol: '全部' })
```

---

### fund_open_fund_info_em

**开放式基金历史净值**

_获取单只基金的历史净值数据_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码，如 '000001' |
| indicator | str | 是 | 可选值：`单位净值走势`, `累计净值走势`, `累计收益率走势`, `同类排名走势`, `同类排名百分比` |
| period | str | 是 | 可选值：`1 月`, `3 月`, `6 月`, `1 年`, `3 年`, `5 年`, `今年来`, `成立来` |

**返回值**: 历史净值数据列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_open_fund_info_em', { symbol: '000001', indicator: '单位净值走势', period: '1 年' })
```

---

## ETF 基金

### fund_etf_fund_info_em

**ETF 基金历史净值**

_获取 ETF 基金的历史净值数据_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| fund | str | 是 | ⚠️ 必须使用 fund 参数，不能用 symbol 示例：`'510050'` |
| start_date | str | 是 | 开始日期，格式 YYYYMMDD 示例：`'20240101'` |
| end_date | str | 是 | 结束日期，格式 YYYYMMDD 示例：`'20241231'` |

**返回值**: ETF 基金历史净值数据

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_etf_fund_info_em', { fund: '510050', start_date: '20240101', end_date: '20241231' })
```

---

## 货币基金

### fund_money_fund_daily_em

**货币基金列表**

_获取所有货币市场基金列表_

**返回值**: 货币基金列表

**缓存策略**: 10 分钟

**示例代码**:

```typescript
apiClient.get('fund_money_fund_daily_em')
```

---

### fund_money_fund_info_em

**货币基金历史收益**

_获取货币基金的历史收益率数据_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000009'` |

**返回值**: 货币基金历史收益率数据

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_money_fund_info_em', { symbol: '000009' })
```

---

## 净值估算

### fund_value_estimation_em

**基金净值估算**

_获取基金的实时估算净值数据_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 可选值：`全部`, `股票型`, `混合型`, `债券型`, `指数型`, `QDII`, `FOF` |

**返回值**: 基金估算净值列表，包含估算值和偏差

**缓存策略**: 交易时间 1 分钟，非交易时间 30 分钟

**示例代码**:

```typescript
apiClient.get('fund_value_estimation_em', { symbol: '全部' })
```

---

## LOF 基金

### fund_lof_spot_em

**LOF 基金实时数据**

_获取 LOF 基金的实时数据_

**返回值**: LOF 基金实时数据列表

**缓存策略**: 10 分钟

> ⚠️ ⚠️ 服务器暂时不可用，已做降级处理

**示例代码**:

```typescript
apiClient.get('fund_lof_spot_em')
```

---

## 基金详细信息

### fund_overview_em

**基金概况**

_获取基金的基本概况信息_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |

**返回值**: 基金概况数据，包含全称、类型、规模、管理人等

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_overview_em', { symbol: '000001' })
```

---

### fund_fee_em

**基金费率**

_获取基金的各项费率信息_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |
| indicator | str | 否 | 可选值：`申购费率`, `赎回费率`, `销售服务费` 默认：`申购费率` |

**返回值**: 基金费率列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_fee_em', { symbol: '000001', indicator: '申购费率' })
```

---

### fund_portfolio_hold_em

**基金持仓 - 股票**

_获取基金的股票持仓信息_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |
| date | str | 否 | 年份，如 '2024' 默认：`当前年份` |

**返回值**: 股票持仓列表，包含代码、名称、占净值比例等

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_portfolio_hold_em', { symbol: '000001', date: '2024' })
```

---

### fund_portfolio_bond_hold_em

**基金持仓 - 债券**

_获取基金的债券持仓信息_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |
| date | str | 否 | 年份 默认：`当前年份` |

**返回值**: 债券持仓列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_portfolio_bond_hold_em', { symbol: '000001' })
```

---

### fund_portfolio_industry_allocation_em

**基金持仓 - 行业配置**

_获取基金的行业配置信息_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |
| date | str | 否 | 年份 默认：`当前年份` |

**返回值**: 行业配置列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_portfolio_industry_allocation_em', { symbol: '000001' })
```

---

## 基金公告

### fund_announcement_dividend_em

**基金分红公告**

_获取基金的分红相关公告_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |

**返回值**: 分红公告列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_announcement_dividend_em', { symbol: '000001' })
```

---

### fund_announcement_report_em

**基金定期报告**

_获取基金的定期报告（季报、年报等）_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |

**返回值**: 定期报告列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_announcement_report_em', { symbol: '000001' })
```

---

### fund_announcement_personnel_em

**基金人事公告**

_获取基金的人事变动公告_

**参数**:

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | str | 是 | 基金代码 示例：`'000001'` |

**返回值**: 人事公告列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_announcement_personnel_em', { symbol: '000001' })
```

---

## 评级与经理

### fund_rating_all

**基金评级**

_获取基金的评级信息_

**返回值**: 所有基金评级列表

**缓存策略**: 30 分钟

**示例代码**:

```typescript
apiClient.get('fund_rating_all')
```

---

### fund_manager_em

**基金经理**

_获取基金经理的详细信息_

**返回值**: 所有基金经理列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_manager_em')
```

---

## 其他

### fund_hk_rank_em

**香港基金排行**

_获取香港市场基金的排行榜_

**返回值**: 香港基金排行列表

**缓存策略**: 30 分钟

**示例代码**:

```typescript
apiClient.get('fund_hk_rank_em')
```

---

### fund_scale_change_em

**基金规模变动**

_获取基金规模变动数据_

**返回值**: 基金规模变动列表

**缓存策略**: 1 小时

**示例代码**:

```typescript
apiClient.get('fund_scale_change_em')
```

---
