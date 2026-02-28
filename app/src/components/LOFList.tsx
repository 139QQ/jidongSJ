/**
 * LOF 基金列表组件
 * @module components/LOFList
 * @description 展示 LOF 基金实时行情数据
 */

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import type { LOFRealtime } from '@/types/fund';
import { getAllLOFRealtime, getLOFRealtime } from '@/services/fundInfoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { ErrorAlert } from './ErrorAlert';
import { LoadingSpinner } from './LoadingSpinner';
import { toast } from 'sonner';

/** LOF 基金行组件 */
interface LOFRowProps {
  fund: LOFRealtime;
  loading: boolean;
  onRefresh: (code: string) => void;
}

const LOFRow = memo<LOFRowProps>(({ fund, loading, onRefresh }) => {
  const isUp = fund.changeRate >= 0;
  const ProfitIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{fund.name}</span>
          <Badge variant="secondary" className="text-xs">{fund.code}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {fund.latestPrice.toFixed(3)}
      </TableCell>
      <TableCell className="text-right font-medium">
        <div className="flex items-center justify-end gap-1">
          <ProfitIcon className="w-3 h-3" />
          {isUp ? '+' : ''}{fund.changeRate.toFixed(2)}%
        </div>
      </TableCell>
      <TableCell className="text-right">
        {isUp ? '+' : ''}{fund.changeValue.toFixed(3)}
      </TableCell>
      <TableCell className="text-right">{fund.volume.toLocaleString()}</TableCell>
      <TableCell className="text-right">¥{(fund.amount / 10000).toFixed(2)}万</TableCell>
      <TableCell className="text-right">{fund.premiumRate.toFixed(2)}%</TableCell>
      <TableCell className="text-right">{fund.unitNav?.toFixed(4) || '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onRefresh(fund.code)}
            disabled={loading}
            className="w-8 h-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.open(`https://fund.eastmoney.com/${fund.code}.html`, '_blank')}
            className="w-8 h-8"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

LOFRow.displayName = 'LOFRow';

/** LOF 基金列表组件 */
export function LOFList() {
  const [lofFunds, setLofFunds] = useState<LOFRealtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshingCode, setRefreshingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadLOFFunds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllLOFRealtime();
      setLofFunds(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载失败';
      setError(errorMsg);
      toast.error('加载 LOF 基金失败：' + errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSingleFund = useCallback(async (code: string) => {
    try {
      setRefreshingCode(code);
      const data = await getLOFRealtime(code);
      setLofFunds(prev => prev.map(f => f.code === code ? data : f).filter(Boolean) as LOFRealtime[]);
      toast.success(`已刷新：${data?.name || code}`);
    } catch (err) {
      toast.error('刷新失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setRefreshingCode(null);
    }
  }, []);

  useEffect(() => {
    loadLOFFunds();
  }, [loadLOFFunds]);

  const filteredFunds = useMemo(() => {
    if (!searchKeyword) return lofFunds;
    const keyword = searchKeyword.toLowerCase();
    return lofFunds.filter(fund => 
      fund.code.includes(keyword) || 
      fund.name.toLowerCase().includes(keyword)
    );
  }, [searchKeyword, lofFunds]);

  const handleRefresh = useCallback((code?: string) => {
    if (code) {
      refreshSingleFund(code);
    } else {
      loadLOFFunds();
    }
  }, [loadLOFFunds, refreshSingleFund]);

  if (loading && lofFunds.length === 0) {
    return <LoadingSpinner message="正在加载 LOF 基金数据..." />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <ErrorAlert 
          message={error} 
          onRetry={() => handleRefresh()}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">LOF 基金实时行情</CardTitle>
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
            <Button 
              variant="outline" 
              onClick={() => handleRefresh()}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新全部
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>基金名称</TableHead>
                  <TableHead className="text-right">最新价</TableHead>
                  <TableHead className="text-right">涨跌幅</TableHead>
                  <TableHead className="text-right">涨跌额</TableHead>
                  <TableHead className="text-right">成交量 (手)</TableHead>
                  <TableHead className="text-right">成交额</TableHead>
                  <TableHead className="text-right">溢价率</TableHead>
                  <TableHead className="text-right">单位净值</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {searchKeyword ? '没有找到匹配的基金' : '暂无 LOF 基金数据'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFunds.map((fund) => (
                    <LOFRow
                      key={fund.code}
                      fund={fund}
                      loading={refreshingCode === fund.code}
                      onRefresh={handleRefresh}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
