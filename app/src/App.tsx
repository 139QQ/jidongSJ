/**
 * 基金数据管理系统 - 主应用组件
 * @module App
 * @description 基金数据获取和管理系统的主入口
 */

import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FundList } from '@/components/FundList';
import { FundRankList } from '@/components/FundRankList';
import { SettingsPanel } from '@/components/SettingsPanel';
import { NavChart } from '@/components/NavChart';
import { SpecialTopics } from '@/components/SpecialTopics';
import { ToolsPanel } from '@/components/ToolsPanel';
import { useFundManager } from '@/hooks/useFundManager';
import { useNavHistory } from '@/hooks/useNavHistory';
import { ErrorAlert } from '@/components/ErrorAlert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TradingStatus } from '@/components/TradingStatus';
import { 
  LayoutDashboard, 
  List, 
  TrendingUp, 
  Settings, 
  Database,
  RefreshCw,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart
} from 'lucide-react';
import './App.css';

/**
 * 主应用组件
 */
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { funds, assets, loading, error, refreshNav } = useFundManager();

  // 获取第一只基金的净值历史用于展示
  const firstFundCode = funds[0]?.code;
  const { history: dashboardHistory, loading: historyLoading } = useNavHistory(
    firstFundCode || '',
    '单位净值走势',
    '1 月'
  );

  // 刷新所有数据
  const handleRefreshAll = async () => {
    try {
      toast.info('正在刷新数据...');
      await refreshNav();
      toast.success('数据刷新完成');
    } catch (err) {
      toast.error('刷新失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 渲染仪表盘
  const renderDashboard = () => {
    if (error) {
      return <ErrorAlert message={error} onRetry={() => window.location.reload()} />;
    }

    const profitFunds = funds.filter(f => {
      if (!f.holdShares || !f.costPrice || !f.latestNav) return false;
      return f.latestNav.unitNav > f.costPrice;
    });
    
    const lossFunds = funds.filter(f => {
      if (!f.holdShares || !f.costPrice || !f.latestNav) return false;
      return f.latestNav.unitNav <= f.costPrice;
    });

    return (
      <div className="space-y-6">
        {/* 快捷操作 */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">仪表盘</h2>
          <Button variant="outline" onClick={handleRefreshAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        {/* 资产卡片 - 移动端优化 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">关注基金</p>
                  <p className="text-2xl md:text-3xl font-bold">{funds.length}</p>
                </div>
                <List className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">总收益</p>
                  <p className={`text-xl md:text-3xl font-bold ${assets.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {assets.totalProfit >= 0 ? '+' : ''}¥{assets.totalProfit.toFixed(0)}
                  </p>
                </div>
                {assets.totalProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                ) : (
                  <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">盈利基金</p>
                  <p className="text-xl md:text-3xl font-bold text-red-500">{profitFunds.length}</p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">亏损基金</p>
                  <p className="text-xl md:text-3xl font-bold text-green-500">{lossFunds.length}</p>
                </div>
                <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 交易状态和资产概览 - 移动端优化 */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <TradingStatus />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                资产概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">总成本</span>
                  <span className="text-xl font-bold">¥{assets.totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="text-muted-foreground">总市值</span>
                  <span className="text-xl font-bold">¥{assets.totalValue.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between items-center p-4 bg-muted rounded-lg ${assets.totalProfitRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  <span>收益率</span>
                  <span className="text-xl font-bold">
                    {assets.totalProfitRate >= 0 ? '+' : ''}{assets.totalProfitRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 净值走势 - 移动端优化 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              <span className="truncate">{firstFundCode ? `${funds[0]?.name} 净值走势` : '净值走势'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] md:h-[200px]">
              {firstFundCode ? (
                <NavChart data={dashboardHistory} loading={historyLoading} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  添加基金后查看净值走势
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近更新的基金 - 移动端优化 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">最近更新</CardTitle>
          </CardHeader>
          <CardContent>
            {funds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无基金，请前往"我的基金"页面添加
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {funds.slice(0, 6).map((fund) => (
                  <Card key={fund.code} className="bg-muted/50">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-sm md:text-base">{fund.name}</p>
                          <p className="text-xs text-muted-foreground">{fund.code}</p>
                        </div>
                        {fund.latestNav && (
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-bold text-sm md:text-base">{fund.latestNav.unitNav.toFixed(4)}</p>
                            {fund.latestNav.dailyGrowthRate !== undefined && (
                              <p className={`text-xs ${fund.latestNav.dailyGrowthRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {fund.latestNav.dailyGrowthRate >= 0 ? '+' : ''}{fund.latestNav.dailyGrowthRate.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      {/* 头部 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">基金数据管理系统</h1>
                <p className="text-xs text-muted-foreground">AKShare / AKTools</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">v1.0</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 - 移动端优化 */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* 优化后的 Tabs 导航 - 6 个主功能分组 */}
          <div className="w-full">
            <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6 gap-1 h-auto min-h-[2.5rem]">
              <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-2">
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">仪表盘</span>
                <span className="sm:hidden">仪表</span>
              </TabsTrigger>
              <TabsTrigger value="funds" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-2">
                <List className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">我的基金</span>
                <span className="sm:hidden">基金</span>
              </TabsTrigger>
              <TabsTrigger value="rank" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">排行</span>
                <span className="sm:hidden">排行</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-2">
                <PieChart className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">专题</span>
                <span className="sm:hidden">专题</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-2">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">工具</span>
                <span className="sm:hidden">工具</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-2">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">设置</span>
                <span className="sm:hidden">设置</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-6">
            {loading && funds.length === 0 ? (
              <LoadingSpinner message="正在加载数据..." />
            ) : (
              renderDashboard()
            )}
          </TabsContent>

          <TabsContent value="funds" className="mt-6">
            <FundList />
          </TabsContent>

          <TabsContent value="rank" className="mt-6">
            <FundRankList />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
          
          <TabsContent value="topics" className="mt-6">
            <SpecialTopics />
          </TabsContent>
          
          <TabsContent value="tools" className="mt-6">
            <ToolsPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部 */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>基金数据管理系统 - 基于 AKShare / AKTools 构建</p>
            <p className="mt-1">数据仅供参考，投资有风险，入市需谨慎</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
