# 缓存策略文档

生成时间：2026-02-28 17:17:23

---

## 缓存架构

项目采用三级缓存架构：

1. **内存缓存** - 使用 Map 存储，最快访问速度
2. **本地存储** - 使用 localStorage，持久化存储
3. **IndexedDB** - 大容量数据存储（可选）

## 各接口缓存策略

| 接口 | 缓存时间 | 说明 |
| --- | --- | --- |
| fund_open_fund_daily_em | 交易时间 30 分钟，非交易时间 24 小时 |  |
| fund_open_fund_rank_em | 交易时间 10 分钟，非交易时间 2 小时 |  |
| fund_open_fund_info_em | 1 小时 |  |
| fund_etf_fund_info_em | 1 小时 |  |
| fund_money_fund_daily_em | 10 分钟 |  |
| fund_money_fund_info_em | 1 小时 |  |
| fund_value_estimation_em | 交易时间 1 分钟，非交易时间 30 分钟 |  |
| fund_lof_spot_em | 10 分钟 | ⚠️ 服务器暂时不可用，已做降级处理 |
| fund_overview_em | 1 小时 |  |
| fund_fee_em | 1 小时 |  |
| fund_portfolio_hold_em | 1 小时 |  |
| fund_portfolio_bond_hold_em | 1 小时 |  |
| fund_portfolio_industry_allocation_em | 1 小时 |  |
| fund_announcement_dividend_em | 1 小时 |  |
| fund_announcement_report_em | 1 小时 |  |
| fund_announcement_personnel_em | 1 小时 |  |
| fund_rating_all | 30 分钟 |  |
| fund_manager_em | 1 小时 |  |
| fund_hk_rank_em | 30 分钟 |  |
| fund_scale_change_em | 1 小时 |  |

## 缓存键生成规则

```typescript
// 基础格式
[接口名]?[参数 1]=[值 1]&[参数 2]=[值 2]

// 示例
fund_open_fund_rank_em?symbol=全部
fund_open_fund_info_em?symbol=000001&indicator=单位净值走势&period=1 年
```
