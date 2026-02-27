/**
 * 基金信息服务模块
 * @module services/fundInfoService
 * @description 提供基金概况、费率、持仓、公告等详细信息查询服务
 */

import { apiClient } from './apiClient';
import type { 
  FundOverview, 
  FundFee, 
  FundPortfolio, 
  FundAnnouncement,
  FundRating,
  FundManagerInfo
} from '@/types/fund';

/**
 * 获取基金概况信息
 * @param code - 基金代码
 * @returns 基金概况数据
 */
export async function getFundOverview(code: string): Promise<FundOverview | null> {
  try {
    const result = await apiClient.get('fund_overview_em', { symbol: code }) as any[];
    if (result && Array.isArray(result) && result.length > 0) {
      const data = result[0];
      return {
        fundFullName: data['基金全称'] || '',
        fundShortName: data['基金简称'] || '',
        fundCode: data['基金代码'] || code,
        fundType: data['基金类型'] || '未知',
        issueDate: data['发行日期'] || '',
        establishDate: data['成立日期/规模']?.split('/')[0] || '',
        establishScale: data['成立日期/规模']?.split('/')[1] || '',
        assetScale: data['资产规模'] || '',
        shareScale: data['份额规模'] || '',
        fundManager: data['基金管理人'] || '',
        fundTrustee: data['基金托管人'] || '',
        fundDirectors: data['基金经理人'] || '',
        totalDividend: data['成立来分红'] || '',
        managementFee: data['管理费率'] || '',
        trusteeFee: data['托管费率'] || '',
        salesServiceFee: data['销售服务费率'] || '',
        maxSubscriptionFee: data['最高认购费率'] || '',
        benchmark: data['业绩比较基准'] || '',
        trackingTarget: data['跟踪标的'] || ''
      };
    }
    return null;
  } catch (error) {
    console.error('获取基金概况失败:', error);
    return null;
  }
}

/**
 * 获取基金费率信息
 * @param code - 基金代码
 * @param indicator - 费率类型
 * @returns 基金费率数据
 */
