/**
 * 服务模块统一导出
 * @module services
 * @description 集中导出所有服务模块，方便统一引用
 * 
 * @example
 * ```typescript
 * import { 
 *   fundService, 
 *   navService, 
 *   fundManager, 
 *   storage,
 *   cache,
 *   RequestScheduler 
 * } from '@/services';
 * ```
 */

// 配置模块
export { 
  getConfig, 
  updateConfig, 
  resetConfig,
  setRequestInterval,
  getRequestInterval,
  setBaseURL,
  getBaseURL,
  defaultConfig 
} from './config';

// 请求调度模块
export { 
  RequestScheduler,
  scheduleRequest,
  scheduleBatch,
  scheduleSequential,
  delay,
  withRetry,
  withTimeout
} from './requestScheduler';

// API 客户端模块
export {
  ApiClient,
  apiClient,
  apiGet,
  apiPost,
  type ApiClientOptions
} from './apiClient';

// 缓存模块（基础）
export {
  CacheService,
  cache,
  generateCacheKey,
  type CacheStats
} from './cache';

// 持久化缓存模块（基础）
export {
  PersistentCacheService,
  persistentCache
} from './persistentCache';

// 缓存管理器模块（统一接口）
export {
  CacheManager,
  cacheManager,
  CacheStrategies,
  defaultCacheStrategy,
  getCache,
  setCache,
  getOrSetCache,
  deleteCache,
  clearCache,
  invalidateCache,
  type CacheStrategy,
  type CacheLayer,
  type CacheEntryInfo
} from './cacheManager';

// 缓存适配器模块（服务层抽象）
export {
  ServiceCacheAdapter,
  serviceCache,
  rankingCache,
  realtimeCache,
  historyCache,
  type ICacheAdapter,
  type ServiceCacheOptions
} from './cacheAdapter';

// 基金数据服务模块
export { 
  FundService,
  fundService,
  getOpenFundList,
  searchFunds,
  getFundRank,
  getFundEstimate
} from './fundService';

// 净值数据服务模块
export { 
  NavService,
  navService,
  getNavHistory,
  getMoneyFundHistory,
  getLatestNav,
  type NavIndicator,
  type NavPeriod,
  type ReturnCalculation
} from './navService';

// 存储服务模块
export { 
  StorageService,
  storage,
  StorageKey,
  setStorage,
  getStorage,
  removeStorage,
  clearStorage
} from './storage';

// 基金管理模块
export { 
  FundManager,
  fundManager,
  type FundQueryOptions,
  type FundUpdateData
} from './fundManager';

// 数据加载模块
export {
  DataLoader,
  dataLoader,
  loadAllData,
  preloadData,
  type ProgressCallback
} from './dataLoader';

// 交易时间管理模块
export {
  getTradingTimeConfig,
  updateTradingTimeConfig,
  resetTradingTimeConfig,
  isWeekend,
  isHoliday,
  isTradingDay,
  isTradingTime,
  getNextTradingDay,
  getPreviousTradingDay,
  getDaysToNextTradingDay,
  getMinutesToNextSession,
  getTradingStatus,
  getHolidayScheduleText,
  type TradingSession,
  type HolidayInfo,
  type TradingTimeConfig,
  type TradingStatusInfo
} from './tradingTime';

// 基金信息服务模块
export {
  fundInfoService,
  getFundOverview,
  getFundFee,
  getFundPortfolio,
  getFundDividendAnnouncements,
  getFundReports,
  getFundPersonnelAnnouncements,
  getFundRating,
  getFundManagers,
  // LOF 基金服务
  getLOFRealtime,
  getAllLOFRealtime,
  // ETF 基金服务
  getETFRealtime,
  getAllETFRealtime,
  // 分红送配服务
  getFundDividends,
  getFundSplits
} from './fundInfoService';
