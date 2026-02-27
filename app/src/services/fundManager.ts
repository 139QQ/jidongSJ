/**
 * 基金管理模块
 * @module services/fundManager
 * @description 提供用户关注基金的增删改查功能
 * 
 * @example
 * ```typescript
 * const manager = new FundManager();
 * 
 * // 添加基金
 * await manager.addFund('000001', '我的基金', 1000, 1.5);
 * 
 * // 获取所有基金
 * const funds = manager.getAllFunds();
 * 
 * // 更新基金
 * manager.updateFund('000001', { holdShares: 2000 });
 * 
 * // 删除基金
 * manager.deleteFund('000001');
 * ```
 */

import type { UserFund, FundUpdateData, FundQueryOptions } from '@/types/fund';
import { FundStatus, FundType } from '@/types/fund';
import { storage, StorageKey } from './storage';
import { navService } from './navService';
import { apiClient } from './apiClient';
import { cache } from './cache';

export type { FundUpdateData, FundQueryOptions };

/**
 * 基金管理类
 * @class FundManager
 * @description 管理用户关注的基金列表，提供完整的CRUD功能
 */
export class FundManager {
  private funds: Map<string, UserFund>;

  /**
   * 构造函数
   */
  constructor() {
    this.funds = new Map();
    this.loadFromStorage();
  }

  /**
   * 从本地存储加载基金数据
   */
  private loadFromStorage(): void {
    try {
      const savedFunds = storage.get<UserFund[]>(StorageKey.USER_FUNDS, []);
      for (const fund of savedFunds) {
        this.funds.set(fund.code, fund);
      }
      console.log(`[FundManager] 已加载 ${this.funds.size} 只基金`);
    } catch (error) {
      console.error('[FundManager] 加载基金数据失败:', error);
    }
  }

