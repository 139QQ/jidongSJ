/**
 * 请求调度模块
 * @module services/requestScheduler
 * @description 控制HTTP请求的间隔时间，防止请求过于频繁
 */

import { getConfig, getRequestInterval } from './config';

/** 请求任务类型 */
type RequestTask<T> = () => Promise<T>;

/** 调度器状态 */
interface SchedulerState {
  /** 是否正在运行 */
  isRunning: boolean;
  /** 最后请求时间 */
  lastRequestTime: number;
  /** 待处理队列长度 */
  queueLength: number;
}

/** 请求队列项 */
interface QueueItem<T> {
  task: RequestTask<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  priority: number;
}

/** 调度器配置 */
interface SchedulerConfig {
  /** 请求超时时间（毫秒） */
  timeout: number;
}

/**
 * 请求调度器类
 * @class RequestScheduler
 * @description 单例模式实现的请求调度器，用于控制请求频率和重试
 */
export class RequestScheduler {
  private static instance: RequestScheduler;
  private lastRequestTime = 0;
  private requestQueue: Array<QueueItem<unknown>> = [];
  private isProcessing = false;
  private config: SchedulerConfig = {
    timeout: 30000
  };

  private constructor() {
    // 从配置读取超时时间
    const config = getConfig();
    this.config.timeout = config.timeout;
  }

  /**
   * 获取调度器实例
   */
  static getInstance(): RequestScheduler {
    if (!RequestScheduler.instance) {
      RequestScheduler.instance = new RequestScheduler();
    }
    return RequestScheduler.instance;
  }

  /**
   * 获取调度器状态
   */
  getState(): SchedulerState {
    return {
      isRunning: this.isProcessing,
      lastRequestTime: this.lastRequestTime,
      queueLength: this.requestQueue.length
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 更新超时时间
   */
  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
  }

  /**
   * 计算需要等待的时间
   */
  private calculateWaitTime(): number {
    const now = Date.now();
    const interval = getRequestInterval();
    const elapsed = now - this.lastRequestTime;
    return Math.max(0, interval - elapsed);
  }

  /**
   * 等待指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 带超时的请求执行
   */
  private async executeWithTimeout<T>(
    task: RequestTask<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      task(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('请求超时')), timeout)
      )
    ]);
  }

  /**
   * 处理请求队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // 按优先级排序
    this.requestQueue.sort((a, b) => b.priority - a.priority);

    while (this.requestQueue.length > 0) {
      const waitTime = this.calculateWaitTime();
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }

      const item = this.requestQueue.shift();
      if (!item) continue;

      try {
        this.lastRequestTime = Date.now();
        const result = await this.executeWithTimeout(
          item.task,
          this.config.timeout
        );
        item.resolve(result);
      } catch (error) {
        // 调度器不处理重试，重试由调用方（如 withRetry）处理
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        item.reject(new Error(`请求失败: ${errorMessage}`));
      }
    }

    this.isProcessing = false;
  }

  /**
   * 调度单个请求
   * @template T 请求返回类型
   * @param task 请求任务
   * @param priority 优先级（越高越先执行，默认0）
   * @returns 请求结果
   */
  async schedule<T>(task: RequestTask<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        task,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority
      });
      this.processQueue();
    });
  }

  /**
   * 批量调度请求
   * @template T 请求返回类型
   * @param tasks 请求任务数组
   * @returns 请求结果数组
   */
  async scheduleBatch<T>(tasks: RequestTask<T>[]): Promise<T[]> {
    const promises = tasks.map(task => this.schedule(task));
    return Promise.all(promises);
  }

  /**
   * 串行执行请求（按顺序一个接一个）
   * @template T 请求返回类型
   * @param tasks 请求任务数组
   * @returns 请求结果数组
   */
  async scheduleSequential<T>(tasks: RequestTask<T>[]): Promise<T[]> {
    const results: T[] = [];
    for (const task of tasks) {
      const result = await this.schedule(task);
      results.push(result);
    }
    return results;
  }

  /**
   * 清空请求队列
   * @returns 清空的任务数量
   */
  clearQueue(): number {
    const count = this.requestQueue.length;
    this.requestQueue.forEach(item => {
      item.reject(new Error('请求被取消'));
    });
    this.requestQueue = [];
    return count;
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.requestQueue.length;
  }
}

/**
 * 便捷函数：调度单个请求
 */
export async function scheduleRequest<T>(
  task: RequestTask<T>,
  priority?: number
): Promise<T> {
  return RequestScheduler.getInstance().schedule(task, priority);
}

/**
 * 便捷函数：批量调度请求
 */
export async function scheduleBatch<T>(tasks: RequestTask<T>[]): Promise<T[]> {
  return RequestScheduler.getInstance().scheduleBatch(tasks);
}

/**
 * 便捷函数：串行执行请求
 */
export async function scheduleSequential<T>(tasks: RequestTask<T>[]): Promise<T[]> {
  return RequestScheduler.getInstance().scheduleSequential(tasks);
}

/**
 * 创建延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的请求包装器
 * @template T 请求返回类型
 * @param task 请求任务
 * @param retryCount 重试次数
 * @param retryInterval 重试间隔(毫秒)
 */
export async function withRetry<T>(
  task: RequestTask<T>,
  retryCount = 3,
  retryInterval = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await task();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retryCount) {
        console.log(`[withRetry] 第${i + 1}次失败，${retryInterval}ms后重试:`, lastError.message);
        await delay(retryInterval);
      }
    }
  }
  
  throw lastError ?? new Error('请求失败');
}

/**
 * 带超时的请求包装器
 * @template T 请求返回类型
 * @param task 请求任务
 * @param timeout 超时时间(毫秒)
 */
export async function withTimeout<T>(
  task: RequestTask<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    task(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`请求超时(${timeout}ms)`)), timeout)
    )
  ]);
}
