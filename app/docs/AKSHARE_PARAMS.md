# AKShare 接口参数对照表

本文档对比项目中使用的 AKShare 接口参数与官方文档，确保参数正确性。

## 接口参数验证

### 1. fund_open_fund_rank_em (开放式基金排行)

**官方文档**: https://akshare.akfamily.xyz/data/fund/fund_public.html

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| symbol | str | "全部", "股票型", "混合型", "债券型", "指数型", "QDII", "FOF" | ✅ 正确使用 | ✅ 正常 |

**项目代码**:
```typescript
apiClient.get('fund_open_fund_rank_em', { symbol: '全部' })
apiClient.get('fund_open_fund_rank_em', { symbol: '股票型' })
```

---

### 2. fund_open_fund_daily_em (开放式基金实时数据)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| 无 | - | 无需参数 | ✅ 无参数 | ✅ 正常 |

**项目代码**:
```typescript
apiClient.get('fund_open_fund_daily_em')
```

---

### 3. fund_open_fund_info_em (开放式基金历史净值)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| symbol | str | 基金代码，如 "000001" | ✅ 正确使用 | ✅ 正常 |
| indicator | str | "单位净值走势", "累计净值走势", "累计收益率走势", "同类排名走势", "同类排名百分比" | ✅ 正确使用 | ✅ 正常 |
| period | str | "1月", "3月", "6月", "1年", "3年", "5年", "今年来", "成立来" | ✅ 正确使用 | ✅ 正常 |

**项目代码**:
```typescript
apiClient.get('fund_open_fund_info_em', {
  symbol: '000001',
  indicator: '单位净值走势',
  period: '1年'
})
```

---

### 4. fund_etf_fund_info_em (ETF 基金历史净值)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| fund | str | **必须使用 `fund`** | ✅ 正确使用 | ✅ 正常 |
| start_date | str | 开始日期 YYYYMMDD | ✅ 正确使用 | ✅ 正常 |
| end_date | str | 结束日期 YYYYMMDD | ✅ 正确使用 | ✅ 正常 |

**⚠️ 注意**: 此接口必须使用 `fund` 参数，不能使用 `symbol`。

**项目代码**:
```typescript
apiClient.get('fund_etf_fund_info_em', {
  fund: '510050',  // ✅ 正确
  start_date: '20240101',
  end_date: '20241231'
})
```

---

### 5. fund_money_fund_info_em (货币基金历史收益)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| symbol | str | 基金代码 | ✅ 正确使用 | ✅ 正常 |

**项目代码**:
```typescript
apiClient.get('fund_money_fund_info_em', { symbol: '000009' })
```

---

### 6. fund_value_estimation_em (基金净值估算)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| symbol | str | "全部", "股票型", "混合型", "债券型", "指数型", "QDII", "FOF" | ✅ 正确使用 | ✅ 正常 |

**项目代码**:
```typescript
apiClient.get('fund_value_estimation_em', { symbol: '全部' })
```

---

### 7. fund_lof_spot_em (LOF 基金实时数据)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| 无 | - | 无需参数 | ✅ 无参数 | ⚠️ 服务器 500 错误 |

**状态**: 接口本身正确，但服务器端暂时不可用，已做降级处理返回空数组。

---

### 8. fund_graded_fund_info_em (分级基金历史净值)

| 参数 | 类型 | 官方要求 | 项目使用 | 状态 |
|------|------|----------|----------|------|
| symbol | str | 基金代码 | ✅ 正确使用 | ⚠️ 服务器 500 错误 |

**状态**: 接口本身正确，但服务器端暂时不可用，已做降级处理返回空数组。

---

## 参数错误案例分析

### ❌ 错误案例 1: ETF 使用 symbol 参数

```typescript
// 错误
apiClient.get('fund_etf_fund_info_em', { 
  symbol: '510050',  // ❌ 错误，应该用 fund
  start_date: '20240101',
  end_date: '20241231'
})

// 正确
apiClient.get('fund_etf_fund_info_em', { 
  fund: '510050',  // ✅ 正确
  start_date: '20240101',
  end_date: '20241231'
})
```

---

## 验证结果汇总

| 接口 | 参数正确性 | 服务器状态 | 降级处理 |
|------|-----------|-----------|---------|
| fund_open_fund_rank_em | ✅ 正确 | ✅ 正常 | 无需 |
| fund_open_fund_daily_em | ✅ 正确 | ✅ 正常 | 无需 |
| fund_open_fund_info_em | ✅ 正确 | ✅ 正常 | 无需 |
| fund_etf_fund_info_em | ✅ 正确 | ✅ 正常 | 无需 |
| fund_money_fund_info_em | ✅ 正确 | ✅ 正常 | 无需 |
| fund_value_estimation_em | ✅ 正确 | ✅ 正常 | 无需 |
| fund_lof_spot_em | ✅ 正确 | ❌ 500 错误 | ✅ 已降级 |
| fund_graded_fund_info_em | ✅ 正确 | ❌ 500 错误 | ✅ 已降级 |

---

## 修复记录

### 2026-02-26 参数验证

1. ✅ 验证所有接口参数与 AKShare 官方文档一致
2. ✅ 确认 `fund_etf_fund_info_em` 使用 `fund` 参数（不是 `symbol`）
3. ✅ 确认 `fund_open_fund_info_em` 使用 `symbol` 参数
4. ✅ 修复 FundRankList 加载更多导致的空白页问题
5. ✅ 修复 FundSearchDialog 缓存检查逻辑

---

## 结论

**所有接口参数与 AKShare 官方文档一致，数据准确性得到保证。**

- ✅ 8 个接口参数全部正确
- ✅ 2 个接口服务器故障，已做优雅降级
- ✅ 6 个接口正常工作
