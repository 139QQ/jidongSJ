# 交易时间管理文档

## 概述

交易时间管理模块提供了完整的中国基金市场交易时间和节假日休市安排管理功能。

## 目录

1. [功能特性](#功能特性)
2. [交易时间安排](#交易时间安排)
3. [2026 年节假日休市安排](#2026-年节假日休市安排)
4. [API 使用指南](#api-使用指南)
5. [组件使用](#组件使用)
6. [配置说明](#配置说明)

## 功能特性

- ✅ 实时交易状态检查
- ✅ 节假日休市自动识别
- ✅ 周末休市识别
- ✅ 距离下一交易时段倒计时
- ✅ 下一个交易日计算
- ✅ 可配置的节假日安排
- ✅ 交易状态 UI 组件

## 交易时间安排

### 日常交易时间

| 时段 | 时间 |
|------|------|
| 上午交易时段 | 09:30 - 11:30 |
| 下午交易时段 | 13:00 - 15:00 |

### 交易日规则

- 周一至周五为交易日
- 周六、周日固定休市
- 国家法定节假日休市
- 调休工作日正常开市

## 2026 年节假日休市安排

| 节假日 | 休市时间 | 天数 | 备注 |
|--------|----------|------|------|
| 元旦 | 1 月 1 日 (周四) 至 1 月 3 日 (周六) | 3 天 | 1 月 5 日 (周一) 开市 |
| 春节 | 2 月 15 日 (周日) 至 2 月 23 日 (周一) | 9 天 | 2 月 24 日 (周二) 开市 |
| 清明节 | 4 月 4 日 (周六) 至 4 月 6 日 (周一) | 3 天 | 4 月 7 日 (周二) 开市 |
| 劳动节 | 5 月 1 日 (周五) 至 5 月 5 日 (周二) | 5 天 | 5 月 6 日 (周三) 开市 |
| 端午节 | 6 月 19 日 (周五) 至 6 月 21 日 (周日) | 3 天 | 6 月 22 日 (周一) 开市 |
| 中秋节 | 9 月 25 日 (周五) 至 9 月 27 日 (周日) | 3 天 | 9 月 28 日 (周一) 开市 |
| 国庆节 | 10 月 1 日 (周四) 至 10 月 7 日 (周三) | 7 天 | 10 月 8 日 (周四) 开市 |

## API 使用指南

### 导入模块

`	ypescript
import {
  getTradingStatus,
  isTradingTime,
  isTradingDay,
  isHoliday,
  isWeekend,
  getNextTradingDay,
  getPreviousTradingDay,
  getDaysToNextTradingDay,
  getMinutesToNextSession,
  getHolidayScheduleText
} from '@/services/tradingTime';
`

### 交易状态检查

`	ypescript
// 获取完整的交易状态信息
const status = getTradingStatus();
console.log(status);
/* 输出示例:
{
  isWeekend: false,
  isHoliday: false,
  isTradingDay: true,
  isTradingTime: true,
  status: 'trading',
  message: '交易中',
  nextTradingDay: Date,
  daysToNextTradingDay: 0,
  minutesToNextSession: 0
}
*/
`

### 交易时间判断

`	ypescript
// 检查是否是周末
const weekend = isWeekend(); // true/false

// 检查是否是节假日
const holiday = isHoliday(); // true/false

// 检查是否是交易日
const tradingDay = isTradingDay(); // true/false

// 检查是否在交易时间内
const trading = isTradingTime(); // true/false
`

### 交易日计算

`	ypescript
// 获取下一个交易日
const nextDay = getNextTradingDay(); // Date 对象

// 获取上一个交易日
const prevDay = getPreviousTradingDay(); // Date 对象

// 获取距离下一个交易日的天数
const days = getDaysToNextTradingDay(); // number

// 获取距离下一个交易时段的分钟数
const minutes = getMinutesToNextSession(); // number
`

### 获取节假日安排文本

`	ypescript
// 获取格式化的节假日安排文本
const schedule = getHolidayScheduleText();
console.log(schedule);
/* 输出:
2026 年基金市场节假日休市安排

元旦：2026-01-01 至 2026-01-03 (休市 3 天)
春节：2026-02-15 至 2026-02-23 (休市 9 天)
...
*/
`

## 组件使用

### TradingStatus 组件

在仪表盘或其他页面中显示交易状态：

`	ypescript
import { TradingStatus } from '@/components/TradingStatus';

// 在 JSX 中使用
function Dashboard() {
  return (
    <div>
      <TradingStatus showDetails={true} />
    </div>
  );
}
`

### 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showDetails | boolean | true | 是否显示节假日安排详情按钮 |

### 组件功能

- 显示当前市场状态（交易中/休市/盘前/已收盘）
- 显示距离下一交易时段的倒计时
- 提供节假日安排查看功能
- 每分钟自动更新状态

## 配置说明

### 修改交易时间

编辑 src/services/tradingTime.ts 文件：

`	ypescript
export const defaultTradingTimeConfig: TradingTimeConfig = {
  sessions: [
    {
      name: '上午交易时段',
      startTime: '09:30',
      endTime: '11:30'
    },
    {
      name: '下午交易时段',
      startTime: '13:00',
      endTime: '15:00'
    }
  ],
  // ... 其他配置
};
`

### 添加节假日

在 holidays 数组中添加新的节假日：

`	ypescript
holidays: [
  {
    name: '自定义节假日',
    startDate: '2026-12-25',
    endDate: '2026-12-25',
    days: 1
  },
  // ... 其他节假日
]
`

### 配置 API

`	ypescript
import { getTradingTimeConfig, updateTradingTimeConfig } from '@/services';

// 获取当前配置
const config = getTradingTimeConfig();

// 更新配置
updateTradingConfig({
  weekendClosed: true // 周末休市
});
`

## 相关文件

- src/services/tradingTime.ts - 交易时间管理模块
- src/components/TradingStatus.tsx - 交易状态提示组件
- src/services/index.ts - 服务模块统一导出

## 更新日志

### 2026-02-28
- 初始版本发布
- 实现完整的 2026 年节假日休市安排
- 添加交易状态检查功能
- 创建交易状态 UI 组件
