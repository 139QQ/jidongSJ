/**
 * 基金数据服务模块
 * @module services/fundService
 * @description 封装 AKTools API 的基金数据获取功能
 */

import type { 
  FundRealtime, 
  FundRank, 
  FundEstimate
} from '@/types/fund';
import { apiClient } from './apiClient';
import { serviceCache, rankingCache, realtimeCache } from './cacheAdapter';

/**
 * API 原始数据项类型
 */
interface ApiFundItem {
  [key: string]: string | number | undefined;
  '基金代码'?: string;
  '基金简称'?: string;
  '基金名称'?: string;
  '日增长值'?: string;
  '日增长率'?: string;
  '申购状态'?: string;
  '赎回状态'?: string;
  '手续费'?: string;
  '单位净值'?: string;
  '累计净值'?: string;
  '日期'?: string;
  '近 1 周'?: string;
  '近 1 月'?: string;
  '近 3 月'?: string;
  '近 6 月'?: string;
  '近 1 年'?: string;
  '近 2 年'?: string;
  '近 3 年'?: string;
  '今年来'?: string;
  '成立来'?: string;
  '估算偏差'?: string;
}

/**
 * 基金数据服务类
 * @class FundService
 * @description 提供基金数据的获取、搜索、排行等功能
 */
export class FundService {
  /**
   * 判断当前是否在交易时间内
   * A 股交易时间：工作日 9:30-11:30, 13:00-15:00
   */
  private isTradingTime(): boolean {
    const now = new Date();
    const day = now.getDay();
    
    // 周末休市
    if (day === 0 || day === 6) {
      return false;
    }
    
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 60 + minute;
    
    // 9:30-11:30 (570-690) 或 13:00-15:00 (780-900)
    return (time >= 570 && time <= 690) || (time >= 780 && time <= 900);
  }

  /**
   * 获取开放式基金实时数据列表
   * 
   * 缓存策略：
   * - 非交易时间：缓存 24 小时（基金列表变化不频繁）
   * - 交易时间：缓存 30 分钟
   * - 支持强制刷新
   * 
   * @param forceRefresh 是否强制刷新缓存
   * @returns 基金列表
   */
  async getOpenFundList(forceRefresh = false): Promise<FundRealtime[]> {
    const cacheKey = 'fund_open_fund_daily_em';
    const isTrading = this.isTradingTime();
    
    // 根据交易时间动态设置缓存 TTL
    const cacheTTL = isTrading ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    // 非强制刷新时检查缓存
    if (!forceRefresh) {
      const cached = serviceCache.get<FundRealtime[]>(cacheKey);
      if (cached) {
        console.log(`[FundService] 从缓存获取基金列表（${isTrading ? '交易时间' : '非交易时间'}）`);
        return cached;
      }
    }
    
    try {
      console.log(`[FundService] 从 API 获取基金列表...（${isTrading ? '交易时间' : '非交易时间'}）`);
      const startTime = Date.now();
      const data = await apiClient.get<ApiFundItem[]>('fund_open_fund_daily_em');
      
      if (!Array.isArray(data)) {
        console.warn('获取开放式基金列表返回格式异常');
        return [];
      }

      const funds = data.map((item) => {
        const getField = (suffix: string): string => {
          const key = Object.keys(item).find(k => k.includes(suffix));
          return key ? String(item[key] ?? '') : '';
        };
        
        return {
          code: item['基金代码'] || '',
          name: item['基金简称'] || '',
          unitNav: parseFloat(getField('-单位净值')) || 0,
          cumulativeNav: parseFloat(getField('-累计净值')) || 0,
          prevUnitNav: 0,
          prevCumulativeNav: 0,
          dailyGrowthValue: parseFloat(item['日增长值'] ?? '0') || 0,
          dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || 0,
          purchaseStatus: item['申购状态'] || '',
          redeemStatus: item['赎回状态'] || '',
          fee: item['手续费'] || ''
        };
      });
      
      // 动态缓存时间
      serviceCache.set(cacheKey, funds, cacheTTL);
      const duration = Date.now() - startTime;
      console.log(`[FundService] 成功获取 ${funds.length} 只基金，耗时 ${duration}ms，缓存 ${cacheTTL / 60000} 分钟`);
      return funds;
    } catch (error) {
      console.error('获取开放式基金列表失败:', error);
      // 出错时尝试返回过期缓存
      const staleCache = serviceCache.get<FundRealtime[]>(cacheKey);
      if (staleCache) {
        console.log('[FundService] 返回过期缓存数据');
        return staleCache;
      }
      throw error;
    }
  }

