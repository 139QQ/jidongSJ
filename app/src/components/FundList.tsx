/**
 * 基金列表组件
 * @module components/FundList
 * @description 展示用户关注的基金列表，支持增删改查操作
 */

import { useState } from 'react';
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

  // 过滤基金
  const filteredFunds = searchKeyword 
    ? queryFunds({ keyword: searchKeyword })
    : funds;

  // 处理添加基金
  const handleAddFund = async (code: string, name: string) => {
    try {
      const success = await addFund(code, name);
      if (success) {
        setIsSearchOpen(false);
        toast.success(`成功添加基金: ${name}`);
      } else {
        toast.error('添加基金失败，基金可能不存在或已添加');
      }
      return success;
    } catch (err) {
      toast.error('添加基金失败: ' + (err instanceof Error ? err.message : '未知错误'));
      return false;
    }
  };

  // 处理删除基金
  const handleDeleteFund = (code: string) => {
    if (confirm('确定要删除这只基金吗？')) {
      try {
        deleteFund(code);
        toast.success('基金已删除');
      } catch (err) {
        toast.error('删除失败: ' + (err instanceof Error ? err.message : '未知错误'));
      }
    }
  };

  // 处理刷新净值
  const handleRefreshNav = async (code?: string) => {
    try {
      toast.info(code ? '正在刷新基金净值...' : '正在刷新所有基金净值...');
      await refreshNav(code);
      toast.success('净值刷新完成');
    } catch (err) {
      toast.error('刷新失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 打开基金详情
  const openFundDetail = (fund: UserFund) => {
    setSelectedFund(fund);
    setIsDetailOpen(true);
  };

  // 计算收益颜色
  const getProfitColor = (profitRate: number) => {
    return profitRate >= 0 ? 'text-red-500' : 'text-green-500';
  };

  // 计算收益图标
  const getProfitIcon = (profitRate: number) => {
    return profitRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

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

      {/* 资产概览 */}
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
              <div className={`text-xl font-bold ${getProfitColor(assets.totalProfitRate)}`}>
                {assets.totalProfit >= 0 ? '+' : ''}¥{assets.totalProfit.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">收益率</div>
              <div className={`text-xl font-bold flex items-center justify-center gap-1 ${getProfitColor(assets.totalProfitRate)}`}>
                {getProfitIcon(assets.totalProfitRate)}
                {assets.totalProfitRate >= 0 ? '+' : ''}{assets.totalProfitRate.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {filteredFunds.map((fund) => {
                const hasHoldings = fund.holdShares && fund.costPrice;
                const holdShares = fund.holdShares || 0;
                const costPrice = fund.costPrice || 0;
                const currentValue = hasHoldings && fund.latestNav 
                  ? holdShares * fund.latestNav.unitNav 
                  : 0;
                const costValue = hasHoldings ? holdShares * costPrice : 0;
                const profit = currentValue - costValue;
                const profitRate = costValue > 0 ? (profit / costValue) * 100 : 0;

                return (
                  <div 
                    key={fund.code}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openFundDetail(fund)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fund.name}</span>
                        <Badge variant="secondary" className="text-xs">{fund.code}</Badge>
                        <Badge variant="outline" className="text-xs">{fund.type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {fund.latestNav ? (
                          <span>净值: {fund.latestNav.unitNav.toFixed(4)} ({fund.latestNav.date})</span>
                        ) : (
                          <span>暂无净值数据</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right mr-4">
                      {hasHoldings ? (
                        <>
                          <div className="font-medium">{fund.holdShares} 份</div>
                          <div className="text-sm text-muted-foreground">
                            成本: ¥{fund.costPrice?.toFixed(4)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">未持有</div>
                      )}
                    </div>

                    {hasHoldings && (
                      <div className={`text-right mr-4 ${getProfitColor(profitRate)}`}>
                        <div className="font-medium flex items-center justify-end gap-1">
                          {getProfitIcon(profitRate)}
                          {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)}
                        </div>
                        <div className="text-sm">
                          {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshNav(fund.code);
                        }}
                        disabled={loading}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFund(fund.code);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
