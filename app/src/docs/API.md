# API 文档

## 概述

基金数据管理系统使用 AKTools 提供的 HTTP API 获取基金数据。

**基础 URL**: `http://45.152.66.117:8080/api/public`

**请求格式**: `GET /api/public/{interface_name}`

## 请求控制

### 请求间隔

系统默认请求间隔为 1000ms（1秒），可通过以下方式配置：

```typescript
import { setRequestInterval } from '@/services/config';

setRequestInterval(2000); // 设置为2秒
```

### 超时设置

默认超时时间为 30000ms（30秒）：

```typescript
import { updateConfig } from '@/services/config';

updateConfig({ timeout: 60000 }); // 设置为60秒
```

## 接口列表

### 1. 获取开放式基金实时数据

**接口**: `fund_open_fund_daily_em`

**方法**: GET

**参数**: 无

**响应示例**:
```json
[
  {
    "基金代码": "000001",
    "基金简称": "华夏成长混合",
    "单位净值": 1.2345,
    "累计净值": 2.3456,
    "前交易日-单位净值": 1.2300,
    "前交易日-累计净值": 2.3411,
    "日增长值": 0.0045,
    "日增长率": 0.37,
    "申购状态": "开放申购",
    "赎回状态": "开放赎回",
    "手续费": "0.15%"
  }
]
```

### 2. 获取货币基金实时数据

**接口**: `fund_money_fund_daily_em`

**方法**: GET

**参数**: 无

### 3. 获取ETF基金实时数据

**接口**: `fund_etf_fund_daily_em`

**方法**: GET

**参数**: 无

### 4. 获取LOF基金实时数据

**接口**: `fund_lof_spot_em`

**方法**: GET

**参数**: 无

### 5. 获取基金排行

**接口**: `fund_info_index_em`

**方法**: GET

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 否 | 基金类型，默认"全部" |
| indicator | string | 否 | 指标类型，默认"全部" |

**symbol 可选值**:
- `全部`
- `沪深指数`
- `行业主题`
- `大盘指数`
- `中盘指数`
- `小盘指数`
- `股票指数`
- `债券指数`

### 6. 获取基金净值估算

**接口**: `fund_value_estimation_em`

**方法**: GET

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 否 | 基金类型，默认"全部" |

**symbol 可选值**:
- `全部`
- `股票型`
- `混合型`
- `债券型`
- `指数型`
- `QDII`
- `ETF联接`
- `LOF`
- `场内交易基金`

### 7. 获取基金历史净值

**接口**: `fund_open_fund_info_em`

**方法**: GET

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金代码 |
| indicator | string | 否 | 指标类型，默认"单位净值走势" |
| period | string | 否 | 时间段，默认"成立来" |

**indicator 可选值**:
- `单位净值走势`
- `累计净值走势`
- `累计收益率走势`
- `同类排名走势`
- `同类排名百分比`
- `分红送配详情`
- `拆分详情`

**period 可选值**:
- `1月`
- `3月`
- `6月`
- `1年`
- `3年`
- `5年`
- `今年来`
- `成立来`

### 8. 获取货币基金历史收益

**接口**: `fund_money_fund_info_em`

**方法**: GET

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金代码 |

### 9. 获取ETF基金历史净值

**接口**: `fund_etf_fund_info_em`

**方法**: GET

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fund | string | 是 | 基金代码 |
| start_date | string | 否 | 开始日期，格式YYYYMMDD |
| end_date | string | 否 | 结束日期，格式YYYYMMDD |

### 10. 获取基金基本信息

**接口**: `fund_overview_em`

**方法**: GET

**参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| symbol | string | 是 | 基金代码 |

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 接口不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

## 数据更新说明

- **开放式基金净值**: 每个交易日 16:00-23:00 更新
- **货币基金收益**: 每个交易日 16:00-23:00 更新
- **ETF基金净值**: 每个交易日 16:00-23:00 更新
- **净值估算**: 交易日盘中实时估算

## 使用示例

### 使用 fundService 获取数据

```typescript
import { fundService } from '@/services/fundService';

// 获取开放式基金列表
const funds = await fundService.getOpenFundList();

// 搜索基金
const results = await fundService.searchFunds('白酒');

// 获取基金排行
const ranks = await fundService.getFundRank('混合型');

// 获取基金估算净值
const estimates = await fundService.getFundEstimate('全部');
```

### 使用 navService 获取净值历史

```typescript
import { navService } from '@/services/navService';

// 获取基金历史净值
const history = await navService.getNavHistory('000001');

// 获取货币基金历史
const moneyHistory = await navService.getMoneyFundHistory('000009');

// 获取ETF历史净值
const etfHistory = await navService.getETFNavHistory('510300', '20230101', '20231231');
```

## 注意事项

1. 请求间隔不宜过短，建议至少 500ms
2. 大量数据请求请使用批量接口
3. 注意处理网络异常和超时情况
4. 基金数据更新有延迟，仅供参考
