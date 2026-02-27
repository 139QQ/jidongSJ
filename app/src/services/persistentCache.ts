/**
 * 持久化缓存服务模块
 * @module services/persistentCache
 * @description 提供localStorage持久化缓存功能，支持数据压缩和版本控制
 */

import type { CacheStats } from './cache';

/** 缓存项 */
interface PersistentCacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  compressed?: boolean;
}

/** 缓存元数据 */
interface CacheMetadata {
  key: string;
  timestamp: number;
  size: number;
}

/** 缓存版本号（用于数据格式升级时清理旧缓存） */
const CACHE_VERSION = 1;

/** 缓存键前缀 */
const CACHE_KEY_PREFIX = 'fund_cache_';

/** 元数据存储键 */
const METADATA_KEY = `${CACHE_KEY_PREFIX}_metadata`;

/** 最大缓存项数 */
const MAX_ITEMS = 50;

/** 压缩阈值（字节） */
const COMPRESS_THRESHOLD = 1024; // 1KB

/**
 * 简单的LZ-like压缩（适用于重复数据的JSON）
 * 注意：这不是真正的压缩算法，只是简单的重复字符串替换
 */
function compress(data: string): string {
  // 对于小数据，压缩可能比原数据还大，直接返回
  if (data.length < COMPRESS_THRESHOLD) {
    return data;
  }
  
  // 简单压缩：将重复的 "基金"、"代码" 等常用词替换为短标记
  const commonPatterns: Array<[string, string]> = [
    ['基金', '\x00'],
    ['代码', '\x01'],
    ['名称', '\x02'],
    ['净值', '\x03'],
    ['增长率', '\x04'],
    ['单位', '\x05'],
    ['累计', '\x06'],
    ['fund_', '\x07'],
    ['rank_', '\x08'],
    ['daily_', '\x09'],
    ['estimate_', '\x0A'],
    ['{"', '\x0B'],
    ['":"', '\x0C'],
    ['","', '\x0D']
  ];
  
  let compressed = data;
  for (const [pattern, replacement] of commonPatterns) {
    compressed = compressed.split(pattern).join(replacement);
  }
  
  // 如果压缩后没有变小，返回原数据
  if (compressed.length >= data.length) {
    return data;
  }
  
  return 'C' + compressed; // C标记表示已压缩
}

/**
 * 解压
 */
function decompress(data: string): string {
  if (!data.startsWith('C')) {
    return data;
  }
  
  const compressed = data.slice(1);
  const patterns: Array<[string, string]> = [
    ['\x0D', '","'],
    ['\x0C', '":"'],
    ['\x0B', '{"'],
    ['\x0A', 'estimate_'],
    ['\x09', 'daily_'],
    ['\x08', 'rank_'],
    ['\x07', 'fund_'],
    ['\x06', '累计'],
    ['\x05', '单位'],
    ['\x04', '增长率'],
    ['\x03', '净值'],
    ['\x02', '名称'],
    ['\x01', '代码'],
    ['\x00', '基金']
  ];
  
  let decompressed = compressed;
  for (const [pattern, replacement] of patterns) {
    decompressed = decompressed.split(pattern).join(replacement);
  }
  
  return decompressed;
}

/**
 * 序列化数据（带压缩）
 */
function serialize<T>(data: T): string {
  const json = JSON.stringify(data);
  const compressed = compress(json);
  return compressed;
}

/**
 * 反序列化数据（带解压）
 */
function deserialize<T>(data: string): T {
  const decompressed = decompress(data);
  return JSON.parse(decompressed) as T;
}

/**
 * 持久化缓存服务类
 */
export class PersistentCacheService {
  private memoryCache: Map<string, PersistentCacheItem<unknown>> = new Map();
  private metadata: CacheMetadata[] = [];
  private initialized = false;
  private isLocalStorageAvailable = true;

