/**
 * 数据加载服务模块
 * @module services/dataLoader
 * @description 提供并发数据加载和预加载功能
 */

import { fundService } from './fundService';
import { cache } from './cache';
import { persistentCache } from './persistentCache';
import type { FundRealtime, FundRank, FundEstimate } from '@/types/fund';

/** 加载进度回调 */
export type ProgressCallback = (progress: number, message: string) => void;

/** 数据加载器类 */
export class DataLoader {
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * 并行加载多个数据源
   * @param {ProgressCallback} [onProgress] - 进度回调
   * @returns {Promise<{funds: FundRealtime[], ranks: FundRank[], estimates: FundEstimate[]}>}
   */
  async loadAllData(
    onProgress?: ProgressCallback
  ): Promise<{
    funds: FundRealtime[];
    ranks: FundRank[];
    estimates: FundEstimate[];
  }> {
    const startTime = Date.now();
    
    // 创建AbortController用于取消请求
    const controller = new AbortController();
    this.abortControllers.set('all', controller);

    try {
      onProgress?.(10, '正在检查缓存...');
      
      // 先检查缓存状态
      const cacheStatus = this.checkCache();
      if (cacheStatus.funds && cacheStatus.ranks) {
        onProgress?.(50, '从缓存加载数据...');
      }
      
      // 并行加载所有数据，使用Promise.allSettled避免一个失败影响全部
      const [fundsResult, ranksResult, estimatesResult] = await Promise.allSettled([
        this.loadWithTimeout(
          () => fundService.getOpenFundList(),
          180000,
          '基金列表'
        ),
        this.loadWithTimeout(
          () => fundService.getFundRank('全部', 500),
          60000,
          '基金排行'
        ),
        this.loadWithTimeout(
          () => fundService.getFundEstimate('全部'),
          180000,
          '净值估算'
        )
      ]);

      // 处理结果
      const funds = fundsResult.status === 'fulfilled' ? fundsResult.value : [];
      const ranks = ranksResult.status === 'fulfilled' ? ranksResult.value : [];
      const estimates = estimatesResult.status === 'fulfilled' ? estimatesResult.value : [];

      // 检查是否有失败
      const failures: string[] = [];
      if (fundsResult.status === 'rejected') {
        failures.push('基金列表');
        console.error('[DataLoader] 基金列表加载失败:', fundsResult.reason);
      }
      if (ranksResult.status === 'rejected') {
        failures.push('基金排行');
        console.error('[DataLoader] 基金排行加载失败:', ranksResult.reason);
      }
      if (estimatesResult.status === 'rejected') {
        failures.push('净值估算');
        console.error('[DataLoader] 净值估算加载失败:', estimatesResult.reason);
      }

      const duration = Date.now() - startTime;
      
      if (failures.length > 0) {
        onProgress?.(100, `部分加载完成，${failures.join('、')}加载失败`);
        console.warn(`[DataLoader] 部分数据加载失败: ${failures.join(', ')}`);
      } else {
        onProgress?.(100, `加载完成，耗时 ${(duration / 1000).toFixed(1)} 秒`);
      }

      return { funds, ranks, estimates };
    } catch (error) {
      onProgress?.(0, '加载失败');
      throw error;
    } finally {
      this.abortControllers.delete('all');
    }
  }

  /**
   * 带超时的数据加载
   * @template T 数据类型
   * @param {() => Promise<T>} fetcher - 数据获取函数
   * @param {number} timeout - 超时时间（毫秒）
   * @param {string} name - 数据名称（用于日志）
   * @returns {Promise<T>} 数据
   */
  private async loadWithTimeout<T>(
    fetcher: () => Promise<T>,
    timeout: number,
    name: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      console.log(`[DataLoader] 开始加载 ${name}`);
      const result = await Promise.race([
        fetcher(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`${name} 加载超时`)), timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`[DataLoader] ${name} 加载完成，耗时 ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[DataLoader] ${name} 加载失败，耗时 ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * 分片加载大数据集
   * @template T 数据类型
   * @param {() => Promise<T[]>} fetcher - 数据获取函数
   * @param {number} chunkSize - 每片大小
   * @param {ProgressCallback} [onProgress] - 进度回调
   * @returns {Promise<T[]>} 完整数据
   */
  async loadInChunks<T>(
    fetcher: () => Promise<T[]>,
    chunkSize: number = 100,
    onProgress?: ProgressCallback
  ): Promise<T[]> {
    const data = await fetcher();
    const total = data.length;
    const chunks: T[][] = [];
    
    for (let i = 0; i < total; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    const result: T[] = [];
    for (let i = 0; i < chunks.length; i++) {
      result.push(...chunks[i]);
      const progress = Math.round(((i + 1) / chunks.length) * 100);
      onProgress?.(progress, `已加载 ${result.length}/${total} 条数据`);
      
      // 让出主线程，避免阻塞UI
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return result;
  }

  /**
   * 预加载常用数据
   * @returns {Promise<void>}
   */
  async preload(): Promise<void> {
    console.log('[DataLoader] 开始预加载数据...');
    
    try {
      // 并行预加载基金列表和排行（限制500条避免加载过慢）
      await Promise.all([
        fundService.getOpenFundList().catch(() => []),
        fundService.getFundRank('全部', 500).catch(() => []),
        fundService.getFundEstimate('全部').catch(() => [])
      ]);
      
      console.log('[DataLoader] 预加载完成');
    } catch (error) {
      console.error('[DataLoader] 预加载失败:', error);
    }
  }

  /**
   * 取消所有加载
   */
  cancelAll(): void {
    for (const [key, controller] of this.abortControllers) {
      controller.abort();
      console.log(`[DataLoader] 取消加载: ${key}`);
    }
    this.abortControllers.clear();
  }

  /**
   * 检查数据是否已缓存（包括持久化缓存）
   * @returns {{funds: boolean, ranks: boolean, estimates: boolean}}
   */
  checkCache(): { funds: boolean; ranks: boolean; estimates: boolean } {
    const fundsKey = 'fund_open_fund_daily_em';
    // 使用正确的接口名称 fund_open_fund_rank_em 而不是 fund_info_index_em
    const ranksKey = 'fund_open_fund_rank_em?symbol=全部';
    const estimatesKey = 'fund_value_estimation_em?symbol=全部';
    
    return {
      funds: cache.has(fundsKey) || persistentCache.has(fundsKey),
      ranks: cache.has(ranksKey) || persistentCache.has(ranksKey),
      estimates: cache.has(estimatesKey) // 估算数据不使用持久化缓存
    };
  }

  /**
   * 获取缓存统计
   * @returns {{total: number, keys: string[]}}
   */
  getCacheStats(): { total: number; keys: string[] } {
    // 由于cache是Map，我们无法直接获取所有键
    // 这里返回常用缓存键的状态
    const keys = [
      'fund_open_fund_daily_em',
      'fund_info_index_em?symbol=全部',
      'fund_value_estimation_em?symbol=全部'
    ];
    
    return {
      total: keys.filter(k => cache.has(k)).length,
      keys
    };
  }
}

/**
 * 全局数据加载器实例
 */
export const dataLoader = new DataLoader();

/**
 * 便捷函数：并行加载所有数据
 */
export function loadAllData(
  onProgress?: ProgressCallback
): Promise<{
  funds: FundRealtime[];
  ranks: FundRank[];
  estimates: FundEstimate[];
}> {
  return dataLoader.loadAllData(onProgress);
}

/**
 * 便捷函数：预加载数据
 */
export function preloadData(): Promise<void> {
  return dataLoader.preload();
}
