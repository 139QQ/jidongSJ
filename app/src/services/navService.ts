/**
 * 基金净值数据服务模块
 * @module services/navService
 * @description 提供基金历史净值、净值走势等数据的获取功能
 */

import type { FundNAV, MoneyFundNAV } from '@/types/fund';
import { apiClient } from './apiClient';
import { historyCache } from './cacheAdapter';

/** API 响应数据项 */
interface ApiNavItem {
  [key: string]: string | number | undefined;
  '净值日期'?: string;
  '单位净值'?: string;
  '累计净值'?: string;
  '日增长率'?: string;
  '日增长值'?: string;
  '申购状态'?: string;
  '赎回状态'?: string;
  '每万份收益'?: string;
  '7 日年化收益率'?: string;
}

/** 指标类型 */
export type NavIndicator = '单位净值走势' | '累计净值走势' | '累计收益率走势' | '同类排名走势' | '同类排名百分比';

/** 时间周期 */
export type NavPeriod = '1 月' | '1 月' | '3 月' | '6 月' | '1 年' | '3 年' | '5 年' | '今年来' | '成立来';

/** 收益率计算结果 */
export interface ReturnCalculation {
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  volatility: number;
}

/**
 * 基金净值服务类
 */
export class NavService {
  /**
   * 获取开放式基金历史净值
   */
  async getNavHistory(
    code: string,
    indicator: NavIndicator = '单位净值走势',
    period: NavPeriod = '成立来'
  ): Promise<FundNAV[]> {
    const cacheKey = historyCache.generateKey('fund_open_fund_info_em', { code, indicator, period });
    
    return historyCache.getOrSet(cacheKey, async () => {
      const data = await apiClient.get<ApiNavItem[]>('fund_open_fund_info_em', {
        symbol: code,
        indicator,
        period
      });

      if (!Array.isArray(data)) {
        console.warn(`获取基金${code}历史净值返回格式异常`);
        return [];
      }

      return data.map((item) => ({
        date: item['净值日期'] || '',
        unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
        cumulativeNav: parseFloat(item['累计净值'] ?? '0') || 0,
        dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || undefined,
        purchaseStatus: item['申购状态'],
        redeemStatus: item['赎回状态']
      }));
    }, 30 * 60 * 1000);
  }

  /**
   * 获取货币基金历史收益
   */
  async getMoneyFundHistory(code: string): Promise<MoneyFundNAV[]> {
    const cacheKey = historyCache.generateKey('fund_money_fund_info_em', { code });
    
    return historyCache.getOrSet(cacheKey, async () => {
      const data = await apiClient.get<ApiNavItem[]>('fund_money_fund_info_em', { symbol: code });

      if (!Array.isArray(data)) {
        console.warn(`获取货币基金${code}历史收益返回格式异常`);
        return [];
      }

      return data.map((item) => ({
        date: item['净值日期'] || '',
        tenThousandIncome: parseFloat(item['每万份收益'] ?? '0') || 0,
        sevenDayAnnualized: parseFloat(item['7 日年化收益率'] ?? '0') || 0,
        purchaseStatus: item['申购状态'],
        redeemStatus: item['赎回状态']
      }));
    }, 30 * 60 * 1000);
  }

  /**
   * 获取 ETF 基金历史净值
   */
  async getETFNavHistory(
    code: string,
    startDate = '20000101',
    endDate = '20500101'
  ): Promise<FundNAV[]> {
    const cacheKey = historyCache.generateKey('fund_etf_fund_info_em', { code, startDate, endDate });
    
    return historyCache.getOrSet(cacheKey, async () => {
      const data = await apiClient.get<ApiNavItem[]>('fund_etf_fund_info_em', {
        fund: code,
        start_date: startDate,
        end_date: endDate
      });

      if (!Array.isArray(data)) {
        console.warn(`获取 ETF 基金${code}历史净值返回格式异常`);
        return [];
      }

      return data.map((item) => ({
        date: item['净值日期'] || '',
        unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
        cumulativeNav: parseFloat(item['累计净值'] ?? '0') || 0,
        dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || undefined,
        purchaseStatus: item['申购状态'],
        redeemStatus: item['赎回状态']
      }));
    }, 30 * 60 * 1000);
  }

