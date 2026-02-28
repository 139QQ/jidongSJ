/**
 * 类型模块统一导出
 * @module types
 * @description 集中导出所有类型定义，方便统一引用
 * 
 * @example
 * ```typescript
 * import type { 
 *   FundBase, 
 *   FundNAV, 
 *   FundRank,
 *   FundType
 * } from '@/types';
 * ```
 */

// 导出所有类型和常量
// 注意：FundType 和 FundStatus 既是类型也是常量值，TypeScript 会自动处理
export {
  FundType,
  FundStatus,
  StorageKey,
  type FundType as FundTypeInterface,
  type FundStatus as FundStatusInterface,
  type StorageKeyType,
  type FundBase,
  type FundNAV,
  type MoneyFundNAV,
  type FundRealtime,
  type UserFund,
  type NavHistoryParams,
  type FundRank,
  type FundEstimate,
  type ApiResponse,
  type PaginationParams,
  type PaginationResponse,
  type RequestConfig,
  type FundUpdateData,
  type FundQueryOptions,
  type FundOverview,
  type FundFee,
  type StockHolding,
  type BondHolding,
  type IndustryAllocation,
  type FundPortfolio,
  type FundAnnouncement,
  type FundRating,
  type FundManagerInfo,
  type LOFRealtime,
  type ETFRealtime,
  type FundDividend,
  type FundSplit
} from './fund';
