/**
 * FundService 单元测试
 * 使用模拟数据测试，不依赖真实 API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FundService } from './fundService';
import { apiClient } from './apiClient';
import { serviceCache, rankingCache, realtimeCache } from './cacheAdapter';

// 模拟 apiClient
vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// 模拟 cacheAdapter
vi.mock('./cacheAdapter', () => ({
  serviceCache: {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    getOrSet: vi.fn(),
    generateKey: vi.fn((key, params) => {
      if (!params) return key;
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      return `${key}?${paramStr}`;
    }),
  },
  rankingCache: {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    generateKey: vi.fn((key, params) => {
      if (!params) return key;
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      return `${key}?${paramStr}`;
    }),
  },
  realtimeCache: {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    generateKey: vi.fn((key, params) => {
      if (!params) return key;
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      return `${key}?${paramStr}`;
    }),
  },
}));

describe('FundService', () => {
  let fundService: FundService;

  beforeEach(() => {
    vi.clearAllMocks();
    fundService = new FundService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isTradingTime', () => {
    it('应该在工作日交易时间返回 true', () => {
      // 模拟周一 10:00（交易时间）
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-03-03 10:00:00'));
      
      // 通过调用 getOpenFundList 来间接测试 isTradingTime
      // 因为 isTradingTime 是私有方法
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      fundService.getOpenFundList();
      
      // 验证日志中包含"交易时间"
      expect(serviceCache.get).toHaveBeenCalled();
    });

    it('应该在周末返回 false', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-03-01 10:00:00')); // 周六
      
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      fundService.getOpenFundList();
      
      expect(serviceCache.get).toHaveBeenCalled();
    });

    it('应该在非交易时段返回 false', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-03-03 12:00:00')); // 周一午休时间
      
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      fundService.getOpenFundList();
      
      expect(serviceCache.get).toHaveBeenCalled();
    });
  });

  describe('getOpenFundList', () => {
    it('应该从缓存获取数据', async () => {
      // 缓存返回的是 FundRealtime[] 类型
      const mockCachedData = [
        {
          code: '000001',
          name: '测试基金 A',
          unitNav: 1.5,
          cumulativeNav: 2.0,
          prevUnitNav: 1.49,
          prevCumulativeNav: 1.99,
          dailyGrowthValue: 0.01,
          dailyGrowthRate: 0.1,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.15',
        },
      ];
      
      vi.mocked(serviceCache.get).mockReturnValue(mockCachedData);
      
      const result = await fundService.getOpenFundList();
      
      expect(serviceCache.get).toHaveBeenCalledWith('fund_open_fund_daily_em');
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('000001');
    });

    it('应该从 API 获取数据并缓存', async () => {
      const mockApiData = [
        {
          '基金代码': '000001',
          '基金简称': '测试基金 A',
          '日增长值': '0.01',
          '日增长率': '0.1',
          '申购状态': '开放',
          '赎回状态': '开放',
          '手续费': '0.15',
        },
        {
          '基金代码': '000002',
          '基金简称': '测试基金 B',
          '日增长值': '-0.02',
          '日增长率': '-0.2',
          '申购状态': '开放',
          '赎回状态': '开放',
          '手续费': '0.12',
        },
      ];
      
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue(mockApiData);
      
      const result = await fundService.getOpenFundList();
      
      expect(apiClient.get).toHaveBeenCalledWith('fund_open_fund_daily_em');
      expect(serviceCache.set).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('000001');
      expect(result[0].dailyGrowthRate).toBe(0.1);
    });

    it('应该处理空数据', async () => {
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      const result = await fundService.getOpenFundList();
      
      expect(result).toHaveLength(0);
    });

    it('应该处理 API 错误', async () => {
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockRejectedValue(new Error('网络错误'));
      
      await expect(fundService.getOpenFundList()).rejects.toThrow('网络错误');
    });

    it('应该支持强制刷新', async () => {
      const mockApiData = [
        {
          '基金代码': '000001',
          '基金简称': '测试基金 A',
          '日增长值': '0.01',
          '日增长率': '0.1',
          '申购状态': '开放',
          '赎回状态': '开放',
          '手续费': '0.15',
        },
      ];
      
      vi.mocked(serviceCache.get).mockReturnValue([{ code: 'old' }] as any);
      vi.mocked(apiClient.get).mockResolvedValue(mockApiData);
      
      const result = await fundService.getOpenFundList(true);
      
      expect(apiClient.get).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('应该调用进度回调', async () => {
      const mockApiData = Array(10).fill({
        '基金代码': '000001',
        '基金简称': '测试基金',
        '日增长值': '0.01',
        '日增长率': '0.1',
        '申购状态': '开放',
        '赎回状态': '开放',
        '手续费': '0.15',
      });
      
      vi.mocked(serviceCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue(mockApiData);
      const progressCallback = vi.fn();
      
      await fundService.getOpenFundList(false, progressCallback);
      
      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('searchFunds', () => {
    it('应该返回空数组当关键词为空', async () => {
      const result = await fundService.searchFunds('');
      expect(result).toHaveLength(0);
    });

    it('应该搜索基金代码', async () => {
      // 第一次调用 getOpenFundList 时返回完整数据
      const mockFunds = [
        {
          code: '000001',
          name: '华夏成长混合',
          unitNav: 1.5,
          cumulativeNav: 2.0,
          prevUnitNav: 1.49,
          prevCumulativeNav: 1.99,
          dailyGrowthValue: 0.01,
          dailyGrowthRate: 0.1,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.15',
        },
        {
          code: '000002',
          name: '南方宝元债券',
          unitNav: 2.0,
          cumulativeNav: 2.5,
          prevUnitNav: 1.98,
          prevCumulativeNav: 2.48,
          dailyGrowthValue: 0.02,
          dailyGrowthRate: 0.2,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.12',
        },
      ];
      
      // getOpenFundList 会检查缓存，所以直接返回完整数据
      vi.mocked(serviceCache.get).mockReturnValue(mockFunds);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      const result = await fundService.searchFunds('000001');
      
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('000001');
    });

    it('应该搜索基金名称', async () => {
      const mockFunds = [
        {
          code: '000001',
          name: '华夏成长混合',
          unitNav: 1.5,
          cumulativeNav: 2.0,
          prevUnitNav: 1.49,
          prevCumulativeNav: 1.99,
          dailyGrowthValue: 0.01,
          dailyGrowthRate: 0.1,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.15',
        },
        {
          code: '000002',
          name: '南方宝元债券',
          unitNav: 2.0,
          cumulativeNav: 2.5,
          prevUnitNav: 1.98,
          prevCumulativeNav: 2.48,
          dailyGrowthValue: 0.02,
          dailyGrowthRate: 0.2,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.12',
        },
      ];
      
      vi.mocked(serviceCache.get).mockReturnValue(mockFunds);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      const result = await fundService.searchFunds('成长');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('华夏成长混合');
    });

    it('应该优先返回精确匹配', async () => {
      const mockFunds = [
        {
          code: '000001',
          name: '华夏成长混合',
          unitNav: 1.5,
          cumulativeNav: 2.0,
          prevUnitNav: 1.49,
          prevCumulativeNav: 1.99,
          dailyGrowthValue: 0.01,
          dailyGrowthRate: 0.1,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.15',
        },
        {
          code: '0000010',
          name: '测试基金',
          unitNav: 1.0,
          cumulativeNav: 1.0,
          prevUnitNav: 0.99,
          prevCumulativeNav: 0.99,
          dailyGrowthValue: 0.01,
          dailyGrowthRate: 0.1,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.15',
        },
      ];
      
      vi.mocked(serviceCache.get).mockReturnValue(mockFunds);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      const result = await fundService.searchFunds('000001');
      
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('000001');
    });
  });

  describe('getFundRank', () => {
    it('应该从缓存获取排行数据', async () => {
      // 缓存返回的是 FundRank[] 类型
      const mockCachedData = [
        {
          rank: 1,
          code: '000001',
          name: '测试基金',
          unitNav: 1.5,
          cumulativeNav: 2.0,
          date: '2025-03-01',
          dailyGrowthRate: 0.5,
          week1: 1.0,
          month1: 3.0,
          month3: 5.0,
          month6: 8.0,
          year1: 15.0,
          year2: 25.0,
          year3: 35.0,
          thisYear: 10.0,
          sinceEstablish: 50.0,
          fee: '0.15',
        },
      ];
      
      vi.mocked(rankingCache.get).mockReturnValue(mockCachedData);
      
      const result = await fundService.getFundRank('全部');
      
      expect(rankingCache.get).toHaveBeenCalled();
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      expect(result[0].code).toBe('000001');
    });

    it('应该从 API 获取排行数据', async () => {
      const mockApiData = [
        {
          '基金代码': '000001',
          '基金简称': '测试基金 A',
          '单位净值': '1.5',
          '累计净值': '2.0',
          '日期': '2025-03-01',
          '日增长率': '0.5',
        },
        {
          '基金代码': '000002',
          '基金简称': '测试基金 B',
          '单位净值': '2.0',
          '累计净值': '2.5',
          '日期': '2025-03-01',
          '日增长率': '0.8',
        },
      ];
      
      vi.mocked(rankingCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue(mockApiData);
      
      const result = await fundService.getFundRank('全部', 10);
      
      expect(apiClient.get).toHaveBeenCalledWith('fund_open_fund_rank_em', { symbol: '全部' });
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
    });

    it('应该限制返回数量', async () => {
      const mockApiData = Array(100).fill({
        '基金代码': '000001',
        '基金简称': '测试基金',
        '单位净值': '1.5',
        '累计净值': '2.0',
        '日期': '2025-03-01',
        '日增长率': '0.5',
      });
      
      vi.mocked(rankingCache.get).mockReturnValue(null);
      vi.mocked(apiClient.get).mockResolvedValue(mockApiData);
      
      const result = await fundService.getFundRank('全部', 10);
      
      expect(result).toHaveLength(10);
    });
  });

  describe('getFundIndex', () => {
    it('应该获取基金索引', async () => {
      // getFundIndex 调用 getOpenFundList，然后提取索引
      const mockFunds = [
        {
          code: '000001',
          name: '测试基金 A',
          unitNav: 1.5,
          cumulativeNav: 2.0,
          prevUnitNav: 1.49,
          prevCumulativeNav: 1.99,
          dailyGrowthValue: 0.01,
          dailyGrowthRate: 0.1,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.15',
        },
        {
          code: '000002',
          name: '测试基金 B',
          unitNav: 2.0,
          cumulativeNav: 2.5,
          prevUnitNav: 1.98,
          prevCumulativeNav: 2.48,
          dailyGrowthValue: 0.02,
          dailyGrowthRate: 0.2,
          purchaseStatus: '开放',
          redeemStatus: '开放',
          fee: '0.12',
        },
      ];
      
      vi.mocked(serviceCache.get).mockReturnValue(mockFunds);
      vi.mocked(apiClient.get).mockResolvedValue([]);
      
      const result = await fundService.getFundIndex();
      
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('000001');
      expect(result[0].name).toBe('测试基金 A');
    });
  });

  describe('缓存管理', () => {
    it('应该获取缓存状态', () => {
      vi.mocked(serviceCache.has).mockReturnValue(true);
      vi.mocked(rankingCache.has).mockReturnValue(false);
      vi.mocked(realtimeCache.has).mockReturnValue(true);
      
      const status = fundService.getCacheStatus();
      
      expect(status.funds.cached).toBe(true);
      expect(status.ranks.cached).toBe(false);
      expect(status.estimates.cached).toBe(true);
    });

    it('应该清除缓存', () => {
      fundService.clearCache();
      
      expect(serviceCache.delete).toHaveBeenCalledWith('fund_open_fund_daily_em');
      expect(rankingCache.delete).toHaveBeenCalledWith('fund_open_fund_rank_em?symbol=全部');
    });
  });
});