  /**
   * 保存基金数据到本地存储
   */
  private saveToStorage(): void {
    try {
      const fundsArray = Array.from(this.funds.values());
      storage.set(StorageKey.USER_FUNDS, fundsArray);
    } catch (error) {
      console.error('[FundManager] 保存基金数据失败:', error);
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加基金到关注列表 - 优化版本
   * @param {string} code - 基金代码
   * @param {string} [remark] - 备注
   * @param {number} [holdShares] - 持有份额
   * @param {number} [costPrice] - 成本价
   * @returns {Promise<UserFund | null>} 添加的基金或 null
   */
  async addFund(
    code: string,
    remark?: string,
    holdShares?: number,
    costPrice?: number
  ): Promise<UserFund | null> {
    // 检查是否已存在
    if (this.funds.has(code)) {
      console.warn(`[FundManager] 基金 ${code} 已存在`);
      return null;
    }

    try {
      // 直接从 API 获取单只基金信息，避免加载全部数据
      const fundInfo = await this.getFundInfo(code);

      if (!fundInfo) {
        console.error(`[FundManager] 未找到基金 ${code}`);
        return null;
      }

      // 创建用户基金对象（净值数据后续异步获取）
      const userFund: UserFund = {
        id: this.generateId(),
        code: fundInfo.code,
        name: fundInfo.name,
        type: this.inferFundType(fundInfo.name),
        addedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: FundStatus.ACTIVE,
        remark,
        holdShares,
        costPrice,
        latestNav: fundInfo.latestNav
      };

      this.funds.set(code, userFund);
      this.saveToStorage();

      console.log(`[FundManager] 成功添加基金 ${code}`);
      
      // 异步获取最新净值（不阻塞添加操作）
      this.fetchLatestNav(code).catch(console.error);
      
      return userFund;
    } catch (error) {
      console.error(`[FundManager] 添加基金 ${code} 失败:`, error);
      return null;
    }
  }

  /**
   * 获取单只基金信息 - 优化版本（使用缓存）
   * @param {string} code - 基金代码
   * @returns {Promise<{code: string; name: string; latestNav?: any} | null>}
   */
  private async getFundInfo(code: string): Promise<{
    code: string;
    name: string;
    latestNav?: any;
  } | null> {
    try {
      // 先从缓存获取全部基金数据
      const cachedData = cache.get<any[]>('fund_open_fund_daily_em');
      
      if (cachedData && cachedData.length > 0) {
        // 从缓存查找
        const item = cachedData.find((f: any) => f['基金代码'] === code);
        if (item) {
          console.log(`[FundManager] 从缓存获取基金${code}信息`);
          return this.mapFundItem(item, code);
        }
      }
      
      // 缓存未命中，从 API 获取
      console.log(`[FundManager] 从 API 获取基金${code}信息`);
      const data = await apiClient.get('fund_open_fund_daily_em');
      
      if (Array.isArray(data)) {
        // 缓存数据供后续使用
        cache.set('fund_open_fund_daily_em', data, 30 * 60 * 1000);
        
        const item = data.find((f: any) => f['基金代码'] === code);
        if (item) {
          return this.mapFundItem(item, code);
        }
      }
      return null;
    } catch (error) {
      console.error(`[FundManager] 获取基金${code}信息失败:`, error);
      return null;
    }
  }

  /**
   * 映射基金数据
   * @param {any} item - 原始数据项
   * @param {string} code - 基金代码
   * @returns {{code: string; name: string; latestNav: any}}
   */
  private mapFundItem(item: any, code: string): {
    code: string;
    name: string;
    latestNav: {
      unitNav: number;
      cumulativeNav: number;
      date: string;
      dailyGrowthRate: number;
    };
  } {
    return {
      code: item['基金代码'] || code,
      name: item['基金简称'] || code,
      latestNav: {
        unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
        cumulativeNav: parseFloat(item['累计净值'] ?? '0') || 0,
        date: item['日期'] || new Date().toISOString().split('T')[0],
        dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || 0
      }
    };
  }

  /**
   * 异步获取最新净值（不阻塞添加操作）
   * @param {string} code - 基金代码
   */
  private async fetchLatestNav(code: string): Promise<void> {
    try {
      const latestNav = await navService.getLatestNav(code);
      if (latestNav) {
        const fund = this.funds.get(code);
        if (fund) {
          fund.latestNav = latestNav;
          fund.lastUpdated = new Date().toISOString();
          this.funds.set(code, fund);
          this.saveToStorage();
          console.log(`[FundManager] 已更新基金${code}净值`);
        }
      }
    } catch (error) {
      console.error(`[FundManager] 异步获取基金${code}净值失败:`, error);
    }
  }

  /**
   * 批量添加基金
   * @param {Array<{code: string; remark?: string; holdShares?: number; costPrice?: number}>} items - 基金数组
   * @returns {Promise<UserFund[]>} 成功添加的基金数组
   */
  async batchAddFunds(
    items: Array<{ code: string; remark?: string; holdShares?: number; costPrice?: number }>
  ): Promise<UserFund[]> {
    const results: UserFund[] = [];
    
    for (const item of items) {
      const fund = await this.addFund(
        item.code,
        item.remark,
        item.holdShares,
        item.costPrice
      );
      if (fund) {
        results.push(fund);
      }
    }

    return results;
  }

  /**
   * 根据基金名称推断基金类型
   * @param {string} name - 基金名称
   * @returns {FundType} 基金类型
   */
  private inferFundType(name: string): FundType {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('货币')) return FundType.MONEY;
    if (lowerName.includes('债券')) return FundType.BOND;
    if (lowerName.includes('指数') || lowerName.includes('etf')) return FundType.INDEX;
    if (lowerName.includes('qdii')) return FundType.QDII;
    if (lowerName.includes('混合')) return FundType.MIXED;
    if (lowerName.includes('理财')) return FundType.FINANCIAL;
    if (lowerName.includes('分级')) return FundType.GRADED;
    if (lowerName.includes('lof')) return FundType.LOF;
    if (lowerName.includes('股票')) return FundType.STOCK;
    
    return FundType.UNKNOWN;
  }

  /**
   * 获取所有基金
   * @returns {UserFund[]} 基金数组
   */
  getAllFunds(): UserFund[] {
    return Array.from(this.funds.values());
  }

  /**
   * 根据代码获取基金
   * @param {string} code - 基金代码
   * @returns {UserFund | undefined} 基金对象
   */
  getFundByCode(code: string): UserFund | undefined {
    return this.funds.get(code);
  }

  /**
   * 根据ID获取基金
   * @param {string} id - 基金ID
   * @returns {UserFund | undefined} 基金对象
   */
  getFundById(id: string): UserFund | undefined {
    return Array.from(this.funds.values()).find(f => f.id === id);
  }

  /**
   * 查询基金
   * @param {FundQueryOptions} options - 查询选项
   * @returns {UserFund[]} 符合条件的基金数组
   */
  queryFunds(options: FundQueryOptions = {}): UserFund[] {
    let result = this.getAllFunds();

    if (options.type) {
      result = result.filter(f => f.type === options.type);
    }

    if (options.status) {
      result = result.filter(f => f.status === options.status);
    }

    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      result = result.filter(f => 
        f.code.toLowerCase().includes(keyword) ||
        f.name.toLowerCase().includes(keyword) ||
        (f.remark && f.remark.toLowerCase().includes(keyword))
      );
    }

    return result;
  }

  /**
   * 更新基金信息
   * @param {string} code - 基金代码
   * @param {FundUpdateData} data - 更新数据
   * @returns {UserFund | null} 更新后的基金或null
   */
  updateFund(code: string, data: FundUpdateData): UserFund | null {
    const fund = this.funds.get(code);
    if (!fund) {
      console.warn(`[FundManager] 基金 ${code} 不存在`);
      return null;
    }

    const updatedFund: UserFund = {
      ...fund,
      ...data,
      lastUpdated: new Date().toISOString()
    };

    this.funds.set(code, updatedFund);
    this.saveToStorage();

    console.log(`[FundManager] 成功更新基金 ${code}`);
    return updatedFund;
  }