export async function getFundFee(
  code: string, 
  indicator: string = '申购费率'
): Promise<FundFee[]> {
  try {
    const result = await apiClient.get('fund_fee_em', { 
      symbol: code, 
      indicator 
    }) as any[];
    if (result && Array.isArray(result)) {
      return result.map((item: any) => ({
        feeType: item['费用类型'] || '',
        condition: item['条件或名称'] || '',
        fee: Number(item['费用']) || 0,
        originalFee: item['原费率'] || '',
        discountedFee: item['天天基金优惠费率'] || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('获取基金费率失败:', error);
    return [];
  }
}

/**
 * 获取基金持仓信息
 * @param code - 基金代码
 * @param date - 年份 (如"2024")
 * @returns 基金持仓数据
 */
export async function getFundPortfolio(
  code: string, 
  date: string = new Date().getFullYear().toString()
): Promise<FundPortfolio> {
  try {
    // 获取股票持仓
    const stockHoldings = await apiClient.get('fund_portfolio_hold_em', { 
      symbol: code, 
      date 
    }) as any[];
    
    // 获取债券持仓
    const bondHoldings = await apiClient.get('fund_portfolio_bond_hold_em', { 
      symbol: code, 
      date 
    }) as any[];
    
    // 获取行业配置
    const industryAllocation = await apiClient.get('fund_portfolio_industry_allocation_em', { 
      symbol: code, 
      date 
    }) as any[];

    return {
      stockHoldings: (stockHoldings || []).map((item: any) => ({
        stockCode: item['股票代码'] || '',
        stockName: item['股票名称'] || '',
        netValueRatio: Number(item['占净值比例']) || 0,
        shares: Number(item['持股数 (万股)']) || Number(item['持股数']) || 0,
        marketValue: Number(item['持仓市值 (万元)']) || Number(item['持仓市值']) || 0,
        quarter: item['季度'] || ''
      })),
      bondHoldings: (bondHoldings || []).map((item: any) => ({
        bondCode: item['债券代码'] || '',
        bondName: item['债券名称'] || '',
        netValueRatio: Number(item['占净值比例']) || 0,
        marketValue: Number(item['持仓市值 (万元)']) || Number(item['持仓市值']) || 0,
        quarter: item['季度'] || ''
      })),
      industryAllocation: (industryAllocation || []).map((item: any) => ({
        industry: item['行业类别'] || '',
        netValueRatio: Number(item['占净值比例']) || 0,
        marketValue: Number(item['市值']) || 0,
        date: item['截止时间'] || ''
      }))
    };
  } catch (error) {
    console.error('获取基金持仓失败:', error);
    return {
      stockHoldings: [],
      bondHoldings: [],
      industryAllocation: []
    };
  }
}

/**
 * 获取基金分红公告
 * @param code - 基金代码
 * @returns 基金分红公告列表
 */
export async function getFundDividendAnnouncements(code: string): Promise<FundAnnouncement[]> {
  try {
    const result = await apiClient.get('fund_announcement_dividend_em', { symbol: code }) as any[];
    if (result && Array.isArray(result)) {
      return result.map((item: any) => ({
        fundCode: item['基金代码'] || code,
        title: item['公告标题'] || '',
        fundName: item['基金名称'] || '',
        publishDate: item['公告日期'] || '',
        reportId: item['报告 ID'] || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('获取基金分红公告失败:', error);
    return [];
  }
}

/**
 * 获取基金定期报告
 * @param code - 基金代码
 * @returns 基金定期报告列表
 */
export async function getFundReports(code: string): Promise<FundAnnouncement[]> {
  try {
    const result = await apiClient.get('fund_announcement_report_em', { symbol: code }) as any[];
    if (result && Array.isArray(result)) {
      return result.map((item: any) => ({
        fundCode: item['基金代码'] || code,
        title: item['公告标题'] || '',
        fundName: item['基金名称'] || '',
        publishDate: item['公告日期'] || '',
        reportId: item['报告 ID'] || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('获取基金定期报告失败:', error);
    return [];
  }
}

/**
 * 获取基金人事公告
 * @param code - 基金代码
 * @returns 基金人事公告列表
 */
export async function getFundPersonnelAnnouncements(code: string): Promise<FundAnnouncement[]> {
  try {
    const result = await apiClient.get('fund_announcement_personnel_em', { symbol: code }) as any[];
    if (result && Array.isArray(result)) {
      return result.map((item: any) => ({
        fundCode: item['基金代码'] || code,
        title: item['公告标题'] || '',
        fundName: item['基金名称'] || '',
        publishDate: item['公告日期'] || '',
        reportId: item['报告 ID'] || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('获取基金人事公告失败:', error);
    return [];
  }
}

/**
 * 获取基金评级信息
 * @param code - 基金代码
 * @returns 基金评级数据
 */
export async function getFundRating(code: string): Promise<FundRating | null> {
  try {
    // 获取所有基金评级数据
    const result = await apiClient.get('fund_rating_all') as any[];
    if (result && Array.isArray(result)) {
      const fundRating = result.find((item: any) => item['代码'] === code);
      if (fundRating) {
        return {
          fundCode: fundRating['代码'] || code,
          fundName: fundRating['简称'] || '',
          fundManager: fundRating['基金经理'] || '',
          fundCompany: fundRating['基金公司'] || '',
          fiveStarCount: Number(fundRating['5 星评级家数']) || 0,
          shanghaiRating: Number(fundRating['上海证券']) || 0,
          zheshangRating: Number(fundRating['招商证券']) || 0,
          jianRating: Number(fundRating['济安金信']) || 0,
          fee: Number(fundRating['手续费']) || 0,
          type: fundRating['类型'] || ''
        };
      }
    }
    return null;
  } catch (error) {
    console.error('获取基金评级失败:', error);
    return null;
  }
}

/**
 * 获取基金经理信息
 * @param code - 基金代码
 * @returns 基金经理信息列表
 */
export async function getFundManagers(code: string): Promise<FundManagerInfo[]> {
  try {
    // 首先获取基金概况获取基金经理名字
    const overview = await getFundOverview(code);
    if (!overview || !overview.fundDirectors) {
      return [];
    }

    // 获取所有基金经理数据
    const result = await apiClient.get('fund_manager_em') as any[];
    if (result && Array.isArray(result)) {
      const directors = overview.fundDirectors.split(/[,,]/).map((name: string) => name.trim());
      const managerInfos = result
        .filter((item: any) => 
          directors.some((name: string) => item['姓名']?.includes(name))
        )
        .map((item: any) => ({
          name: item['姓名'] || '',
          company: item['所属公司'] || '',
          fundCode: item['现任基金代码'] || '',
          fundName: item['现任基金'] || '',
          workDays: Number(item['累计从业时间']) || 0,
          totalScale: Number(item['现任基金资产总规模']) || 0,
          bestReturn: Number(item['现任基金最佳回报']) || 0
        }));
      return managerInfos;
    }
    return [];
  } catch (error) {
    console.error('获取基金经理信息失败:', error);
    return [];
  }
}

/**
 * 基金信息服务导出对象
 */
export const fundInfoService = {
  getFundOverview,
  getFundFee,
  getFundPortfolio,
  getFundDividendAnnouncements,
  getFundReports,
  getFundPersonnelAnnouncements,
  getFundRating,
  getFundManagers
};
