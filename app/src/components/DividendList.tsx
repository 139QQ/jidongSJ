/**
 * 基金分红送配列表组件
 * @module components/DividendList
 * @description 展示基金分红和拆分信息
 */

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import type { FundDividend, FundSplit } from '@/types/fund';
import { getFundDividends, getFundSplits } from '@/services/fundInfoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, Gift, Split } from 'lucide-react';
import { ErrorAlert } from './ErrorAlert';
import { LoadingSpinner } from './LoadingSpinner';
import { toast } from 'sonner';

/** 分红记录行组件 */
interface DividendRowProps {
  dividend: FundDividend;
}

const DividendRow = memo<DividendRowProps>(({ dividend }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{dividend.fundName}</span>
          <Badge variant="secondary" className="text-xs">{dividend.fundCode}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium text-red-500">
        ¥{dividend.dividendPerShare.toFixed(4)}
      </TableCell>
      <TableCell className="text-right">
        {dividend.recordDate}
      </TableCell>
      <TableCell className="text-right">
        {dividend.exDividendDate}
      </TableCell>
      <TableCell className="text-right">
        {dividend.dividendPayDate || '-'}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline">{dividend.dividendType}</Badge>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {dividend.totalDividend > 0 ? `¥${(dividend.totalDividend / 10000).toFixed(2)}万` : '-'}
      </TableCell>
    </TableRow>
  );
});

DividendRow.displayName = 'DividendRow';

/** 拆分记录行组件 */
interface SplitRowProps {
  split: FundSplit;
}

const SplitRow = memo<SplitRowProps>(({ split }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{split.fundName}</span>
          <Badge variant="secondary" className="text-xs">{split.fundCode}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {split.announcementDate}
      </TableCell>
      <TableCell className="text-right">
        {split.splitDate}
      </TableCell>
      <TableCell className="text-right font-medium">
        {split.splitRatio.toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {split.preSplitNav?.toFixed(4) || '-'}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {split.postSplitNav?.toFixed(4) || '-'}
      </TableCell>
    </TableRow>
  );
});

SplitRow.displayName = 'SplitRow';

/** 分红送配列表组件 */
export function DividendList() {
  const [dividends, setDividends] = useState<FundDividend[]>([]);
  const [splits, setSplits] = useState<FundSplit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'dividend' | 'split'>('dividend');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'dividend') {
        const data = await getFundDividends('');
        setDividends(data);
      } else {
        const data = await getFundSplits('');
        setSplits(data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载失败';
      setError(errorMsg);
      toast.error('加载数据失败：' + errorMsg);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDividends = useMemo(() => {
    if (!searchKeyword || activeTab !== 'dividend') return dividends;
    const keyword = searchKeyword.toLowerCase();
    return dividends.filter(item => 
      item.fundCode.includes(keyword) || 
      item.fundName.toLowerCase().includes(keyword)
    );
  }, [searchKeyword, dividends, activeTab]);

  const filteredSplits = useMemo(() => {
    if (!searchKeyword || activeTab !== 'split') return splits;
    const keyword = searchKeyword.toLowerCase();
    return splits.filter(item => 
      item.fundCode.includes(keyword) || 
      item.fundName.toLowerCase().includes(keyword)
    );
  }, [searchKeyword, splits, activeTab]);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  if (loading && dividends.length === 0 && splits.length === 0) {
    return <LoadingSpinner message="正在加载分红送配数据..." />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <ErrorAlert 
          message={error} 
          onRetry={handleRefresh}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">基金分红送配</CardTitle>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索基金代码或名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dividend' | 'split')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="dividend" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                基金分红
              </TabsTrigger>
              <TabsTrigger value="split" className="flex items-center gap-2">
                <Split className="w-4 h-4" />
                基金拆分
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dividend">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>基金名称</TableHead>
                      <TableHead className="text-right">每份分红</TableHead>
                      <TableHead className="text-right">权益登记日</TableHead>
                      <TableHead className="text-right">除息交易日</TableHead>
                      <TableHead className="text-right">发放日</TableHead>
                      <TableHead className="text-right">类型</TableHead>
                      <TableHead className="text-right">总额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDividends.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          {searchKeyword ? '没有找到匹配的分红记录' : '暂无分红数据'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDividends.map((dividend, index) => (
                        <DividendRow
                          key={`${dividend.fundCode}-${index}`}
                          dividend={dividend}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="split">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>基金名称</TableHead>
                      <TableHead className="text-right">公告日</TableHead>
                      <TableHead className="text-right">拆分日</TableHead>
                      <TableHead className="text-right">拆分比例</TableHead>
                      <TableHead className="text-right">拆分前净值</TableHead>
                      <TableHead className="text-right">拆分后净值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSplits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          {searchKeyword ? '没有找到匹配的拆分记录' : '暂无拆分数据'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSplits.map((split, index) => (
                        <SplitRow
                          key={`${split.fundCode}-${index}`}
                          split={split}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