  /**
   * 获取分级基金历史净值（容错处理）
   */
  async getGradedFundHistory(code: string): Promise<FundNAV[]> {
    const cacheKey = historyCache.generateKey('fund_graded_fund_info_em', { code });
    
    const cached = historyCache.get<FundNAV[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const data = await apiClient.get<ApiNavItem[]>('fund_graded_fund_info_em', { symbol: code });

      if (!Array.isArray(data)) return [];

      const result = data.map((item) => ({
        date: item['净值日期'] || '',
        unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
        cumulativeNav: parseFloat(item['累计净值'] ?? '0') || 0,
        dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || undefined,
        purchaseStatus: item['申购状态'],
        redeemStatus: item['赎回状态']
      }));
      
      historyCache.set(cacheKey, result, 30 * 60 * 1000);
      return result;
    } catch (error) {
      console.warn(`[NavService] 分级基金接口暂时不可用:`, error);
      return [];
    }
  }

  /**
   * 获取香港基金历史净值
   */
  async getHKFundHistory(code: string): Promise<FundNAV[]> {
    const cacheKey = historyCache.generateKey('fund_hk_fund_hist_em', { code });
    
    return historyCache.getOrSet(cacheKey, async () => {
      const data = await apiClient.get<ApiNavItem[]>('fund_hk_fund_hist_em', {
        code,
        symbol: '历史净值明细'
      });

      if (!Array.isArray(data)) {
        console.warn(`获取香港基金${code}历史净值返回格式异常`);
        return [];
      }

      return data.map((item) => ({
        date: item['净值日期'] || '',
        unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
        cumulativeNav: 0,
        dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || undefined,
        dailyGrowthValue: parseFloat(item['日增长值'] ?? '0') || undefined
      }));
    }, 30 * 60 * 1000);
  }

  /**
   * 获取基金最新净值
   */
  async getLatestNav(code: string): Promise<FundNAV | null> {
    try {
      const history = await this.getNavHistory(code, '单位净值走势', '1 月');
      return history.length > 0 ? history[history.length - 1] : null;
    } catch (error) {
      console.error(`获取基金${code}最新净值失败:`, error);
      return null;
    }
  }

  /**
   * 批量获取基金历史净值
   */
  async batchGetNavHistory(
    codes: string[],
    indicator: NavIndicator = '单位净值走势'
  ): Promise<Record<string, FundNAV[]>> {
    const results: Record<string, FundNAV[]> = {};
    
    for (const code of codes) {
      try {
        results[code] = await this.getNavHistory(code, indicator);
      } catch (error) {
        console.error(`批量获取基金${code}历史净值失败:`, error);
        results[code] = [];
      }
    }
    
    return results;
  }

  /**
   * 计算基金收益率
   */
  calculateReturns(navHistory: FundNAV[]): ReturnCalculation {
    if (navHistory.length < 2) {
      return { totalReturn: 0, annualizedReturn: 0, maxDrawdown: 0, volatility: 0 };
    }

    const sorted = [...navHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const startNav = sorted[0].unitNav;
    const endNav = sorted[sorted.length - 1].unitNav;
    const totalReturn = ((endNav - startNav) / startNav) * 100;

    const days = Math.max(1, sorted.length);
    const years = days / 252;
    const annualizedReturn = years > 0 
      ? (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100 
      : 0;

    let maxDrawdown = 0;
    let peak = startNav;
    for (const nav of sorted) {
      if (nav.unitNav > peak) peak = nav.unitNav;
      const drawdown = ((peak - nav.unitNav) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const returns: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const dailyReturn = (sorted[i].unitNav - sorted[i - 1].unitNav) / sorted[i - 1].unitNav;
      returns.push(dailyReturn);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length || 0;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

    return { totalReturn, annualizedReturn, maxDrawdown, volatility };
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    console.log('[NavService] 缓存已清除');
  }
}

// 单例实例
export const navService = new NavService();

// 便捷函数
export const getNavHistory = (code: string, indicator?: NavIndicator, period?: NavPeriod) => 
  navService.getNavHistory(code, indicator, period);

export const getMoneyFundHistory = (code: string) => 
  navService.getMoneyFundHistory(code);

export const getLatestNav = (code: string) => 
  navService.getLatestNav(code);
