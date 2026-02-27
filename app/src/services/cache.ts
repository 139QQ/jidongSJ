/**
 * 缓存服务模块
 * @module services/cache
 * @description 提供带过期时间的内存缓存功能
 */

/** 缓存项 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessTime: number;
}

/** 缓存配置 */
interface CacheConfig {
  /** 默认TTL（毫秒） */
  defaultTTL: number;
  /** 最大缓存项数 */
  maxItems: number;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
}

/** 缓存统计 */
export interface CacheStats {
  total: number;
  maxItems: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

/** 缓存事件类型 */
type CacheEventType = 'set' | 'get' | 'delete' | 'expired' | 'evicted';

/** 缓存事件监听器 */
type CacheEventListener<T = unknown> = (key: string, data?: T) => void;

/** 默认缓存配置 */
const defaultCacheConfig: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5分钟
  maxItems: 100,
  cleanupInterval: 60 * 1000 // 1分钟清理一次
};

/**
 * 缓存服务类
 * @class CacheService
 * @description 提供带过期时间的缓存功能，支持LRU淘汰和统计
 */
export class CacheService {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<CacheEventType, Set<CacheEventListener>> = new Map();
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultCacheConfig, ...config };
    this.startCleanupTimer();
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 添加事件监听器
   */
  on<T>(event: CacheEventType, listener: CacheEventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as CacheEventListener);
    
    // 返回取消订阅函数
    return () => {
      this.eventListeners.get(event)?.delete(listener as CacheEventListener);
    };
  }

  /**
   * 触发事件
   */
  private emit<T>(event: CacheEventType, key: string, data?: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(key, data);
        } catch (error) {
          console.error(`[CacheService] 事件监听器错误:`, error);
        }
      });
    }
  }

  /**
   * 设置缓存
   * @template T 数据类型
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒）
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // 检查是否已存在（更新操作）
    const isUpdate = this.cache.has(key);

    // 如果缓存已满且是新建，淘汰最久未使用的
    if (!isUpdate && this.cache.size >= this.config.maxItems) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttl ?? this.config.defaultTTL,
      accessCount: 0,
      lastAccessTime: now
    });

    this.emit('set', key, data);
  }

  /**
   * 批量设置缓存
   */
  setBatch<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const { key, data, ttl } of entries) {
      this.set(key, data, ttl);
    }
  }

  /**
   * 获取缓存
   * @template T 数据类型
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.missCount++;
      this.emit('expired', key);
      return null;
    }

    // 更新访问统计（LRU）
    item.accessCount++;
    item.lastAccessTime = Date.now();
    
    this.hitCount++;
    this.emit('get', key, item.data as T);
    return item.data as T;
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
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key);
    if (existed) {
      this.cache.delete(key);
      this.emit('delete', key);
    }
    return existed;
  }

  /**
   * 批量删除
   */
  deleteBatch(keys: string[]): number {
    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    keys.forEach(key => this.emit('delete', key));
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.emit('expired', key);
    }

    if (expiredKeys.length > 0) {
      console.log(`[CacheService] 清理了 ${expiredKeys.length} 个过期缓存项`);
    }
  }

  /**
   * 淘汰最久未使用的缓存（LRU）
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessTime < oldestTime) {
        oldestTime = item.lastAccessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.emit('evicted', oldestKey);
      console.log(`[CacheService] LRU淘汰: ${oldestKey}`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    return {
      total: this.cache.size,
      maxItems: this.config.maxItems,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0
    };
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 获取或设置缓存
   * @template T 数据类型
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param ttl 过期时间（毫秒）
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
   * 销毁缓存服务
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
    this.eventListeners.clear();
  }
}

/**
 * 全局缓存实例
 */
export const cache = new CacheService();

/**
 * 生成缓存键
 * @param prefix 前缀
 * @param params 参数
 */
export function generateCacheKey(
  prefix: string, 
  params: Record<string, string | number | boolean> = {}
): string {
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return paramStr ? `${prefix}?${paramStr}` : prefix;
}
