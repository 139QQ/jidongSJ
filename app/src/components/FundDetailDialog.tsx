/**
 * 基金详情对话框组件
 * @module components/FundDetailDialog
 * @description 展示基金详情，支持编辑持有信息
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserFund, FundUpdateData, FundOverview, FundFee, FundPortfolio, FundAnnouncement, FundRating, FundManagerInfo } from '@/types/fund';
import { useNavHistory } from '@/hooks/useNavHistory';
import { fundInfoService } from '@/services/fundInfoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, TrendingDown, Save, Edit2, FileText, PieChart, Percent, 
  Award, Users, Bell, RefreshCw, Calendar, AlertCircle, Activity, Wallet
} from 'lucide-react';
import { NavChart } from './NavChart';
import { LoadingSpinner } from './LoadingSpinner';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

/** 组件属性 */
interface FundDetailDialogProps {
  /** 基金数据 */
  fund: UserFund;
  /** 是否打开 */
  open: boolean;
  /** 打开状态改变回调 */
  onOpenChange: (open: boolean) => void;
  /** 更新基金回调 */
  onUpdate: (data: FundUpdateData) => boolean;
}

/** Tab 类型 */
type TabType = 'overview' | 'info' | 'portfolio' | 'chart' | 'history';

/**
 * 小型统计卡片组件
 */
