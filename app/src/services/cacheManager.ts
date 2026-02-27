/**
 * 缓存管理器模块
 * @module services/cacheManager
 * @description 统一的管理器，整合内存缓存和持久化缓存，提供多级缓存策略
 */

import { cache, type CacheStats } from './cache';
import { persistentCache } from './persistentCache';

/** 缓存层级 */
export type CacheLayer = 'memory' | 'persistent' | 'all';

/** 缓存策略 */
export interface CacheStrategy {
  /** 内存缓存TTL（毫秒） */
  memoryTTL: number;
  /** 持久化缓存TTL（毫秒） */
  persistentTTL: number;
  /** 是否异步持久化 */
  asyncPersistent: boolean;
  /** 是否压缩 */
  compress: boolean;
}

/** 默认缓存策略 */
export const defaultCacheStrategy: CacheStrategy = {
  memoryTTL: 5 * 60 * 1000,      // 5分钟
  persistentTTL: 30 * 60 * 1000,  // 30分钟
  asyncPersistent: true,
  compress: false
};

/** 缓存策略预设 */
export const CacheStrategies = {
  /** 实时数据 - 短缓存时间 */
  realtime: {
    memoryTTL: 60 * 1000,         // 1分钟
    persistentTTL: 5 * 60 * 1000, // 5分钟
    asyncPersistent: true,
    compress: false
  },
  /** 排行数据 - 中等缓存时间 */
  ranking: {
    memoryTTL: 10 * 60 * 1000,    // 10分钟
    persistentTTL: 60 * 60 * 1000, // 1小时
    asyncPersistent: true,
    compress: true
  },
  /** 基础数据 - 长缓存时间 */
  basic: {
    memoryTTL: 30 * 60 * 1000,     // 30分钟
    persistentTTL: 24 * 60 * 60 * 1000, // 24小时
    asyncPersistent: true,
    compress: true
  },
  /** 静态数据 - 超长缓存 */
  static: {
    memoryTTL: 60 * 60 * 1000,     // 1小时
    persistentTTL: 7 * 24 * 60 * 60 * 1000, // 7天
    asyncPersistent: true,
    compress: true
  }
} satisfies Record<string, CacheStrategy>;

/** 缓存条目信息 */
export interface CacheEntryInfo {
  key: string;
  inMemory: boolean;
  inPersistent: boolean;
  memoryExpiresAt?: number;
  persistentExpiresAt?: number;
}

/**
 * 缓存管理器类
 * @class CacheManager
 * @description 提供多级缓存管理和策略配置
 */
export class CacheManager {
  private static instance: CacheManager;
  private defaultStrategy: CacheStrategy = defaultCacheStrategy;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 设置默认策略
   */
  setDefaultStrategy(strategy: Partial<CacheStrategy>): void {
    this.defaultStrategy = { ...this.defaultStrategy, ...strategy };
  }

  /**
   * 获取缓存 - 多级缓存策略
   * 1. 先查内存缓存
   * 2. 再查持久化缓存
   * 3. 如果持久化有，同步到内存
   */
  get<T>(key: string): T | null {
    // 先查内存
    const memoryData = cache.get<T>(key);
    if (memoryData !== null) {
      return memoryData;
    }

    // 再查持久化
    const persistentData = persistentCache.get<T>(key);
    if (persistentData !== null) {
      // 同步到内存缓存（使用默认TTL）
      cache.set(key, persistentData, this.defaultStrategy.memoryTTL);
      return persistentData;
    }

    return null;
  }