  /**
   * 批量更新基金
   * @param {Record<string, FundUpdateData>} updates - 更新数据映射
   * @returns {UserFund[]} 更新成功的基金数组
   */
  batchUpdateFunds(updates: Record<string, FundUpdateData>): UserFund[] {
    const results: UserFund[] = [];
    
    for (const [code, data] of Object.entries(updates)) {
      const updated = this.updateFund(code, data);
      if (updated) {
        results.push(updated);
      }
    }

    return results;
  }

  /**
   * 删除基金
   * @param {string} code - 基金代码
   * @returns {boolean} 是否删除成功
   */
  deleteFund(code: string): boolean {
    if (!this.funds.has(code)) {
      console.warn(`[FundManager] 基金 ${code} 不存在`);
      return false;
    }

    this.funds.delete(code);
    this.saveToStorage();

    console.log(`[FundManager] 成功删除基金 ${code}`);
    return true;
  }

  /**
   * 批量删除基金
   * @param {string[]} codes - 基金代码数组
   * @returns {number} 删除成功的数量
   */
  batchDeleteFunds(codes: string[]): number {
    let count = 0;
    for (const code of codes) {
      if (this.deleteFund(code)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 清空所有基金
   */
  clearAllFunds(): void {
    this.funds.clear();
    this.saveToStorage();
    console.log('[FundManager] 已清空所有基金');
  }

  /**
   * 刷新基金净值
   * @param {string} code - 基金代码
   * @returns {Promise<UserFund | null>} 更新后的基金或null
   */
  async refreshFundNav(code: string): Promise<UserFund | null> {
    const fund = this.funds.get(code);
    if (!fund) {
      console.warn(`[FundManager] 基金 ${code} 不存在`);
      return null;
    }

    try {
      const latestNav = await navService.getLatestNav(code);
      if (latestNav) {
        return this.updateFund(code, {});
      }
      return null;
    } catch (error) {
      console.error(`[FundManager] 刷新基金${code}净值失败:`, error);
      return null;
    }
  }

  /**
   * 刷新所有基金净值
   * @returns {Promise<number>} 刷新成功的数量
   */
  async refreshAllNavs(): Promise<number> {
    let count = 0;
    const funds = this.getAllFunds();

    for (const fund of funds) {
      const updated = await this.refreshFundNav(fund.code);
      if (updated) {
        count++;
      }
    }

    console.log(`[FundManager] 成功刷新 ${count}/${funds.length} 只基金净值`);
    return count;
  }

  /**
   * 计算基金收益
   * @param {string} code - 基金代码
   * @returns {Object | null} 收益数据
   */
  calculateProfit(code: string): {
    totalProfit: number;
    profitRate: number;
    currentValue: number;
    costValue: number;
  } | null {
    const fund = this.funds.get(code);
    if (!fund || !fund.holdShares || !fund.costPrice || !fund.latestNav) {
      return null;
    }

    const costValue = fund.holdShares * fund.costPrice;
    const currentValue = fund.holdShares * fund.latestNav.unitNav;
    const totalProfit = currentValue - costValue;
    const profitRate = (totalProfit / costValue) * 100;

    return {
      totalProfit,
      profitRate,
      currentValue,
      costValue
    };
  }

  /**
   * 计算总资产
   * @returns {Object} 资产数据
   */
  calculateTotalAssets(): {
    totalCost: number;
    totalValue: number;
    totalProfit: number;
    totalProfitRate: number;
  } {
    const funds = this.getAllFunds();
    let totalCost = 0;
    let totalValue = 0;

    for (const fund of funds) {
      if (fund.holdShares && fund.costPrice && fund.latestNav) {
        totalCost += fund.holdShares * fund.costPrice;
        totalValue += fund.holdShares * fund.latestNav.unitNav;
      }
    }

    const totalProfit = totalValue - totalCost;
    const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalValue,
      totalProfit,
      totalProfitRate
    };
  }

  /**
   * 获取基金数量
   * @returns {number} 基金数量
   */
  getFundCount(): number {
    return this.funds.size;
  }

  /**
   * 检查基金是否存在
   * @param {string} code - 基金代码
   * @returns {boolean} 是否存在
   */
  hasFund(code: string): boolean {
    return this.funds.has(code);
  }

  /**
   * 导出基金数据
   * @returns {string} JSON字符串
   */
  exportData(): string {
    const data = {
      funds: this.getAllFunds(),
      exportTime: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入基金数据
   * @param {string} jsonData - JSON字符串
   * @returns {boolean} 是否导入成功
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.funds && Array.isArray(data.funds)) {
        for (const fund of data.funds) {
          if (fund.code && fund.name) {
            this.funds.set(fund.code, {
              ...fund,
              id: fund.id || this.generateId(),
              lastUpdated: new Date().toISOString()
            });
          }
        }
        this.saveToStorage();
        console.log(`[FundManager] 成功导入 ${data.funds.length} 只基金`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[FundManager] 导入数据失败:', error);
      return false;
    }
  }
}

/**
 * 默认基金管理实例
 */
export const fundManager = new FundManager();