function StatMiniCard({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' }) {
  const colorClass = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : '';
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="text-xs text-muted-foreground mb-1 truncate">{label}</div>
      <div className={`text-base font-bold flex items-center gap-1 ${colorClass}`}>
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

/**
 * 持有信息卡片组件
 */
function HoldingInfoCard({ 
  fund, 
  isEditing, 
  holdShares, 
  setHoldShares, 
  costPrice, 
  setCostPrice 
}: { 
  fund: UserFund; 
  isEditing: boolean;
  holdShares: string;
  setHoldShares: (v: string) => void;
  costPrice: string;
  setCostPrice: (v: string) => void;
}) {
  const profitData = useMemo(() => {
    if (!fund.holdShares || !fund.costPrice || !fund.latestNav) {
      return null;
    }
    const costValue = fund.holdShares * fund.costPrice;
    const currentValue = fund.holdShares * fund.latestNav.unitNav;
    const profit = currentValue - costValue;
    const profitRate = (profit / costValue) * 100;
    return { costValue, currentValue, profit, profitRate };
  }, [fund]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          持有信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">持有份额</Label>
            {isEditing ? (
              <Input
                type="number"
                value={holdShares}
                onChange={(e) => setHoldShares(e.target.value)}
                placeholder="输入持有份额"
                className="h-9"
              />
            ) : (
              <div className="text-lg font-semibold truncate" title={fund.holdShares?.toLocaleString() || '未设置'}>
                {fund.holdShares?.toLocaleString() || '未设置'}
                <span className="text-xs text-muted-foreground ml-1">份</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">成本价</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.0001"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="输入成本价"
                className="h-9"
              />
            ) : (
              <div className="text-lg font-semibold truncate" title={`¥${fund.costPrice?.toFixed(4) || '未设置'}`}>
                ¥{fund.costPrice?.toFixed(4) || '未设置'}
              </div>
            )}
          </div>
        </div>

        {profitData && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <StatMiniCard label="成本金额" value={`¥${profitData.costValue.toFixed(2)}`} />
              <StatMiniCard label="当前市值" value={`¥${profitData.currentValue.toFixed(2)}`} />
              <StatMiniCard 
                label="总收益" 
                value={`${profitData.profit >= 0 ? '+' : ''}¥${profitData.profit.toFixed(2)}`}
                trend={profitData.profit >= 0 ? 'up' : 'down'}
              />
              <StatMiniCard 
                label="收益率" 
                value={`${profitData.profitRate >= 0 ? '+' : ''}${profitData.profitRate.toFixed(2)}%`}
                trend={profitData.profitRate >= 0 ? 'up' : 'down'}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 收益统计卡片组件
 */
function ReturnsCard({ returns }: { returns: { totalReturn: number; annualizedReturn: number; maxDrawdown: number; volatility: number } }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          收益统计（近一年）
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <StatMiniCard label="总收益" value={`${returns.totalReturn >= 0 ? '+' : ''}${returns.totalReturn.toFixed(2)}%`} trend="up" />
        <StatMiniCard label="年化收益" value={`${returns.annualizedReturn >= 0 ? '+' : ''}${returns.annualizedReturn.toFixed(2)}%`} trend="up" />
        <StatMiniCard label="最大回撤" value={`${returns.maxDrawdown.toFixed(2)}%`} trend="down" />
        <StatMiniCard label="波动率" value={`${returns.volatility.toFixed(2)}%`} trend="down" />
      </CardContent>
    </Card>
  );
}

/**
 * 账户信息卡片组件
 */
function AccountInfoCard({ 
  fund, 
  isEditing, 
  remark, 
  setRemark 
}: { 
  fund: UserFund; 
  isEditing: boolean;
  remark: string;
  setRemark: (v: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">账户信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">添加时间</Label>
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate">{new Date(fund.addedAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">最后更新</Label>
            <div className="flex items-center gap-1.5 text-sm">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate">{new Date(fund.lastUpdated).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">备注</Label>
          {isEditing ? (
            <Input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="添加备注..."
              className="h-9"
            />
          ) : (
            <div className="text-sm truncate" title={fund.remark || '无备注'}>{fund.remark || '无备注'}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 基金概况卡片组件
 */
function FundOverviewCard({ overview }: { overview: FundOverview }) {
  const items = [
    { label: '基金全称', value: overview.fundFullName },
    { label: '基金简称', value: overview.fundShortName },
    { label: '基金类型', value: overview.fundType },
    { label: '成立日期', value: overview.establishDate },
    { label: '资产规模', value: overview.assetScale },
    { label: '份额规模', value: overview.shareScale },
    { label: '基金管理人', value: overview.fundManager },
    { label: '基金托管人', value: overview.fundTrustee },
    { label: '基金经理', value: overview.fundDirectors },
    { label: '业绩比较基准', value: overview.benchmark },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          基金概况
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {items.map((item) => (
            <InfoItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 基金评级卡片组件
 */
function FundRatingCard({ rating }: { rating: FundRating }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="w-4 h-4" />
          基金评级
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          <RatingItem name="上海证券" rating={rating.shanghaiRating} />
          <RatingItem name="招商证券" rating={rating.zheshangRating} />
          <RatingItem name="济安金信" rating={rating.jianRating} />
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">5 星评级</div>
            <div className="text-xl font-bold text-yellow-500">{rating.fiveStarCount}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 基金经理卡片组件
 */
function FundManagersCard({ managers }: { managers: FundManagerInfo[] }) {
  if (managers.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          基金经理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {managers.map((manager, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{manager.name}</div>
                <div className="text-xs text-muted-foreground truncate">{manager.company || '未知公司'}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-muted/50 p-2 rounded text-center">
                <div className="text-muted-foreground">从业时间</div>
                <div className="font-medium">{manager.workDays} 天</div>
              </div>
              <div className="bg-muted/50 p-2 rounded text-center">
                <div className="text-muted-foreground">管理规模</div>
                <div className="font-medium truncate">{manager.totalScale} 亿</div>
              </div>
              <div className="bg-muted/50 p-2 rounded text-center">
                <div className="text-muted-foreground">最佳回报</div>
                <div className={`font-medium ${manager.bestReturn >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {manager.bestReturn >= 0 ? '+' : ''}{manager.bestReturn}%
                </div>
              </div>
            </div>
            <div className="text-xs bg-muted/30 p-2 rounded flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground">现任基金：</span>
              <span className="font-medium truncate">{manager.fundName}</span>
              <Badge variant="secondary" className="text-xs flex-shrink-0">{manager.fundCode}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * 基金费率卡片组件
 */
function FundFeeCard({ fees }: { fees: FundFee[] }) {
  if (fees.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="w-4 h-4" />
          基金费率
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">费用类型</TableHead>
                <TableHead className="text-right whitespace-nowrap">条件/名称</TableHead>
                <TableHead className="text-right whitespace-nowrap">费率 (%)</TableHead>
                <TableHead className="text-right whitespace-nowrap">优惠费率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium whitespace-nowrap">{fee.feeType}</TableCell>
                  <TableCell className="text-right text-muted-foreground truncate max-w-[150px]" title={fee.condition}>{fee.condition}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">{fee.fee}%</TableCell>
                  <TableCell className="text-right text-green-600 whitespace-nowrap">{fee.discountedFee || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 持仓信息卡片组件
 */
function PortfolioCard({ portfolio }: { portfolio: FundPortfolio }) {
  const hasStocks = portfolio.stockHoldings.length > 0;
  const hasBonds = portfolio.bondHoldings.length > 0;
  const hasIndustry = portfolio.industryAllocation.length > 0;

  if (!hasStocks && !hasBonds && !hasIndustry) {
    return (
      <Empty>
        <EmptyTitle>暂无数据</EmptyTitle>
        <EmptyDescription>暂无持仓信息</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {hasStocks && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              股票持仓（前十大）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">代码</TableHead>
                    <TableHead className="whitespace-nowrap">名称</TableHead>
                    <TableHead className="text-right whitespace-nowrap">占净值比 (%)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">持股数 (万股)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">持仓市值 (万元)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.stockHoldings.slice(0, 10).map((stock, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">{stock.stockCode}</TableCell>
                      <TableCell className="whitespace-nowrap">{stock.stockName}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs">{stock.netValueRatio.toFixed(2)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">{stock.shares}</TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">{stock.marketValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {hasBonds && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              债券持仓
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">代码</TableHead>
                    <TableHead className="whitespace-nowrap">名称</TableHead>
                    <TableHead className="text-right whitespace-nowrap">占净值比 (%)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">持仓市值 (万元)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.bondHoldings.map((bond, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">{bond.bondCode}</TableCell>
                      <TableCell className="whitespace-nowrap">{bond.bondName}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs">{bond.netValueRatio.toFixed(2)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">{bond.marketValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {hasIndustry && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              行业配置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">行业类别</TableHead>
                    <TableHead className="text-right whitespace-nowrap">占净值比 (%)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">市值 (万元)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.industryAllocation.map((industry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">{industry.industry}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">{industry.netValueRatio.toFixed(2)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">{industry.marketValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 历史净值卡片组件
 */
function HistoryNavCard({ history }: { history: Array<{ date: string; unitNav: number; cumulativeNav: number; dailyGrowthRate?: number }> }) {
  if (history.length === 0) {
    return (
      <Empty>
        <EmptyTitle>暂无数据</EmptyTitle>
        <EmptyDescription>暂无历史净值数据</EmptyDescription>
      </Empty>
    );
  }

  // 格式化日期显示
  const formatHistoryDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          历史净值（最近 50 条）
        </h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            <TableRow>
              <TableHead className="whitespace-nowrap w-[120px]">日期</TableHead>
              <TableHead className="text-right whitespace-nowrap w-[120px]">单位净值</TableHead>
              <TableHead className="text-right whitespace-nowrap w-[120px]">累计净值</TableHead>
              <TableHead className="text-right whitespace-nowrap">日增长率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...history].reverse().slice(0, 50).map((item, index) => (
              <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                <TableCell className="font-medium whitespace-nowrap">{formatHistoryDate(item.date)}</TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono">{item.unitNav.toFixed(4)}</TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-muted-foreground">{item.cumulativeNav.toFixed(4)}</TableCell>
                <TableCell className={`text-right font-medium whitespace-nowrap ${(item.dailyGrowthRate || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {item.dailyGrowthRate !== undefined 
                    ? `${item.dailyGrowthRate >= 0 ? '+' : ''}${item.dailyGrowthRate.toFixed(2)}%`
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * 分红公告卡片组件
 */
function DividendCard({ dividends }: { dividends: FundAnnouncement[] }) {
  if (dividends.length === 0) return null;

  // 格式化日期显示
  const formatAnnouncementDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4" />
          分红公告（最近 10 条）
        </h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            <TableRow>
              <TableHead className="whitespace-nowrap">公告标题</TableHead>
              <TableHead className="text-right whitespace-nowrap w-[120px]">公告日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dividends.slice(0, 10).map((div, index) => (
              <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                <TableCell className="max-w-[500px] truncate" title={div.title}>{div.title}</TableCell>
                <TableCell className="text-right text-muted-foreground whitespace-nowrap font-mono">{formatAnnouncementDate(div.publishDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * 信息展示组件
 */
function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium truncate" title={value || ''}>{value || '-'}</div>
    </div>
  );
}

/**
 * 评级展示组件
 */
function RatingItem({ name, rating }: { name: string; rating: number }) {
  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      <div className="text-xs text-muted-foreground mb-2">{name}</div>
      <div className="flex gap-0.5 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-sm ${star <= rating ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
    </div>
  );
}

/**
 * 基金详情对话框组件
 */
export function FundDetailDialog({ fund, open, onOpenChange, onUpdate }: FundDetailDialogProps) {
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [remark, setRemark] = useState(fund.remark || '');
  const [holdShares, setHoldShares] = useState(fund.holdShares?.toString() || '');
  const [costPrice, setCostPrice] = useState(fund.costPrice?.toString() || '');

  // 当前激活的 Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // 各 Tab 数据状态（按需加载）
  const [overview, setOverview] = useState<FundOverview | null>(null);
  const [fees, setFees] = useState<FundFee[]>([]);
  const [portfolio, setPortfolio] = useState<FundPortfolio | null>(null);
  const [dividends, setDividends] = useState<FundAnnouncement[]>([]);
  const [rating, setRating] = useState<FundRating | null>(null);
  const [managers, setManagers] = useState<FundManagerInfo[]>([]);

  // 加载状态
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    info: false,
    portfolio: false,
    history: false
  });

  // 错误状态
  const [errorStates, setErrorStates] = useState<Record<string, string>>({});

  // 获取净值历史
  const { history, loading: historyLoading, returns } = useNavHistory(fund.code, '单位净值走势', '1 年' as any);

  // 加载基金详细信息（按需加载）
  const loadTabData = useCallback(async (tab: TabType) => {
    if (tab === 'info' && !overview) {
      setLoadingStates(prev => ({ ...prev, info: true }));
      setErrorStates(prev => ({ ...prev, info: '' }));
      try {
        const [overviewData, feeData, ratingData, managerData] = await Promise.all([
          fundInfoService.getFundOverview(fund.code).catch(() => null),
          fundInfoService.getFundFee(fund.code).catch(() => []),
          fundInfoService.getFundRating(fund.code).catch(() => null),
          fundInfoService.getFundManagers(fund.code).catch(() => [])
        ]);
        setOverview(overviewData);
        setFees(feeData);
        setRating(ratingData);
        setManagers(managerData);
      } catch (err) {
        setErrorStates(prev => ({ ...prev, info: '加载基金信息失败' }));
      } finally {
        setLoadingStates(prev => ({ ...prev, info: false }));
      }
    }

    if (tab === 'portfolio' && !portfolio) {
      setLoadingStates(prev => ({ ...prev, portfolio: true }));
      setErrorStates(prev => ({ ...prev, portfolio: '' }));
      try {
        const portfolioData = await fundInfoService.getFundPortfolio(fund.code).catch(() => null);
        setPortfolio(portfolioData);
      } catch (err) {
        setErrorStates(prev => ({ ...prev, portfolio: '加载持仓信息失败' }));
      } finally {
        setLoadingStates(prev => ({ ...prev, portfolio: false }));
      }
    }

    if (tab === 'history' && dividends.length === 0) {
      setLoadingStates(prev => ({ ...prev, history: true }));
      setErrorStates(prev => ({ ...prev, history: '' }));
      try {
        const dividendData = await fundInfoService.getFundDividendAnnouncements(fund.code).catch(() => []);
        setDividends(dividendData);
      } catch (err) {
        setErrorStates(prev => ({ ...prev, history: '加载历史数据失败' }));
      } finally {
        setLoadingStates(prev => ({ ...prev, history: false }));
      }
    }
  }, [fund.code, overview, portfolio, dividends.length]);

  // Tab 切换处理
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
    loadTabData(value as TabType);
  };

  // 对话框打开时重置状态
  useEffect(() => {
    if (open && fund.code) {
      setRemark(fund.remark || '');
      setHoldShares(fund.holdShares?.toString() || '');
      setCostPrice(fund.costPrice?.toString() || '');
      setIsEditing(false);
    }
  }, [open, fund]);

  // 保存编辑
  const handleSave = () => {
    const success = onUpdate({
      remark: remark || undefined,
      holdShares: holdShares ? parseFloat(holdShares) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined
    });
    if (success) {
      setIsEditing(false);
      toast.success('保存成功');
    } else {
      toast.error('保存失败');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* 头部 - 固定高度 */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <DialogTitle className="text-lg font-bold truncate">{fund.name}</DialogTitle>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">{fund.code}</Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 flex-shrink-0">{fund.type}</Badge>
              </div>
              {fund.latestNav && (
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground">单位净值</div>
                    <div className="text-base font-bold">{fund.latestNav.unitNav.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">累计净值</div>
                    <div className="text-base font-bold">{fund.latestNav.cumulativeNav.toFixed(4)}</div>
                  </div>
                  {fund.latestNav.dailyGrowthRate !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">日涨跌</div>
                      <div className={`text-base font-bold flex items-center gap-1 ${fund.latestNav.dailyGrowthRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {fund.latestNav.dailyGrowthRate >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {fund.latestNav.dailyGrowthRate >= 0 ? '+' : ''}{fund.latestNav.dailyGrowthRate.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(fund.latestNav.date)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  编辑持有
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="h-8">取消</Button>
                  <Button size="sm" onClick={handleSave} className="h-8">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    保存
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab 导航和内容 */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5 rounded-none border-b h-10 flex-shrink-0">
            <TabsTrigger value="overview" className="text-xs">概览</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">基金信息</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs">持仓</TabsTrigger>
            <TabsTrigger value="chart" className="text-xs">净值走势</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">历史数据</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* 概览 Tab */}
              <TabsContent value="overview" className="space-y-4">
                <HoldingInfoCard 
                  fund={fund} 
                  isEditing={isEditing}
                  holdShares={holdShares}
                  setHoldShares={setHoldShares}
                  costPrice={costPrice}
                  setCostPrice={setCostPrice}
                />
                <ReturnsCard returns={returns} />
                <AccountInfoCard 
                  fund={fund}
                  isEditing={isEditing}
                  remark={remark}
                  setRemark={setRemark}
                />
              </TabsContent>

              {/* 基金信息 Tab */}
              <TabsContent value="info" className="space-y-4">
                {loadingStates.info ? (
                  <div className="space-y-4">
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">{[...Array(10)].map((_, i) => <div key={i} className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-full" /></div>)}</div></CardContent></Card>
                  </div>
                ) : errorStates.info ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorStates.info}</AlertDescription>
                    <Button variant="outline" size="sm" onClick={() => loadTabData('info')} className="mt-2">
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />重试
                    </Button>
                  </Alert>
                ) : overview ? (
                  <>
                    <FundOverviewCard overview={overview} />
                    {rating && <FundRatingCard rating={rating} />}
                    {managers.length > 0 && <FundManagersCard managers={managers} />}
                    {fees.length > 0 && <FundFeeCard fees={fees} />}
                  </>
                ) : (
                  <Empty><EmptyTitle>暂无数据</EmptyTitle><EmptyDescription>暂无基金概况信息</EmptyDescription></Empty>
                )}
              </TabsContent>

              {/* 持仓 Tab */}
              <TabsContent value="portfolio" className="space-y-4">
                {loadingStates.portfolio ? (
                  <div className="flex justify-center py-8"><LoadingSpinner /></div>
                ) : errorStates.portfolio ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorStates.portfolio}</AlertDescription>
                    <Button variant="outline" size="sm" onClick={() => loadTabData('portfolio')} className="mt-2">
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />重试
                    </Button>
                  </Alert>
                ) : portfolio ? (
                  <PortfolioCard portfolio={portfolio} />
                ) : (
                  <Empty><EmptyTitle>暂无数据</EmptyTitle><EmptyDescription>暂无持仓信息</EmptyDescription></Empty>
                )}
              </TabsContent>

              {/* 净值走势 Tab */}
              <TabsContent value="chart" className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      净值走势（近一年）
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {historyLoading ? (
                      <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                    ) : history.length > 0 ? (
                      <NavChart data={history} loading={historyLoading} />
                    ) : (
                      <Empty><EmptyTitle>暂无数据</EmptyTitle><EmptyDescription>暂无历史净值数据</EmptyDescription></Empty>
                    )}
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">收益指标</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatMiniCard label="总收益" value={`${returns.totalReturn >= 0 ? '+' : ''}${returns.totalReturn.toFixed(2)}%`} trend="up" />
                    <StatMiniCard label="年化收益" value={`${returns.annualizedReturn >= 0 ? '+' : ''}${returns.annualizedReturn.toFixed(2)}%`} trend="up" />
                    <StatMiniCard label="最大回撤" value={`${returns.maxDrawdown.toFixed(2)}%`} trend="down" />
                    <StatMiniCard label="波动率" value={`${returns.volatility.toFixed(2)}%`} trend="down" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 历史数据 Tab */}
              <TabsContent value="history" className="space-y-4">
                <HistoryNavCard history={history} />
                {dividends.length > 0 && <DividendCard dividends={dividends} />}
                {loadingStates.history && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
                {errorStates.history && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorStates.history}</AlertDescription>
                    <Button variant="outline" size="sm" onClick={() => loadTabData('history')} className="mt-2">
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />重试
                    </Button>
                  </Alert>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
