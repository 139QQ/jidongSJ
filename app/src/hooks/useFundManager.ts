/**
 * 基金管理Hook
 * @module hooks/useFundManager
 * @description 提供React组件中管理基金的功能
 * 
 * @example
 * ```typescript
 * function FundList() {
 *   const { funds, loading, addFund, deleteFund } = useFundManager();
 *   
 *   return (
 *     <div>
 *       {funds.map(fund => (
 *         <div key={fund.code}>{fund.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * 优化说明：
 * 1. 使用细粒度状态更新，避免不必要的重渲染
 * 2. 使用函数式更新代替重新加载
 * 3. 使用 useMemo 缓存计算结果
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { UserFund, FundRealtime } from '@/types/fund';
import type { FundQueryOptions, FundUpdateData } from '@/types/fund';
import { FundManager, fundManager } from '@/services/fundManager';
import { fundService } from '@/services/fundService';

/** Hook返回类型 */
interface UseFundManagerReturn {
  /** 基金列表 */
  funds: UserFund[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 添加基金 */
  addFund: (code: string, remark?: string, holdShares?: number, costPrice?: number) => Promise<boolean>;
  /** 删除基金 */
  deleteFund: (code: string) => boolean;
  /** 更新基金 */
  updateFund: (code: string, data: FundUpdateData) => boolean;
  /** 刷新净值 */
  refreshNav: (code?: string) => Promise<boolean>;
  /** 搜索基金 */
  searchFunds: (keyword: string) => Promise<FundRealtime[]>;
  /** 查询基金 */
  queryFunds: (options: FundQueryOptions) => UserFund[];
  /** 重新加载 */
  reload: () => void;
  /** 总资产数据 */
  assets: {
    totalCost: number;
    totalValue: number;
    totalProfit: number;
    totalProfitRate: number;
  };
}

/**
 * 基金管理Hook
 * @returns {UseFundManagerReturn} 基金管理功能
 */
export function useFundManager(): UseFundManagerReturn {
  const [funds, setFunds] = useState<UserFund[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const managerRef = useRef<FundManager>(fundManager);

  // 加载基金列表 - 优化版本（使用函数式更新）
  const loadFunds = useCallback(() => {
    try {
      const allFunds = managerRef.current.getAllFunds();
      // 只在数据实际变化时更新
      setFunds(prev => {
        const prevIds = new Set(prev.map(f => f.code));
        const currIds = new Set(allFunds.map(f => f.code));
        // 如果基金列表有变化才更新
        if (prevIds.size !== currIds.size || !allFunds.every(f => prevIds.has(f.code))) {
          return allFunds;
        }
        // 否则只更新净值等变化的数据
        return allFunds.map(newFund => {
          const oldFund = prev.find(f => f.code === newFund.code);
          if (!oldFund) return newFund;
          // 如果净值有变化才更新
          if (JSON.stringify(oldFund.latestNav) !== JSON.stringify(newFund.latestNav)) {
            return newFund;
          }
          return oldFund;
        });
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载基金失败');
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

  // 添加基金 - 优化版本（直接添加，避免全量重载）
  const addFund = useCallback(async (
    code: string,
    remark?: string,
    holdShares?: number,
    costPrice?: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const fund = await managerRef.current.addFund(code, remark, holdShares, costPrice);
      if (fund) {
        // 直接添加到状态，避免全量重载
        setFunds(prev => [...prev, fund]);
        return true;
      }
      setError('添加基金失败，可能基金不存在或已添加');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加基金失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除基金 - 优化版本（直接删除，避免全量重载）
  const deleteFund = useCallback((code: string): boolean => {
    try {
      const result = managerRef.current.deleteFund(code);
      if (result) {
        // 直接从状态删除，避免全量重载
        setFunds(prev => prev.filter(f => f.code !== code));
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除基金失败');
      return false;
    }
  }, []);

  // 更新基金 - 优化版本（直接更新，避免全量重载）
  const updateFund = useCallback((code: string, data: FundUpdateData): boolean => {
    try {
      const result = managerRef.current.updateFund(code, data);
      if (result) {
        // 直接从状态更新，避免全量重载
        setFunds(prev => prev.map(f => 
          f.code === code ? { ...f, ...data, lastUpdated: new Date().toISOString() } : f
        ));
      }
      return !!result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新基金失败');
      return false;
    }
  }, []);

  // 刷新净值
  const refreshNav = useCallback(async (code?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (code) {
        const result = await managerRef.current.refreshFundNav(code);
        if (result) {
          loadFunds();
          return true;
        }
        return false;
      } else {
        const count = await managerRef.current.refreshAllNavs();
        loadFunds();
        return count > 0;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新净值失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadFunds]);

  // 搜索基金
  const searchFunds = useCallback(async (keyword: string): Promise<FundRealtime[]> => {
    setLoading(true);
    try {
      const results = await fundService.searchFunds(keyword);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索基金失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 查询基金
  const queryFunds = useCallback((options: FundQueryOptions): UserFund[] => {
    return managerRef.current.queryFunds(options);
  }, []);

  // 重新加载
  const reload = useCallback(() => {
    loadFunds();
  }, [loadFunds]);

  // 使用 useMemo 缓存资产计算
  const calculatedAssets = useMemo(() => {
    return managerRef.current.calculateTotalAssets();
  }, [funds]);

  return {
    funds,
    loading,
    error,
    addFund,
    deleteFund,
    updateFund,
    refreshNav,
    searchFunds,
    queryFunds,
    reload,
    assets: calculatedAssets
  };
}
