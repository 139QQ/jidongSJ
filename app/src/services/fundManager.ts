/**
 * 基金管理模块
 * @module services/fundManager
 * @description 提供用户关注基金的增删改查功能
 * 
 * 架构优化说明：
 * 1. 使用持久化缓存减少重复请求
 * 2. 单只基金详情独立缓存
 * 3. 增量更新代替全量重载
 * 4. 通过 fundService 获取数据（解耦 apiClient 直接依赖）
 * 5. 净值更新采用异步非阻塞模式
 */

import type { UserFund, FundUpdateData, FundQueryOptions } from '@/types/fund';
import { FundStatus, FundType } from '@/types/fund';
import { storage, StorageKey } from './storage';
import { navService } from './navService';
import { fundService } from './fundService';
import { cache } from './cache';
import { persistentCache } from './persistentCache';

export type { FundUpdateData, FundQueryOptions };

/**
 * 基金净值更新事件
 */
export interface NavUpdateEvent {
  code: string;
  nav: any;
  timestamp: string;
}

/**
 * 基金净值更新回调
 */
export type NavUpdateCallback = (event: NavUpdateEvent) => void;

/**
 * 基金管理类
 */
export class FundManager {
  private funds: Map<string, UserFund>;
  private navUpdateCallbacks: Set<NavUpdateCallback>;

  constructor() {
    this.funds = new Map();
    this.navUpdateCallbacks = new Set();
    this.loadFromStorage();
  }

  onNavUpdate(callback: NavUpdateCallback): () => void {
    this.navUpdateCallbacks.add(callback);
    return () => this.navUpdateCallbacks.delete(callback);
  }

  private notifyNavUpdate(event: NavUpdateEvent): void {
    this.navUpdateCallbacks.forEach(cb => cb(event));
  }

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

  private saveToStorage(): void {
    try {
      const fundsArray = Array.from(this.funds.values());
      storage.set(StorageKey.USER_FUNDS, fundsArray);
    } catch (error) {
      console.error('[FundManager] 保存基金数据失败:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async addFund(
    code: string,
    remark?: string,
    holdShares?: number,
    costPrice?: number
  ): Promise<UserFund | null> {
    if (this.funds.has(code)) {
      console.warn(`[FundManager] 基金 ${code} 已存在`);
      return null;
    }

    try {
      const fundInfo = await this.getFundInfo(code);

      if (!fundInfo) {
        console.error(`[FundManager] 未找到基金 ${code}`);
        return null;
      }

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
      this.fetchLatestNav(code).catch(console.error);
      
      return userFund;
    } catch (error) {
      console.error(`[FundManager] 添加基金 ${code} 失败:`, error);
      return null;
    }
  }

  private async getFundInfo(code: string): Promise<{
    code: string;
    name: string;
    latestNav?: {
      unitNav: number;
      cumulativeNav: number;
      date: string;
      dailyGrowthRate: number;
    };
  } | null> {
    const singleCached = persistentCache.get<{
      code: string;
      name: string;
      latestNav?: any;
    }>(`fund_${code}`);
    if (singleCached) {
      console.log(`[FundManager] 从持久化缓存获取基金${code}信息`);
      return singleCached;
    }
    
    const memCached = cache.get<{
      code: string;
      name: string;
      latestNav?: any;
    }>(`fund_${code}`);
    if (memCached) {
      console.log(`[FundManager] 从内存缓存获取基金${code}信息`);
      return memCached;
    }
    
    try {
      console.log(`[FundManager] 通过 fundService 获取基金${code}信息`);
      const allFunds = await fundService.getOpenFundList();
      const fund = allFunds.find(f => f.code === code);
      
      if (!fund) {
        console.warn(`[FundManager] 未找到基金${code}`);
        return null;
      }
      
      const result = {
        code: fund.code,
        name: fund.name,
        latestNav: {
          unitNav: fund.unitNav,
          cumulativeNav: fund.cumulativeNav,
          date: new Date().toISOString().split('T')[0],
          dailyGrowthRate: fund.dailyGrowthRate
        }
      };
      
      cache.set(`fund_${code}`, result, 30 * 60 * 1000);
      persistentCache.set(`fund_${code}`, result);
      
      return result;
    } catch (error) {
      console.error(`[FundManager] 获取基金${code}信息失败:`, error);
      return null;
    }
  }

  private async fetchLatestNav(code: string): Promise<void> {
    try {
      const cachedNav = cache.get<any>(`nav_${code}`);
      if (cachedNav) {
        console.log(`[FundManager] 从缓存获取基金${code}净值`);
        this.updateFundNav(code, cachedNav);
        return;
      }

      const latestNav = await navService.getLatestNav(code);
      if (latestNav) {
        cache.set(`nav_${code}`, latestNav, 60 * 60 * 1000);
        this.updateFundNav(code, latestNav);
      }
    } catch (error) {
      console.error(`[FundManager] 异步获取基金${code}净值失败:`, error);
    }
  }

  private updateFundNav(code: string, nav: any): void {
    const fund = this.funds.get(code);
    if (fund) {
      fund.latestNav = nav;
      fund.lastUpdated = new Date().toISOString();
      this.funds.set(code, fund);
      this.saveToStorage();
      
      this.notifyNavUpdate({
        code,
        nav,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[FundManager] 已更新基金${code}净值`);
    }
  }

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

  getAllFunds(): UserFund[] {
    return Array.from(this.funds.values());
  }

  getFundByCode(code: string): UserFund | undefined {
    return this.funds.get(code);
  }

  getFundById(id: string): UserFund | undefined {
    return Array.from(this.funds.values()).find(f => f.id === id);
  }

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

  async refreshFundNav(code: string): Promise<UserFund | null> {
    const fund = this.funds.get(code);
    if (!fund) {
      console.warn(`[FundManager] 基金 ${code} 不存在`);
      return null;
    }

    try {
      const cachedNav = cache.get<any>(`nav_${code}`);
      if (cachedNav) {
        console.log(`[FundManager] 从缓存获取基金${code}净值`);
        fund.latestNav = cachedNav;
        this.funds.set(code, fund);
        this.saveToStorage();
        return fund;
      }
      
      const latestNav = await navService.getLatestNav(code);
      if (latestNav) {
        cache.set(`nav_${code}`, latestNav, 60 * 60 * 1000);
        fund.latestNav = latestNav;
        fund.lastUpdated = new Date().toISOString();
        this.funds.set(code, fund);
        this.saveToStorage();
        return fund;
      }
      return null;
    } catch (error) {
      console.error(`[FundManager] 刷新基金${code}净值失败:`, error);
      return null;
    }
  }

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

  getFundCount(): number {
    return this.funds.size;
  }

  hasFund(code: string): boolean {
    return this.funds.has(code);
  }

  exportData(): string {
    const data = {
      funds: this.getAllFunds(),
      exportTime: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

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

  clearAllFunds(): boolean {
    try {
      this.funds.clear();
      this.saveToStorage();
      console.log('[FundManager] 已清空所有基金数据');
      return true;
    } catch (error) {
      console.error('[FundManager] 清空基金数据失败:', error);
      return false;
    }
  }
}

/**
 * 默认基金管理实例
 */
export const fundManager = new FundManager();
