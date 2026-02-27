# 服务模块文档

生成时间：2026-02-27 20:06:23

---

## fundService

_基金数据服务模块，提供基金列表、排行、估算等核心功能_

**文件**: `src/services/fundService.ts`

### 导出接口

```typescript
export class FundService
export const fundService
export const getOpenFundList
export const searchFunds
export const getFundRank
export const getFundEstimate
```

---

## fundInfoService

_基金信息服务模块，提供基金概况、费率、持仓、公告等详细信息_

**文件**: `src/services/fundInfoService.ts`

### 导出接口

```typescript
export async function getFundOverview
export async function getFundFee
export async function getFundPortfolio
export async function getFundDividendAnnouncements
export async function getFundReports
export async function getFundPersonnelAnnouncements
export async function getFundRating
export async function getFundManagers
export const fundInfoService
```

---

## apiClient

_API 客户端模块，统一的 HTTP 请求封装_

**文件**: `src/services/apiClient.ts`

### 导出接口

```typescript
export class ApiClient
export const apiClient
export async function apiGet
export async function apiPost
```

---

## cacheAdapter

_缓存适配器模块，提供多级缓存支持_

**文件**: `src/services/cacheAdapter.ts`

### 导出接口

```typescript
export class ServiceCacheAdapter
export const serviceCache
export const rankingCache
export const realtimeCache
export const historyCache
```

---

## fundManager

_基金管理模块，负责用户自选基金的增删改查_

**文件**: `src/services/fundManager.ts`

### 导出接口

```typescript
export class FundManager
export const fundManager
```

---
