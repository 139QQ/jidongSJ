/**
 * 缓存适配器模块
 * @module services/cacheAdapter
 * @description 为服务模块提供统一的缓存接口，封装底层缓存实现细节
 */

import { cacheManager, type CacheStrategy } from './cacheManager';

/**
 * 缓存适配器接口
 * 服务模块只依赖此接口，不直接依赖具体缓存实现
 */
export interface ICacheAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
}

/**
 * 服务缓存选项
 */
export interface ServiceCacheOptions {
  /** 内存缓存 TTL（毫秒） */
  memoryTTL?: number;
  /** 持久化缓存 TTL（毫秒） */
  persistentTTL?: number;
  /** 是否启用压缩 */
  compress?: boolean;
}

/**
 * 服务缓存适配器
 * @class ServiceCacheAdapter
 * @description 为数据服务模块提供专用的缓存接口
 */
export class ServiceCacheAdapter implements ICacheAdapter {
  private defaultOptions: ServiceCacheOptions;

  constructor(options: ServiceCacheOptions = {}) {
    this.defaultOptions = {
      memoryTTL: 5 * 60 * 1000,      // 5分钟
      persistentTTL: 30 * 60 * 1000, // 30分钟
      compress: false,
      ...options
    };
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    return cacheManager.get<T>(key);
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const options: Partial<CacheStrategy> = {
      memoryTTL: ttl ?? this.defaultOptions.memoryTTL,
      persistentTTL: this.defaultOptions.persistentTTL,
      asyncPersistent: true
    };
    
    cacheManager.set(key, data, options);
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    return cacheManager.has(key);
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    cacheManager.delete(key);
  }

  /**
   * 获取或设置缓存
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix: string, params: Record<string, string | number | boolean> = {}): string {
    const paramStr = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return paramStr ? `${prefix}?${paramStr}` : prefix;
  }
}

/**
 * 全局服务缓存适配器实例
 */
export const serviceCache = new ServiceCacheAdapter();

/**
 * 排行数据专用缓存（较长缓存时间）
 */
export const rankingCache = new ServiceCacheAdapter({
  memoryTTL: 10 * 60 * 1000,    // 10分钟
  persistentTTL: 60 * 60 * 1000, // 1小时
  compress: true
});

/**
 * 实时数据专用缓存（较短缓存时间）
 */
export const realtimeCache = new ServiceCacheAdapter({
  memoryTTL: 60 * 1000,         // 1分钟
  persistentTTL: 5 * 60 * 1000, // 5分钟
  compress: false
});

/**
 * 历史数据专用缓存（长期缓存）
 */
export const historyCache = new ServiceCacheAdapter({
  memoryTTL: 30 * 60 * 1000,        // 30分钟
  persistentTTL: 24 * 60 * 60 * 1000, // 24小时
  compress: true
});
