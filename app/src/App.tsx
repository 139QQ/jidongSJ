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
import { LOFList } from '@/components/LOFList';
import { ETFList } from '@/components/ETFList';
import { DividendList } from '@/components/DividendList';
import { FundCompare } from '@/components/FundCompare';
import { useFundManager } from '@/hooks/useFundManager';
import { useNavHistory } from '@/hooks/useNavHistory';
import { ErrorAlert } from '@/components/ErrorAlert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
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
  PieChart,
  FileText,
  Gift
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
    '1月'
  );

  // 刷新所有数据
  const handleRefreshAll = async () => {
    try {
      toast.info('正在刷新数据...');
      await refreshNav();
      toast.success('数据刷新完成');
    } catch (err) {
      toast.error('刷新失败: ' + (err instanceof Error ? err.message : '未知错误'));
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

        {/* 资产卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">关注基金</p>
                  <p className="text-3xl font-bold">{funds.length}</p>
                </div>
                <List className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总收益</p>
                  <p className={`text-3xl font-bold ${assets.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {assets.totalProfit >= 0 ? '+' : ''}¥{assets.totalProfit.toFixed(0)}
                  </p>
                </div>
                {assets.totalProfit >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-red-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">盈利基金</p>
                  <p className="text-3xl font-bold text-red-500">{profitFunds.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">亏损基金</p>
                  <p className="text-3xl font-bold text-green-500">{lossFunds.length}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 资产概览和净值走势 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {firstFundCode ? `${funds[0]?.name} 净值走势` : '净值走势'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
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
        </div>

        {/* 最近更新的基金 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近更新</CardTitle>
          </CardHeader>
          <CardContent>
            {funds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无基金，请前往"我的基金"页面添加
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funds.slice(0, 6).map((fund) => (
                  <Card key={fund.code} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium truncate max-w-[150px]">{fund.name}</p>
                          <p className="text-xs text-muted-foreground">{fund.code}</p>
                        </div>
                        {fund.latestNav && (
                          <div className="text-right">
                            <p className="font-bold">{fund.latestNav.unitNav.toFixed(4)}</p>
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

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 lg:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">仪表盘</span>
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">我的基金</span>
            </TabsTrigger>
            <TabsTrigger value="rank" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">排行</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">设置</span>
            </TabsTrigger>
          </TabsList>
          
          {/* 第二行 Tabs - 新增功能 */}
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 lg:w-auto">
            <TabsTrigger value="lof" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>LOF 基金</span>
            </TabsTrigger>
            <TabsTrigger value="etf" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>ETF 基金</span>
            </TabsTrigger>
            <TabsTrigger value="dividend" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span>分红送配</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>基金对比</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>文档</span>
            </TabsTrigger>
          </TabsList>

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
          
          <TabsContent value="lof" className="mt-6">
            <LOFList />
          </TabsContent>
          
          <TabsContent value="etf" className="mt-6">
            <ETFList />
          </TabsContent>
          
          <TabsContent value="dividend" className="mt-6">
            <DividendList />
          </TabsContent>
          
          <TabsContent value="compare" className="mt-6">
            <FundCompare />
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>文档中心</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">API 文档</h3>
                      <p className="text-sm text-muted-foreground mb-4">查看完整的 API 接口说明</p>
                      <a href="/docs/API_REFERENCE.md" className="text-primary hover:underline">查看 API 参考</a>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">架构文档</h3>
                      <p className="text-sm text-muted-foreground mb-4">了解系统架构和设计</p>
                      <a href="/docs/ARCHITECTURE.md" className="text-primary hover:underline">查看架构说明</a>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">开发计划</h3>
                      <p className="text-sm text-muted-foreground mb-4">查看项目开发计划和进度</p>
                      <a href="/docs/DEVELOPMENT_PLAN.md" className="text-primary hover:underline">查看开发计划</a>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
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
