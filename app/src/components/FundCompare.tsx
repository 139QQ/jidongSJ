/**
 * 基金对比组件
 * @module components/FundCompare
 * @description 支持多只基金收益率对比
 * 
 * 优化说明：
 * 1. 使用项目统一的 API 客户端获取数据
 * 2. 添加完整的收益率数据展示
 * 3. 改进图表展示效果
 */

import { useState, useCallback, useMemo } from 'react';
import type { FundRank } from '@/types/fund';
import { getFundRank } from '@/services/fundService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Search, Plus, X, TrendingUp } from 'lucide-react';
import { ErrorAlert } from './ErrorAlert';
import { toast } from 'sonner';

/** 对比基金数据 */
interface CompareFund {
  code: string;
  name: string;
  rankData?: FundRank;
}

/** 基金对比组件 */
export function FundCompare() {
  const [compareFunds, setCompareFunds] = useState<CompareFund[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 添加对比基金 */
  const addCompareFund = useCallback(async (code: string) => {
    if (!code) return;
    if (compareFunds.find(f => f.code === code)) {
      toast.warning('该基金已在对比列表中');
      return;
    }
    if (compareFunds.length >= 4) {
      toast.warning('最多支持 4 只基金对比');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getFundRank(code);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('未找到该基金');
      }

      // getFundRank 返回的是数组，取第一个匹配结果
      const fundData = data[0];

      setCompareFunds(prev => [...prev, {
        code,
        name: fundData.name || `基金${code}`,
        rankData: fundData
      }]);

      toast.success(`已添加 ${fundData.name} 到对比`);
      setSearchCode('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '添加失败';
      setError(errorMsg);
      toast.error('添加失败：' + errorMsg);
    } finally {
      setLoading(false);
    }
  }, [compareFunds]);

  /** 移除对比基金 */
  const removeCompareFund = useCallback((code: string) => {
    setCompareFunds(prev => prev.filter(f => f.code !== code));
    toast.success('已移除对比');
  }, []);

  /** 处理搜索提交 */
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    addCompareFund(searchCode.trim());
  }, [searchCode, addCompareFund]);

  /** 图表数据 */
  const chartData = useMemo(() => {
    return compareFunds.map(fund => ({
      name: fund.name,
      code: fund.code,
      day1: fund.rankData?.dailyGrowthRate || 0,
      week1: fund.rankData?.week1 || 0,
      month1: fund.rankData?.month1 || 0,
      month3: fund.rankData?.month3 || 0,
      month6: fund.rankData?.month6 || 0,
      year1: fund.rankData?.year1 || 0,
    }));
  }, [compareFunds]);

  /** 图表线条颜色 */
  const colors = ['#007bff', '#dc3545', '#28a745', '#ffc107'];

  return (
    <div className="space-y-4">
      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      {/* 搜索添加区域 */}
      <Card>
        <CardHeader>
          <CardTitle>基金对比</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="输入基金代码添加对比..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="pl-10"
                disabled={loading || compareFunds.length >= 4}
              />
            </div>
            <Button type="submit" disabled={loading || compareFunds.length >= 4}>
              <Plus className="w-4 h-4 mr-2" />
              添加
            </Button>
          </form>

          {/* 已添加的基金 */}
          {compareFunds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {compareFunds.map(fund => (
                <Badge key={fund.code} variant="secondary" className="px-3 py-1">
                  <span className="font-medium">{fund.name}</span>
                  <span className="ml-2 text-xs">{fund.code}</span>
                  <button
                    onClick={() => removeCompareFund(fund.code)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {compareFunds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>添加基金代码开始对比</p>
            <p className="text-sm mt-2">最多支持 4 只基金同时对比</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>收益对比</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 收益率对比图表 */}
            <div className="h-[300px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="day1" name="日增长率" stroke={colors[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="month1" name="近 1 月" stroke={colors[1]} strokeWidth={2} />
                  <Line type="monotone" dataKey="month3" name="近 3 月" stroke={colors[2]} strokeWidth={2} />
                  <Line type="monotone" dataKey="year1" name="近 1 年" stroke={colors[3]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 收益数据表格 */}
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">基金</th>
                    <th className="p-3 text-right">单位净值</th>
                    <th className="p-3 text-right">日增长率</th>
                    <th className="p-3 text-right">近 1 月</th>
                    <th className="p-3 text-right">近 3 月</th>
                    <th className="p-3 text-right">近 1 年</th>
                  </tr>
                </thead>
                <tbody>
                  {compareFunds.map(fund => {
                    const data = fund.rankData;
                    return (
                      <tr key={fund.code} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{fund.name}</div>
                          <div className="text-xs text-muted-foreground">{fund.code}</div>
                        </td>
                        <td className="p-3 text-right font-medium">{data?.unitNav?.toFixed(4)}</td>
                        <td className={`p-3 text-right font-medium ${data?.dailyGrowthRate! >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {data?.dailyGrowthRate?.toFixed(2)}%
                        </td>
                        <td className={`p-3 text-right font-medium ${data?.month1! >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {data?.month1?.toFixed(2)}%
                        </td>
                        <td className={`p-3 text-right font-medium ${data?.month3! >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {data?.month3?.toFixed(2)}%
                        </td>
                        <td className={`p-3 text-right font-medium ${data?.year1! >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {data?.year1?.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
