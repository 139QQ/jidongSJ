/**
 * 基金排行Hook
 * @module hooks/useFundRank
 * @description 获取基金排行数据
 */

import { useState, useEffect, useCallback } from 'react';
import type { FundRank, FundEstimate } from '@/types/fund';
import { fundService } from '@/services/fundService';

/** 排行Hook返回类型 */
interface UseFundRankReturn {
  /** 排行数据 */
  ranks: FundRank[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
}

/**
 * 基金排行Hook
 * @param {string} symbol - 基金类型
 * @param {number} limit - 限制返回条数，默认500条
 * @returns {UseFundRankReturn} 排行数据
 */
export function useFundRank(symbol: string = '全部', limit: number = 500): UseFundRankReturn {
  const [ranks, setRanks] = useState<FundRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fundService.getFundRank(symbol, limit);
      setRanks(data);
    } catch (err: any) {
      console.error('获取基金排行失败:', err);
      
      let errorMsg = '获取基金排行失败';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = '请求超时，AKTools服务器响应较慢，请稍后重试';
      } else if (err.message?.includes('Network Error')) {
        errorMsg = '网络错误，请检查网络连接';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setRanks([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, limit]);

  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  return {
    ranks,
    loading,
    error,
    refresh: fetchRanks
  };
}

/** 估算净值Hook返回类型 */
interface UseFundEstimateReturn {
  /** 估算数据 */
  estimates: FundEstimate[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
}

/**
 * 基金估算净值Hook
 * @param {string} symbol - 基金类型
 * @returns {UseFundEstimateReturn} 估算数据
 */
export function useFundEstimate(symbol: string = '全部'): UseFundEstimateReturn {
  const [estimates, setEstimates] = useState<FundEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fundService.getFundEstimate(symbol);
      setEstimates(data);
    } catch (err: any) {
      console.error('获取基金估算失败:', err);
      
      let errorMsg = '获取基金估算失败';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = '请求超时，请稍后重试';
      } else if (err.message?.includes('Network Error')) {
        errorMsg = '网络错误，请检查网络连接';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  return {
    estimates,
    loading,
    error,
    refresh: fetchEstimates
  };
}
