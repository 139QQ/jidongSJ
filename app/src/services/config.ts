/**
 * 服务配置模块
 * @module services/config
 * @description 管理API请求配置和全局设置
 */

import type { RequestConfig } from '@/types/fund';

/** 默认请求配置 */
export const defaultConfig: RequestConfig = {
  baseURL: 'http://45.152.66.117:8080/api/public',
  timeout: 180000, // 增加到180秒超时，因为AKTools服务器响应较慢
  requestInterval: 100, // 减少到100ms请求间隔，提高并发
  retryCount: 3, // 增加重试次数
  retryInterval: 3000 // 减少重试间隔
};

/** 当前配置 */
let currentConfig: RequestConfig = { ...defaultConfig };

/**
 * 获取当前配置
 * @returns {RequestConfig} 当前请求配置
 */
export function getConfig(): RequestConfig {
  return { ...currentConfig };
}

/**
 * 更新配置
 * @param {Partial<RequestConfig>} config - 要更新的配置项
 */
export function updateConfig(config: Partial<RequestConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 重置配置为默认值
 */
export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * 设置请求间隔
 * @param {number} interval - 间隔时间(毫秒)
 */
export function setRequestInterval(interval: number): void {
  if (interval < 100) {
    console.warn('请求间隔不能小于100ms，已设置为100ms');
    currentConfig.requestInterval = 100;
  } else {
    currentConfig.requestInterval = interval;
  }
}

/**
 * 获取请求间隔
 * @returns {number} 当前请求间隔(毫秒)
 */
export function getRequestInterval(): number {
  return currentConfig.requestInterval;
}

/**
 * 设置基础URL
 * @param {string} url - API基础URL
 */
export function setBaseURL(url: string): void {
  currentConfig.baseURL = url;
}

/**
 * 获取基础URL
 * @returns {string} 当前基础URL
 */
export function getBaseURL(): string {
  return currentConfig.baseURL;
}
