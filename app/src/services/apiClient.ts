/**
 * API 客户端模块
 * @module services/apiClient
 * @description 统一的 HTTP 客户端封装，所有服务模块共用
 */

import axios, { type AxiosInstance } from 'axios';
import { getConfig } from './config';
import { scheduleRequest, withRetry } from './requestScheduler';

/**
 * API 客户端配置选项
 */
export interface ApiClientOptions {
  /** 基础 URL */
  baseURL?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试间隔（毫秒） */
  retryInterval?: number;
  /** 请求头 */
  headers?: Record<string, string>;
}

/**
 * API 客户端类
 * @class ApiClient
 * @description 封装 HTTP 请求，统一处理配置、调度、重试、日志
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private options: Required<ApiClientOptions>;

  constructor(options: ApiClientOptions = {}) {
    const config = getConfig();
    
    this.options = {
      baseURL: options.baseURL ?? config.baseURL,
      timeout: options.timeout ?? config.timeout,
      retryCount: options.retryCount ?? config.retryCount,
      retryInterval: options.retryInterval ?? config.retryInterval,
      headers: options.headers ?? { 'Content-Type': 'application/json' }
    };

    this.axiosInstance = axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      headers: this.options.headers
    });

    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`[ApiClient] 请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`[ApiClient] 响应: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[ApiClient] 请求失败:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 执行 GET 请求
   * @template T 响应数据类型
   * @param endpoint API 端点
   * @param params 查询参数
   * @returns 响应数据
   */
  async get<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    return scheduleRequest(() =>
      withRetry(
        () => this.axiosInstance.get<T>(endpoint, { params }).then(res => res.data),
        this.options.retryCount,
        this.options.retryInterval
      )
    );
  }

  /**
   * 执行 POST 请求
   * @template T 响应数据类型
   * @param endpoint API 端点
   * @param data 请求体数据
   * @returns 响应数据
   */
  async post<T>(endpoint: string, data: unknown = {}): Promise<T> {
    return scheduleRequest(() =>
      withRetry(
        () => this.axiosInstance.post<T>(endpoint, data).then(res => res.data),
        this.options.retryCount,
        this.options.retryInterval
      )
    );
  }

  /**
   * 获取原始 Axios 实例（高级用法）
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * 更新配置
   */
  updateConfig(options: Partial<ApiClientOptions>): void {
    Object.assign(this.options, options);
    
    if (options.baseURL) {
      this.axiosInstance.defaults.baseURL = options.baseURL;
    }
    if (options.timeout) {
      this.axiosInstance.defaults.timeout = options.timeout;
    }
    if (options.headers) {
      Object.assign(this.axiosInstance.defaults.headers, options.headers);
    }
  }
}

/**
 * 全局 API 客户端实例
 */
export const apiClient = new ApiClient();

/**
 * 便捷函数：GET 请求
 */
export async function apiGet<T>(
  endpoint: string, 
  params: Record<string, unknown> = {}
): Promise<T> {
  return apiClient.get<T>(endpoint, params);
}

/**
 * 便捷函数：POST 请求
 */
export async function apiPost<T>(endpoint: string, data: unknown = {}): Promise<T> {
  return apiClient.post<T>(endpoint, data);
}
