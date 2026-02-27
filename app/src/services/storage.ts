/**
 * 本地存储服务模块
 * @module services/storage
 * @description 封装localStorage操作，提供类型安全的存储功能
 * 
 * @example
 * ```typescript
 * // 存储数据
 * storage.set('userFunds', fundList);
 * 
 * // 读取数据
 * const funds = storage.get<UserFund[]>('userFunds', []);
 * 
 * // 删除数据
 * storage.remove('userFunds');
 * 
 * // 清空所有数据
 * storage.clear();
 * ```
 */

import { StorageKey } from '@/types/fund';
export { StorageKey };

/**
 * 存储服务类
 * @class StorageService
 * @description 提供类型安全的localStorage操作
 */
export class StorageService {
  /**
   * 设置存储项
   * @template T 数据类型
   * @param {string} key - 存储键名
   * @param {T} value - 存储值
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`存储数据失败 [${key}]:`, error);
      throw new Error(`无法存储数据: ${key}`);
    }
  }

  /**
   * 获取存储项
   * @template T 数据类型
   * @param {string} key - 存储键名
   * @param {T} defaultValue - 默认值
   * @returns {T} 存储值或默认值
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return defaultValue;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`读取数据失败 [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * 获取存储项（可能为null）
   * @template T 数据类型
   * @param {string} key - 存储键名
   * @returns {T | null} 存储值或null
   */
  getNullable<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`读取数据失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 删除存储项
   * @param {string} key - 存储键名
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`删除数据失败 [${key}]:`, error);
    }
  }

  /**
   * 清空所有存储
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空存储失败:', error);
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 存储键名
   * @returns {boolean} 是否存在
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * 获取所有键名
   * @returns {string[]} 键名数组
   */
  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * 获取存储大小（字节）
   * @returns {number} 存储大小
   */
  size(): number {
    let size = 0;
    for (const key of this.keys()) {
      const value = localStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
    return size * 2; // UTF-16编码，每个字符2字节
  }

  /**
   * 设置带过期时间的存储项
   * @template T 数据类型
   * @param {string} key - 存储键名
   * @param {T} value - 存储值
   * @param {number} ttl - 过期时间（毫秒）
   */
  setWithExpiry<T>(key: string, value: T, ttl: number): void {
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    this.set(key, item);
  }

  /**
   * 获取带过期时间的存储项
   * @template T 数据类型
   * @param {string} key - 存储键名
   * @returns {T | null} 存储值或null（已过期）
   */
  getWithExpiry<T>(key: string): T | null {
    const item = this.getNullable<{ value: T; expiry: number }>(key);
    if (!item) {
      return null;
    }
    if (Date.now() > item.expiry) {
      this.remove(key);
      return null;
    }
    return item.value;
  }

  /**
   * 批量设置存储项
   * @param {Record<string, any>} items - 键值对对象
   */
  setBatch(items: Record<string, any>): void {
    for (const [key, value] of Object.entries(items)) {
      this.set(key, value);
    }
  }

  /**
   * 批量获取存储项
   * @template T 数据类型
   * @param {string[]} keys - 键名数组
   * @returns {Record<string, T | null>} 键值对对象
   */
  getBatch<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    for (const key of keys) {
      result[key] = this.getNullable<T>(key);
    }
    return result;
  }
}

/**
 * 存储服务实例
 */
export const storage = new StorageService();

/**
 * 便捷函数：设置存储
 */
export function setStorage<T>(key: string, value: T): void {
  storage.set(key, value);
}

/**
 * 便捷函数：获取存储
 */
export function getStorage<T>(key: string, defaultValue: T): T {
  return storage.get(key, defaultValue);
}

/**
 * 便捷函数：删除存储
 */
export function removeStorage(key: string): void {
  storage.remove(key);
}

/**
 * 便捷函数：清空存储
 */
export function clearStorage(): void {
  storage.clear();
}