  /**
   * 搜索基金
   */
  async searchFunds(keyword: string): Promise<FundRealtime[]> {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const allFunds = await this.getOpenFundList();
    if (allFunds.length === 0) return [];

    const lowerKeyword = keyword.toLowerCase().trim();
    
    const exactCodeMatch = allFunds.filter(fund => 
      fund.code.toLowerCase() === lowerKeyword
    );
    
    if (exactCodeMatch.length > 0) return exactCodeMatch;

    return allFunds.filter(fund => 
      fund.code.toLowerCase().includes(lowerKeyword) ||
      fund.name.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 获取货币基金列表
   */
  async getMoneyFundList(): Promise<unknown[]> {
    return serviceCache.getOrSet('fund_money_fund_daily_em', async () => {
      const data = await apiClient.get<unknown[]>('fund_money_fund_daily_em');
      return Array.isArray(data) ? data : [];
    }, 10 * 60 * 1000);
  }

  /**
   * 获取 ETF 基金列表
   */
  async getETFFundList(): Promise<unknown[]> {
    return serviceCache.getOrSet('fund_etf_fund_daily_em', async () => {
      const data = await apiClient.get<unknown[]>('fund_etf_fund_daily_em');
      return Array.isArray(data) ? data : [];
    }, 10 * 60 * 1000);
  }

  /**
   * 获取 LOF 基金列表
   */
  async getLOFFundList(): Promise<unknown[]> {
    const cacheKey = 'fund_lof_spot_em';
    
    const cached = serviceCache.get<unknown[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const data = await apiClient.get<unknown[]>('fund_lof_spot_em');
      const result = Array.isArray(data) ? data : [];
      serviceCache.set(cacheKey, result, 10 * 60 * 1000);
      return result;
    } catch (error) {
      console.warn('[FundService] LOF 基金接口暂时不可用:', error);
      return [];
    }
  }

  /**
   * 获取基金排行数据
   * 
   * 缓存策略：
   * - 非交易时间：缓存 2 小时
   * - 交易时间：缓存 10 分钟
   * 
   * @param symbol 基金类型
   * @param limit 数量限制
   * @returns 基金排行列表
   */
  async getFundRank(symbol = '全部', limit = 500): Promise<FundRank[]> {
    const cacheKey = rankingCache.generateKey('fund_open_fund_rank_em', { symbol });
    const isTrading = this.isTradingTime();
    const cacheTTL = isTrading ? 10 * 60 * 1000 : 2 * 60 * 60 * 1000;
    
    const cached = rankingCache.get<FundRank[]>(cacheKey);
    if (cached) {
      console.log(`[FundService] 从缓存获取排行：${symbol}（${isTrading ? '交易时间' : '非交易时间'}）`);
      return cached;
    }
    
    try {
      console.log(`[FundService] 从 API 获取排行：${symbol}（${isTrading ? '交易时间' : '非交易时间'}）`);
      const startTime = Date.now();
      
      const data = await apiClient.get<ApiFundItem[]>('fund_open_fund_rank_em', { symbol });

      console.log(`[FundService] API 请求耗时：${Date.now() - startTime}ms`);
      
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('[FundService] 获取基金排行返回格式异常或为空');
        return [];
      }

      const limitedData = data.slice(0, limit);
      
      const ranks: FundRank[] = limitedData.map((item, index) => ({
        rank: index + 1,
        code: item['基金代码'] || '',
        name: item['基金简称'] || item['基金名称'] || '',
        unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
        cumulativeNav: parseFloat(item['累计净值'] ?? '0') || 0,
        date: item['日期'] || '',
        dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || 0,
        week1: parseFloat(item['近 1 周'] ?? '0') || 0,
        month1: parseFloat(item['近 1 月'] ?? '0') || 0,
        month3: parseFloat(item['近 3 月'] ?? '0') || 0,
        month6: parseFloat(item['近 6 月'] ?? '0') || 0,
        year1: parseFloat(item['近 1 年'] ?? '0') || 0,
        year2: parseFloat(item['近 2 年'] ?? '0') || 0,
        year3: parseFloat(item['近 3 年'] ?? '0') || 0,
        thisYear: parseFloat(item['今年来'] ?? '0') || 0,
        sinceEstablish: parseFloat(item['成立来'] ?? '0') || 0,
        fee: String(item['手续费'] ?? '')
      }));

      console.log(`[FundService] 排行数据映射完成，示例数据:`, ranks[0]);
      
      rankingCache.set(cacheKey, ranks, cacheTTL);
      console.log(`[FundService] 成功获取 ${ranks.length} 条排行数据，缓存 ${cacheTTL / 60000} 分钟`);
      return ranks;
    } catch (error) {
      console.error('[FundService] 获取基金排行失败:', error);
      throw error;
    }
  }

  /**
   * 获取基金排行数据（分页版本）
   */
  async getFundRankPaged(
    symbol = '全部',
    page = 1,
    pageSize = 50
  ): Promise<{ data: FundRank[]; total: number; hasMore: boolean }> {
    const allData = await this.getFundRank(symbol);
    
    const total = allData.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return { 
      data: allData.slice(startIndex, endIndex), 
      total, 
      hasMore: endIndex < total 
    };
  }

  /**
   * 获取基金估算净值
   * 
   * 缓存策略：
   * - 非交易时间：缓存 30 分钟
   * - 交易时间：缓存 1 分钟（实时性要求高）
   * 
   * @param symbol 基金类型
   * @returns 基金估算净值列表
   */
  async getFundEstimate(symbol = '全部'): Promise<FundEstimate[]> {
    const cacheKey = realtimeCache.generateKey('fund_value_estimation_em', { symbol });
    const isTrading = this.isTradingTime();
    const cacheTTL = isTrading ? 1 * 60 * 1000 : 30 * 60 * 1000;
    
    const cached = realtimeCache.get<FundEstimate[]>(cacheKey);
    if (cached) {
      console.log(`[FundService] 从缓存获取估算净值（${isTrading ? '交易时间' : '非交易时间'}）`);
      return cached;
    }
    
    try {
      const data = await apiClient.get<ApiFundItem[]>('fund_value_estimation_em', { symbol });

      if (!Array.isArray(data)) {
        console.warn('获取基金估算净值返回格式异常');
        return [];
      }

      const estimates: FundEstimate[] = data.map((item) => {
        const getField = (suffix: string): string => {
          const key = Object.keys(item).find(k => k.includes(suffix));
          return key ? String(item[key] ?? '') : '';
        };
        
        return {
          code: item['基金代码'] || '',
          name: item['基金名称'] || '',
          estimateNav: parseFloat(getField('估算数据 - 估算值')) || 0,
          estimateGrowthRate: getField('估算数据 - 估算增长率'),
          publishedNav: parseFloat(getField('公布数据 - 单位净值')) || 0,
          publishedGrowthRate: getField('公布数据 - 日增长率'),
          estimateDeviation: item['估算偏差'] || ''
        };
      });
      
      realtimeCache.set(cacheKey, estimates, cacheTTL);
      console.log(`[FundService] 成功获取估算净值，缓存 ${cacheTTL / 60000} 分钟`);
      return estimates;
    } catch (error) {
      console.error('获取基金估算净值失败:', error);
      throw error;
    }
  }

  /**
   * 获取基金基本信息
   */
  async getFundOverview(code: string): Promise<unknown> {
    return serviceCache.getOrSet(
      serviceCache.generateKey('fund_overview_em', { code }),
      async () => apiClient.get('fund_overview_em', { symbol: code }),
      60 * 60 * 1000
    );
  }

  /**
   * 获取香港基金排行
   */
  async getHKFundRank(): Promise<unknown[]> {
    return serviceCache.getOrSet('fund_hk_rank_em', async () => {
      const data = await apiClient.get<unknown[]>('fund_hk_rank_em');
      return Array.isArray(data) ? data : [];
    }, 30 * 60 * 1000);
  }

  /**
   * 获取基金规模变动数据
   */
  async getFundScaleChange(): Promise<unknown[]> {
    return serviceCache.getOrSet('fund_scale_change_em', async () => {
      const data = await apiClient.get<unknown[]>('fund_scale_change_em');
      return Array.isArray(data) ? data : [];
    }, 60 * 60 * 1000);
  }

  /**
   * 获取缓存状态信息
   * @returns 各数据源的缓存状态
   */
  getCacheStatus(): {
    funds: { key: string; cached: boolean };
    ranks: { key: string; cached: boolean };
    estimates: { key: string; cached: boolean };
  } {
    return {
      funds: {
        key: 'fund_open_fund_daily_em',
        cached: serviceCache.has('fund_open_fund_daily_em')
      },
      ranks: {
        key: 'fund_open_fund_rank_em?symbol=全部',
        cached: rankingCache.has('fund_open_fund_rank_em?symbol=全部')
      },
      estimates: {
        key: 'fund_value_estimation_em?symbol=全部',
        cached: realtimeCache.has('fund_value_estimation_em?symbol=全部')
      }
    };
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    serviceCache.delete('fund_open_fund_daily_em');
    serviceCache.delete('fund_money_fund_daily_em');
    serviceCache.delete('fund_etf_fund_daily_em');
    serviceCache.delete('fund_lof_spot_em');
    rankingCache.delete('fund_open_fund_rank_em?symbol=全部');
    realtimeCache.delete('fund_value_estimation_em?symbol=全部');
    console.log('[FundService] 缓存已清除');
  }
}

// 单例实例
export const fundService = new FundService();

// 便捷函数
export const getOpenFundList = () => fundService.getOpenFundList();
export const searchFunds = (keyword: string) => fundService.searchFunds(keyword);
export const getFundRank = (symbol = '全部') => fundService.getFundRank(symbol);
export const getFundEstimate = (symbol = '全部') => fundService.getFundEstimate(symbol);
