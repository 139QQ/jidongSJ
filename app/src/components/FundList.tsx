/**
 * 基金列表组件
 * @module components/FundList
 * @description 展示用户关注的基金列表，支持增删改查操作
 * 
 * 优化说明：
 * 1. 使用 React.memo 优化子组件，避免不必要的重渲染
 * 2. 使用 useMemo 缓存计算结果
 * 3. 使用 useCallback 稳定回调函数引用
 */

import { useState, useMemo, useCallback, memo } from 'react';
import type { UserFund } from '@/types/fund';
import { useFundManager } from '@/hooks/useFundManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { FundSearchDialog } from './FundSearchDialog';
import { FundDetailDialog } from './FundDetailDialog';
import { ErrorAlert } from './ErrorAlert';
import { LoadingSpinner } from './LoadingSpinner';
import { toast } from 'sonner';

/** 基金项属性 */
interface FundItemProps {
  fund: UserFund;
  onRefresh: (code: string) => void;
  onDelete: (code: string) => void;
  onDetail: (fund: UserFund) => void;
  loading: boolean;
}

/**
 * 基金项组件 - 使用 React.memo 优化
 * 只在 prop 变化时重新渲染
 */
const FundItem = memo<FundItemProps>(({ fund, onRefresh, onDelete, onDetail, loading }) => {
  // 使用 useMemo 缓存收益计算
  const profitData = useMemo(() => {
    const hasHoldings = fund.holdShares && fund.costPrice;
    const holdShares = fund.holdShares || 0;
    const costPrice = fund.costPrice || 0;
    const currentValue = hasHoldings && fund.latestNav 
      ? holdShares * fund.latestNav.unitNav 
      : 0;
    const costValue = hasHoldings ? holdShares * costPrice : 0;
    const profit = currentValue - costValue;
    const profitRate = costValue > 0 ? (profit / costValue) * 100 : 0;
    return { hasHoldings, holdShares, costPrice, currentValue, costValue, profit, profitRate };
  }, [fund.holdShares, fund.costPrice, fund.latestNav]);

  const getProfitColor = profitData.profitRate >= 0 ? 'text-red-500' : 'text-green-500';
  const ProfitIcon = profitData.profitRate >= 0 ? TrendingUp : TrendingDown;

  return (
    <div 
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onDetail(fund)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{fund.name}</span>
          <Badge variant="secondary" className="text-xs flex-shrink-0">{fund.code}</Badge>
          <Badge variant="outline" className="text-xs flex-shrink-0">{fund.type}</Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-1 truncate">
          {fund.latestNav ? (
            <span>净值：{fund.latestNav.unitNav.toFixed(4)} ({fund.latestNav.date})</span>
          ) : (
            <span>暂无净值数据</span>
          )}
        </div>
      </div>
      
      <div className="text-right mx-4 flex-shrink-0">
        {profitData.hasHoldings ? (
          <>
            <div className="font-medium">{profitData.holdShares} 份</div>
            <div className="text-sm text-muted-foreground">
              成本：¥{profitData.costPrice?.toFixed(4)}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">未持有</div>
        )}
      </div>

      {profitData.hasHoldings && (
        <div className={`text-right w-24 flex-shrink-0 ${getProfitColor}`}>
          <div className="font-medium flex items-center justify-end gap-1">
            <ProfitIcon className="w-4 h-4" />
            {profitData.profit >= 0 ? '+' : ''}¥{profitData.profit.toFixed(2)}
          </div>
          <div className="text-sm">
            {profitData.profitRate >= 0 ? '+' : ''}{profitData.profitRate.toFixed(2)}%
          </div>
        </div>
      )}

      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onRefresh(fund.code)}
          disabled={loading}
          className="w-8 h-8"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onDelete(fund.code)}
          className="w-8 h-8"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
});

FundItem.displayName = 'FundItem';

/**
 * 资产概览组件 - 使用 memo 优化
 */
interface AssetOverviewProps {
  assets: {
    totalCost: number;
    totalValue: number;
    totalProfit: number;
    totalProfitRate: number;
  };
}