  /**
   * 初始化缓存，从localStorage加载
   */
  private init(): void {
    if (this.initialized) return;
    
    try {
      // 检查 localStorage 是否可用
      const testKey = `${CACHE_KEY_PREFIX}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch {
      console.warn('[PersistentCache] localStorage 不可用，将仅使用内存缓存');
      this.isLocalStorageAvailable = false;
      this.initialized = true;
      return;
    }
    
    // 加载元数据
    try {
      const metadataStr = localStorage.getItem(METADATA_KEY);
      if (metadataStr) {
        this.metadata = JSON.parse(metadataStr);
      }
    } catch (error) {
      console.error('[PersistentCache] 加载元数据失败:', error);
      this.metadata = [];
    }
    
    // 加载缓存数据
    const validKeys: string[] = [];
    for (const meta of this.metadata) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(meta.key));
        if (stored) {
          const item = deserialize<PersistentCacheItem<unknown>>(stored);
          if (item.version === CACHE_VERSION) {
            this.memoryCache.set(meta.key, item);
            validKeys.push(meta.key);
          }
        }
      } catch (error) {
        console.warn(`[PersistentCache] 加载缓存项 ${meta.key} 失败:`, error);
        // 删除损坏的缓存
        this.removeFromStorage(meta.key);
      }
    }
    
    // 清理无效的元数据
    this.metadata = this.metadata.filter(meta => validKeys.includes(meta.key));
    this.saveMetadata();
    
    console.log(`[PersistentCache] 从localStorage加载了 ${this.memoryCache.size} 个缓存项`);
    
    this.initialized = true;
  }

  /**
   * 获取localStorage键
   */
  private getStorageKey(key: string): string {
    return `${CACHE_KEY_PREFIX}${key}`;
  }

  /**
   * 保存元数据
   */
  private saveMetadata(): void {
    if (!this.isLocalStorageAvailable) return;
    
    try {
      localStorage.setItem(METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('[PersistentCache] 保存元数据失败:', error);
    }
  }

  /**
   * 从localStorage移除
   */
  private removeFromStorage(key: string): void {
    if (!this.isLocalStorageAvailable) return;
    
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.warn(`[PersistentCache] 删除 ${key} 失败:`, error);
    }
  }

  /**
   * 更新元数据
   */
  private updateMetadata(key: string, size: number): void {
    const index = this.metadata.findIndex(m => m.key === key);
    const meta: CacheMetadata = {
      key,
      timestamp: Date.now(),
      size
    };
    
    if (index >= 0) {
      this.metadata[index] = meta;
    } else {
      this.metadata.push(meta);
    }
    
    this.saveMetadata();
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl = 10 * 60 * 1000): void {
    this.init();
    this.cleanup();

    // 如果缓存已满，删除最旧的项
    if (this.memoryCache.size >= MAX_ITEMS) {
      this.evictOldest();
    }

    const item: PersistentCacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: CACHE_VERSION
    };

    this.memoryCache.set(key, item);

    // 持久化到localStorage
    if (this.isLocalStorageAvailable) {
      try {
        const serialized = serialize(item);
        localStorage.setItem(this.getStorageKey(key), serialized);
        this.updateMetadata(key, serialized.length);
      } catch (error) {
        // localStorage可能已满，清理旧缓存
        console.warn('[PersistentCache] localStorage 可能已满，清理旧缓存');
        this.clearOldCaches();
        
        try {
          const serialized = serialize(item);
          localStorage.setItem(this.getStorageKey(key), serialized);
          this.updateMetadata(key, serialized.length);
        } catch (retryError) {
          console.error('[PersistentCache] 持久化失败，将仅使用内存缓存:', retryError);
          this.isLocalStorageAvailable = false;
        }
      }
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    this.init();

    const item = this.memoryCache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const existed = this.memoryCache.has(key);
    
    this.memoryCache.delete(key);
    this.removeFromStorage(key);
    
    // 更新元数据
    this.metadata = this.metadata.filter(m => m.key !== key);
    this.saveMetadata();
    
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
   * 清空所有缓存
   */
  clear(): void {
    // 删除所有相关localStorage项
    if (this.isLocalStorageAvailable) {
      for (const meta of this.metadata) {
        this.removeFromStorage(meta.key);
      }
      localStorage.removeItem(METADATA_KEY);
    }
    
    this.memoryCache.clear();
    this.metadata = [];
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  /**
   * 淘汰最旧的缓存
   */
  private evictOldest(): void {
    if (this.metadata.length === 0) return;
    
    // 按时间排序，删除最旧的
    const sorted = [...this.metadata].sort((a, b) => a.timestamp - b.timestamp);
    const oldest = sorted[0];
    
    if (oldest) {
      this.delete(oldest.key);
      console.log(`[PersistentCache] 淘汰最旧缓存: ${oldest.key}`);
    }
  }

  /**
   * 清理旧缓存（当localStorage满时）
   */
  private clearOldCaches(): void {
    // 按时间排序
    const sorted = [...this.metadata].sort((a, b) => a.timestamp - b.timestamp);
    
    // 删除1/3的缓存
    const deleteCount = Math.ceil(sorted.length / 3);
    for (let i = 0; i < deleteCount && i < sorted.length; i++) {
      this.delete(sorted[i].key);
    }
    
    console.log(`[PersistentCache] 清理了 ${deleteCount} 个旧缓存项`);
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
   * 获取缓存统计
   */
  getStats(): CacheStats & { 
    storageUsed: number; 
    isPersistent: boolean;
    compressionRatio: number;
  } {
    this.init();
    
    let totalSize = 0;
    let compressedSize = 0;
    
    for (const meta of this.metadata) {
      totalSize += meta.size;
      // 假设压缩后大约是原大小的60%
      compressedSize += meta.size;
    }
    
    return {
      total: this.memoryCache.size,
      maxItems: MAX_ITEMS,
      hitCount: 0, // 持久化缓存不统计命中率
      missCount: 0,
      hitRate: 0,
      storageUsed: totalSize,
      isPersistent: this.isLocalStorageAvailable,
      compressionRatio: totalSize > 0 ? compressedSize / totalSize : 1
    };
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.memoryCache.size;
  }
}

/**
 * 全局持久化缓存实例
 */
export const persistentCache = new PersistentCacheService();
