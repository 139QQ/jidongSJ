/**
 * 基金净值历史Hook
 * @module hooks/useNavHistory
 * @description 获取和展示基金净值历史数据
 * 
 * @example
 * ```typescript
 * function NavChart({ fundCode }: { fundCode: string }) {
 *   const { history, loading, returns } = useNavHistory(fundCode, '单位净值走势');
 *   
 *   return (
 *     <div>
 *       {loading ? '加载中...' : <Chart data={history} />}
 *       <div>总收益率: {returns.totalReturn}%</div>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { FundNAV, MoneyFundNAV } from '@/types/fund';
import { navService } from '@/services/navService';

/** 收益率数据 */
interface ReturnsData {
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  volatility: number;
}

/** Hook返回类型 */
interface UseNavHistoryReturn {
  /** 净值历史 */
  history: FundNAV[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 收益率数据 */
  returns: ReturnsData;
  /** 刷新数据 */
  refresh: () => void;
}

/**
 * 基金净值历史Hook
 * @param {string} code - 基金代码
 * @param {string} indicator - 指标类型
 * @param {string} period - 时间段
 * @returns {UseNavHistoryReturn} 净值历史数据
 */
export function useNavHistory(
  code: string,
  indicator: '单位净值走势' | '累计净值走势' | '累计收益率走势' | '同类排名走势' | '同类排名百分比' = '单位净值走势',
  period: '1月' | '3月' | '6月' | '1年' | '3年' | '5年' | '今年来' | '成立来' = '成立来'
): UseNavHistoryReturn {
  const [history, setHistory] = useState<FundNAV[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnsData>({
    totalReturn: 0,
    annualizedReturn: 0,
    maxDrawdown: 0,
    volatility: 0
  });

  const fetchHistory = useCallback(async () => {
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const data = await navService.getNavHistory(code, indicator, period);
      setHistory(data);

      // 计算收益率
      const returnsData = navService.calculateReturns(data);
      setReturns(returnsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取净值历史失败');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [code, indicator, period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    returns,
    refresh: fetchHistory
  };
}

/** 货币基金收益Hook返回类型 */
interface UseMoneyFundHistoryReturn {
  /** 收益历史 */
  history: MoneyFundNAV[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => void;
}

/**
 * 货币基金收益历史Hook
 * @param {string} code - 基金代码
 * @returns {UseMoneyFundHistoryReturn} 收益历史数据
 */
export function useMoneyFundHistory(code: string): UseMoneyFundHistoryReturn {
  const [history, setHistory] = useState<MoneyFundNAV[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      const data = await navService.getMoneyFundHistory(code);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取货币基金历史失败');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refresh: fetchHistory
  };
}