const AssetOverview = memo<AssetOverviewProps>(({ assets }) => {
  const getProfitColor = assets.totalProfitRate >= 0 ? 'text-red-500' : 'text-green-500';
  const ProfitIcon = assets.totalProfitRate >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          资产概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">总成本</div>
            <div className="text-xl font-bold">¥{assets.totalCost.toFixed(2)}</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">总市值</div>
            <div className="text-xl font-bold">¥{assets.totalValue.toFixed(2)}</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">总收益</div>
            <div className={`text-xl font-bold ${getProfitColor}`}>
              {assets.totalProfit >= 0 ? '+' : ''}¥{assets.totalProfit.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">收益率</div>
            <div className={`text-xl font-bold flex items-center justify-center gap-1 ${getProfitColor}`}>
              <ProfitIcon className="w-4 h-4" />
              {assets.totalProfitRate >= 0 ? '+' : ''}{assets.totalProfitRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AssetOverview.displayName = 'AssetOverview';

/**
 * 基金列表组件
 */
export function FundList() {
  const { 
    funds, 
    loading, 
    error,
    addFund, 
    deleteFund, 
    updateFund, 
    refreshNav, 
    queryFunds,
    assets 
  } = useFundManager();
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFund, setSelectedFund] = useState<UserFund | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 使用 useMemo 缓存过滤结果
  const filteredFunds = useMemo(() => {
    if (!searchKeyword) return funds;
    return queryFunds({ keyword: searchKeyword });
  }, [searchKeyword, funds, queryFunds]);

  // 使用 useCallback 稳定回调函数
  const handleAddFund = useCallback(async (code: string, name: string) => {
    try {
      const success = await addFund(code, name);
      if (success) {
        setIsSearchOpen(false);
        toast.success(`成功添加基金：${name}`);
      } else {
        toast.error('添加基金失败，基金可能不存在或已添加');
      }
      return success;
    } catch (err) {
      toast.error('添加基金失败：' + (err instanceof Error ? err.message : '未知错误'));
      return false;
    }
  }, [addFund]);

  const handleDeleteFund = useCallback((code: string) => {
    if (confirm('确定要删除这只基金吗？')) {
      try {
        deleteFund(code);
        toast.success('基金已删除');
      } catch (err) {
        toast.error('删除失败：' + (err instanceof Error ? err.message : '未知错误'));
      }
    }
  }, [deleteFund]);

  const handleRefreshNav = useCallback(async (code?: string) => {
    try {
      toast.info(code ? '正在刷新基金净值...' : '正在刷新所有基金净值...');
      await refreshNav(code);
      toast.success('净值刷新完成');
    } catch (err) {
      toast.error('刷新失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  }, [refreshNav]);

  const openFundDetail = useCallback((fund: UserFund) => {
    setSelectedFund(fund);
    setIsDetailOpen(true);
  }, []);

  if (loading && funds.length === 0) {
    return <LoadingSpinner message="正在加载基金数据..." />;
  }

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <ErrorAlert 
          message={error} 
          onRetry={() => window.location.reload()}
        />
      )}

      {/* 资产概览 - 使用优化组件 */}
      <AssetOverview assets={assets} />

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索基金代码或名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleRefreshNav()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新净值
              </Button>
              <Button onClick={() => setIsSearchOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加基金
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 基金列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            我的基金 ({filteredFunds.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFunds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchKeyword ? '没有找到匹配的基金' : '暂无基金，点击"添加基金"开始关注'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFunds.map((fund) => (
                <FundItem
                  key={fund.code}
                  fund={fund}
                  onRefresh={handleRefreshNav}
                  onDelete={handleDeleteFund}
                  onDetail={openFundDetail}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 搜索对话框 */}
      <FundSearchDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen}
        onSelect={handleAddFund}
      />

      {/* 详情对话框 */}
      {selectedFund && (
        <FundDetailDialog
          fund={selectedFund}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onUpdate={(data) => updateFund(selectedFund.code, data)}
        />
      )}
    </div>
  );
}
