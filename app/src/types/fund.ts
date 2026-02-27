/**
 * 基金数据类型定义模块
 * @module types/fund
 * @description 定义基金相关的所有数据类型和接口
 */

/** 基金类型 */
export type FundType = 
  | '股票型'
  | '混合型'
  | '债券型'
  | '指数型'
  | 'QDII'
  | 'ETF-场内'
  | 'LOF'
  | '货币型'
  | '理财型'
  | '分级基金'
  | '未知';

/** 基金类型常量 */
export const FundType = {
  STOCK: '股票型' as const,
  MIXED: '混合型' as const,
  BOND: '债券型' as const,
  INDEX: '指数型' as const,
  QDII: 'QDII' as const,
  ETF: 'ETF-场内' as const,
  LOF: 'LOF' as const,
  MONEY: '货币型' as const,
  FINANCIAL: '理财型' as const,
  GRADED: '分级基金' as const,
  UNKNOWN: '未知' as const
};

/** 基金状态 */
export type FundStatus = 'active' | 'inactive' | 'suspended';

/** 基金状态常量 */
export const FundStatus = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
  SUSPENDED: 'suspended' as const
};

/** 存储键名 */
export type StorageKeyType = 
  | 'fund_user_funds'
  | 'fund_request_config'
  | 'fund_favorite_funds'
  | 'fund_nav_history_cache'
  | 'fund_last_sync_time';

/** 存储键名常量 */
export const StorageKey = {
  USER_FUNDS: 'fund_user_funds' as const,
  REQUEST_CONFIG: 'fund_request_config' as const,
  FAVORITE_FUNDS: 'fund_favorite_funds' as const,
  NAV_HISTORY_CACHE: 'fund_nav_history_cache' as const,
  LAST_SYNC_TIME: 'fund_last_sync_time' as const
};

/** 基金基础信息接口 */
export interface FundBase {
  /** 基金代码 */
  code: string;
  /** 基金名称 */
  name: string;
  /** 基金类型 */
  type: FundType;
  /** 基金管理人 */
  manager?: string;
  /** 基金托管人 */
  custodian?: string;
  /** 成立日期 */
  establishDate?: string;
  /** 业绩比较基准 */
  benchmark?: string;
  /** 跟踪标的 */
  trackingTarget?: string;
}

/** 基金净值数据接口 */
export interface FundNAV {
  /** 净值日期 */
  date: string;
  /** 单位净值 */
  unitNav: number;
  /** 累计净值 */
  cumulativeNav: number;
  /** 日增长率 */
  dailyGrowthRate?: number;
  /** 日增长值 */
  dailyGrowthValue?: number;
  /** 申购状态 */
  purchaseStatus?: string;
  /** 赎回状态 */
  redeemStatus?: string;
}

/** 货币基金净值数据接口 */
export interface MoneyFundNAV {
  /** 净值日期 */
  date: string;
  /** 每万份收益 */
  tenThousandIncome: number;
  /** 7日年化收益率 */
  sevenDayAnnualized: number;
  /** 申购状态 */
  purchaseStatus?: string;
  /** 赎回状态 */
  redeemStatus?: string;
}

/** 基金实时数据接口 */
export interface FundRealtime {
  /** 基金代码 */
  code: string;
  /** 基金名称 */
  name: string;
  /** 单位净值 */
  unitNav: number;
  /** 累计净值 */
  cumulativeNav: number;
  /** 前交易日单位净值 */
  prevUnitNav: number;
  /** 前交易日累计净值 */
  prevCumulativeNav: number;
  /** 日增长值 */
  dailyGrowthValue: number;
  /** 日增长率 */
  dailyGrowthRate: number;
  /** 申购状态 */
  purchaseStatus: string;
  /** 赎回状态 */
  redeemStatus: string;
  /** 手续费 */
  fee: string;
}

/** 用户关注的基金接口 */
export interface UserFund extends FundBase {
  /** 唯一标识 */
  id: string;
  /** 添加时间 */
  addedAt: string;
  /** 备注 */
  remark?: string;
  /** 持有份额 */
  holdShares?: number;
  /** 成本价 */
  costPrice?: number;
  /** 状态 */
  status: FundStatus;
  /** 最后更新时间 */
  lastUpdated: string;
  /** 最新净值 */
  latestNav?: FundNAV;
}

/** 基金历史净值查询参数 */
export interface NavHistoryParams {
  /** 基金代码 */
  code: string;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
  /** 指标类型 */
  indicator?: '单位净值走势' | '累计净值走势' | '累计收益率走势' | '同类排名走势' | '同类排名百分比';
  /** 时间段 */
  period?: '1月' | '3月' | '6月' | '1年' | '3年' | '5年' | '今年来' | '成立来';
}

/** 基金排行数据接口 */
export interface FundRank {
  /** 序号 */
  rank: number;
  /** 基金代码 */
  code: string;
  /** 基金名称 */
  name: string;
  /** 单位净值 */
  unitNav: number;
  /** 累计净值 */
  cumulativeNav: number;
  /** 日期 */
  date: string;
  /** 日增长率 */
  dailyGrowthRate: number;
  /** 近 1 周 */
  week1: number;
  /** 近 1 月 */
  month1: number;
  /** 近 3 月 */
  month3: number;
  /** 近 6 月 */
  month6: number;
  /** 近 1 年 */
  year1: number;
  /** 近 2 年 */
  year2: number;
  /** 近 3 年 */
  year3: number;
  /** 今年来 */
  thisYear: number;
  /** 成立来 */
  sinceEstablish: number;
  /** 手续费 */
  fee: string;
}

