/**
 * 基金净值历史 Hook
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
 *       <div>总收益率：{returns.totalReturn}%</div>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FundNAV, MoneyFundNAV } from '@/types/fund';
import { navService, type NavPeriod, type NavIndicator } from '@/services/navService';

/** 收益率数据 */
interface ReturnsData {
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  volatility: number;
}

/** Hook 返回类型 */
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

// 全局缓存，跨组件共享数据
const cache = new Map<string, { data: FundNAV[]; returns: ReturnsData; timestamp: number }>();
// 请求去重 Map，存储进行中的 Promise
const pendingRequests = new Map<string, Promise<{ data: FundNAV[]; returns: ReturnsData }>>();
// 缓存有效期 5 分钟
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 基金净值历史 Hook
 * @param {string} code - 基金代码
 * @param {string} indicator - 指标类型
 * @param {string} period - 时间段
 * @returns {UseNavHistoryReturn} 净值历史数据
 */
export function useNavHistory(
  code: string,
  indicator: NavIndicator = '单位净值走势',
  period: NavPeriod = '成立来'
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
  
  // 使用 ref 跟踪是否已加载过，避免重复请求
  const hasLoadedRef = useRef(false);
  // 使用 ref 存储当前 cache key，用于检测参数变化
  const prevCacheKeyRef = useRef<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!code) return;

    const cacheKey = `${code}-${indicator}-${period}`;
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setHistory(cached.data);
      setReturns(cached.returns);
      setError(null);
      return;
    }

    // 检查是否有进行中的请求，有则等待该请求完成
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
      try {
        setLoading(true);
        const result = await pendingRequest;
        setHistory(result.data);
        setReturns(result.returns);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取净值历史失败');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 发起新请求
    setLoading(true);
    setError(null);

    const requestPromise = (async () => {
      try {
        const data = await navService.getNavHistory(code, indicator, period);
        const returnsData = navService.calculateReturns(data);
        
        // 更新缓存
        cache.set(cacheKey, {
          data,
          returns: returnsData,
          timestamp: Date.now()
        });
        
        return { data, returns: returnsData };
      } catch (err) {
        throw err;
      } finally {
        // 清理进行中的请求
        pendingRequests.delete(cacheKey);
      }
    })();

    // 存储请求到去重 Map
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      setHistory(result.data);
      setReturns(result.returns);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取净值历史失败');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [code, indicator, period]);

  useEffect(() => {
    const cacheKey = `${code}-${indicator}-${period}`;
    
    // 如果参数变化了，重置已加载标记
    if (prevCacheKeyRef.current !== cacheKey) {
      hasLoadedRef.current = false;
      prevCacheKeyRef.current = cacheKey;
    }
    
    // 只在未加载过或参数变化时获取数据
    if (!hasLoadedRef.current || prevCacheKeyRef.current !== cacheKey) {
      fetchHistory();
      hasLoadedRef.current = true;
    }
  }, [fetchHistory, code, indicator, period]);

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