  /**
   * 批量获取缓存
   */
  getBatch<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({
      key,
      data: this.get<T>(key)
    }));
  }

  /**
   * 设置缓存 - 多级写入
   */
  set<T>(
    key: string,
    data: T,
    strategy: Partial<CacheStrategy> = {}
  ): void {
    const finalStrategy = { ...this.defaultStrategy, ...strategy };

    // 写入内存缓存
    cache.set(key, data, finalStrategy.memoryTTL);

    // 写入持久化缓存
    if (finalStrategy.asyncPersistent) {
      // 异步写入，不阻塞主线程
      Promise.resolve().then(() => {
        persistentCache.set(key, data, finalStrategy.persistentTTL);
      });
    } else {
      persistentCache.set(key, data, finalStrategy.persistentTTL);
    }
  }

  /**
   * 批量设置缓存
   */
  setBatch<T>(
    entries: Array<{ key: string; data: T }>,
    strategy: Partial<CacheStrategy> = {}
  ): void {
    for (const { key, data } of entries) {
      this.set(key, data, strategy);
    }
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    strategy: Partial<CacheStrategy> = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, strategy);
    return data;
  }

  /**
   * 删除缓存
   */
  delete(key: string, layer: CacheLayer = 'all'): boolean {
    let deleted = false;

    if (layer === 'memory' || layer === 'all') {
      deleted = cache.delete(key) || deleted;
    }
    if (layer === 'persistent' || layer === 'all') {
      deleted = persistentCache.delete(key) || deleted;
    }

    return deleted;
  }

  /**
   * 批量删除
   */
  deleteBatch(keys: string[], layer: CacheLayer = 'all'): number {
    let count = 0;
    for (const key of keys) {
      if (this.delete(key, layer)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 清空缓存
   */
  clear(layer: CacheLayer = 'all'): void {
    if (layer === 'memory' || layer === 'all') {
      cache.clear();
    }
    if (layer === 'persistent' || layer === 'all') {
      persistentCache.clear();
    }
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string, layer: CacheLayer = 'all'): boolean {
    if (layer === 'memory') {
      return cache.has(key);
    }
    if (layer === 'persistent') {
      return persistentCache.has(key);
    }
    return cache.has(key) || persistentCache.has(key);
  }

  /**
   * 获取缓存信息
   */
  getInfo(key: string): CacheEntryInfo {
    const memoryItem = (cache as unknown as { 
      ['cache']: Map<string, { timestamp: number; ttl: number }> 
    }).cache.get(key);
    
    const persistentItem = (persistentCache as unknown as { 
      ['memoryCache']: Map<string, { timestamp: number; ttl: number }> 
    }).memoryCache.get(key);

    return {
      key,
      inMemory: !!memoryItem,
      inPersistent: !!persistentItem,
      memoryExpiresAt: memoryItem ? memoryItem.timestamp + memoryItem.ttl : undefined,
      persistentExpiresAt: persistentItem ? persistentItem.timestamp + persistentItem.ttl : undefined
    };
  }

  /**
   * 获取所有缓存键
   */
  keys(layer: CacheLayer = 'all'): string[] {
    const memoryKeys = layer === 'memory' || layer === 'all' 
      ? cache.keys() 
      : [];
    const persistentKeys = layer === 'persistent' || layer === 'all'
      ? persistentCache.keys()
      : [];
    
    return Array.from(new Set([...memoryKeys, ...persistentKeys]));
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    memory: CacheStats;
    persistent: CacheStats & { storageUsed: number; isPersistent: boolean };
    total: number;
  } {
    const memoryStats = cache.getStats();
    const persistentStats = persistentCache.getStats();

    return {
      memory: memoryStats,
      persistent: persistentStats,
      total: memoryStats.total + persistentStats.total
    };
  }

  /**
   * 预热缓存 - 提前加载热点数据
   */
  async warmup<T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    strategy: Partial<CacheStrategy> = {}
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    await Promise.all(
      keys.map(async key => {
        try {
          if (!this.has(key)) {
            const data = await fetcher(key);
            this.set(key, data, strategy);
            success++;
          }
        } catch (error) {
          console.warn(`[CacheManager] 预热缓存失败: ${key}`, error);
          failed++;
        }
      })
    );

    return { success, failed };
  }

  /**
   * 使相关缓存失效（支持通配符）
   */
  invalidate(pattern: string): number {
    const allKeys = this.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchedKeys = allKeys.filter(key => regex.test(key));
    
    return this.deleteBatch(matchedKeys);
  }

  /**
   * 导出缓存数据
   */
  export(layer: CacheLayer = 'all'): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    if (layer === 'memory' || layer === 'all') {
      for (const key of cache.keys()) {
        const data = cache.get(key);
        if (data !== null) {
          result[key] = data;
        }
      }
    }
    
    if (layer === 'persistent' || layer === 'all') {
      for (const key of persistentCache.keys()) {
        if (!(key in result)) {
          const data = persistentCache.get(key);
          if (data !== null) {
            result[key] = data;
          }
        }
      }
    }
    
    return result;
  }

  /**
   * 导入缓存数据
   */
  import(
    data: Record<string, unknown>,
    strategy: Partial<CacheStrategy> = {}
  ): void {
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value, strategy);
    }
  }
}

/**
 * 全局缓存管理器实例
 */
export const cacheManager = CacheManager.getInstance();

/**
 * 便捷函数：获取缓存
 */
export function getCache<T>(key: string): T | null {
  return cacheManager.get<T>(key);
}

/**
 * 便捷函数：设置缓存
 */
export function setCache<T>(
  key: string,
  data: T,
  strategy?: Partial<CacheStrategy>
): void {
  cacheManager.set(key, data, strategy);
}

/**
 * 便捷函数：获取或设置缓存
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  strategy?: Partial<CacheStrategy>
): Promise<T> {
  return cacheManager.getOrSet(key, fetcher, strategy);
}

/**
 * 便捷函数：删除缓存
 */
export function deleteCache(key: string, layer?: CacheLayer): boolean {
  return cacheManager.delete(key, layer);
}

/**
 * 便捷函数：清空缓存
 */
export function clearCache(layer?: CacheLayer): void {
  cacheManager.clear(layer);
}

/**
 * 便捷函数：使缓存失效（通配符支持）
 */
export function invalidateCache(pattern: string): number {
  return cacheManager.invalidate(pattern);
}