/** 基金估算净值接口 */
export interface FundEstimate {
  /** 基金代码 */
  code: string;
  /** 基金名称 */
  name: string;
  /** 估算净值 */
  estimateNav: number;
  /** 估算增长率 */
  estimateGrowthRate: string;
  /** 公布单位净值 */
  publishedNav: number;
  /** 公布日增长率 */
  publishedGrowthRate: string;
  /** 估算偏差 */
  estimateDeviation: string;
}

/** API响应数据接口 */
export interface ApiResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 响应时间 */
  timestamp: string;
}

/** 分页查询参数 */
export interface PaginationParams {
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 分页响应数据接口 */
export interface PaginationResponse<T> {
  /** 数据列表 */
  list: T[];
  /** 总数量 */
  total: number;
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/** 请求配置接口 */
export interface RequestConfig {
  /** 基础URL */
  baseURL: string;
  /** 超时时间(ms) */
  timeout: number;
  /** 请求间隔(ms) */
  requestInterval: number;
  /** 重试次数 */
  retryCount: number;
  /** 重试间隔(ms) */
  retryInterval: number;
}

/** 基金更新数据 */
export interface FundUpdateData {
  /** 备注 */
  remark?: string;
  /** 持有份额 */
  holdShares?: number;
  /** 成本价 */
  costPrice?: number;
  /** 状态 */
  status?: FundStatus;
}

/** 基金查询选项 */
export interface FundQueryOptions {
  /** 基金类型过滤 */
  type?: FundType;
  /** 状态过滤 */
  status?: FundStatus;
  /** 关键词搜索 */
  keyword?: string;
}

/** 基金概况信息接口 */
export interface FundOverview {
  /** 基金全称 */
  fundFullName: string;
  /** 基金简称 */
  fundShortName: string;
  /** 基金代码 */
  fundCode: string;
  /** 基金类型 */
  fundType: string;
  /** 发行日期 */
  issueDate: string;
  /** 成立日期 */
  establishDate: string;
  /** 成立规模 */
  establishScale: string;
  /** 资产规模 */
  assetScale: string;
  /** 份额规模 */
  shareScale: string;
  /** 基金管理人 */
  fundManager: string;
  /** 基金托管人 */
  fundTrustee: string;
  /** 基金经理人 */
  fundDirectors: string;
  /** 成立来分红 */
  totalDividend: string;
  /** 管理费率 */
  managementFee: string;
  /** 托管费率 */
  trusteeFee: string;
  /** 销售服务费率 */
  salesServiceFee: string;
  /** 最高认购费率 */
  maxSubscriptionFee: string;
  /** 业绩比较基准 */
  benchmark: string;
  /** 跟踪标的 */
  trackingTarget: string;
}

/** 基金费率信息接口 */
export interface FundFee {
  /** 费用类型 */
  feeType: string;
  /** 条件或名称 */
  condition: string;
  /** 费用 */
  fee: number;
  /** 原费率 */
  originalFee: string;
  /** 优惠费率 */
  discountedFee: string;
}

/** 股票持仓信息接口 */
export interface StockHolding {
  /** 股票代码 */
  stockCode: string;
  /** 股票名称 */
  stockName: string;
  /** 占净值比例 */
  netValueRatio: number;
  /** 持股数 (万股) */
  shares: number;
  /** 持仓市值 (万元) */
  marketValue: number;
  /** 季度 */
  quarter: string;
}

/** 债券持仓信息接口 */
export interface BondHolding {
  /** 债券代码 */
  bondCode: string;
  /** 债券名称 */
  bondName: string;
  /** 占净值比例 */
  netValueRatio: number;
  /** 持仓市值 (万元) */
  marketValue: number;
  /** 季度 */
  quarter: string;
}

/** 行业配置信息接口 */
export interface IndustryAllocation {
  /** 行业类别 */
  industry: string;
  /** 占净值比例 */
  netValueRatio: number;
  /** 市值 (万元) */
  marketValue: number;
  /** 截止时间 */
  date: string;
}

/** 基金持仓信息接口 */
export interface FundPortfolio {
  /** 股票持仓 */
  stockHoldings: StockHolding[];
  /** 债券持仓 */
  bondHoldings: BondHolding[];
  /** 行业配置 */
  industryAllocation: IndustryAllocation[];
}

/** 基金公告信息接口 */
export interface FundAnnouncement {
  /** 基金代码 */
  fundCode: string;
  /** 公告标题 */
  title: string;
  /** 基金名称 */
  fundName: string;
  /** 公告日期 */
  publishDate: string;
  /** 报告 ID */
  reportId: string;
}

/** 基金评级信息接口 */
export interface FundRating {
  /** 基金代码 */
  fundCode: string;
  /** 基金名称 */
  fundName: string;
  /** 基金经理 */
  fundManager: string;
  /** 基金公司 */
  fundCompany: string;
  /** 5 星评级家数 */
  fiveStarCount: number;
  /** 上海证券评级 */
  shanghaiRating: number;
  /** 招商证券评级 */
  zheshangRating: number;
  /** 济安金信评级 */
  jianRating: number;
  /** 手续费 */
  fee: number;
  /** 类型 */
  type: string;
}

/** 基金经理信息接口 */
export interface FundManagerInfo {
  /** 姓名 */
  name: string;
  /** 所属公司 */
  company: string;
  /** 现任基金代码 */
  fundCode: string;
  /** 现任基金 */
  fundName: string;
  /** 累计从业时间 (天) */
  workDays: number;
  /** 现任基金资产总规模 (亿元) */
  totalScale: number;
  /** 现任基金最佳回报 (%) */
  bestReturn: number;
}
