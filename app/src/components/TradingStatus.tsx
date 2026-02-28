/**
 * 交易状态提示组件
 * @module components/TradingStatus
 * @description 显示当前市场交易状态和节假日休市信息
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { getTradingStatus, getHolidayScheduleText } from '@/services/tradingTime';
import type { TradingStatusInfo } from '@/services/tradingTime';

interface TradingStatusProps {
  showDetails?: boolean;
}

/**
 * 交易状态提示组件
 */
export function TradingStatus({ showDetails = true }: TradingStatusProps) {
  const [status, setStatus] = useState<TradingStatusInfo | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    // 初始化时获取状态
    setStatus(getTradingStatus());

    // 每分钟更新一次状态
    const interval = setInterval(() => {
      setStatus(getTradingStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'trading':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'preMarket':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'afterMarket':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'closed':
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'trading':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'preMarket':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'afterMarket':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'closed':
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusBadge = () => {
    switch (status.status) {
      case 'trading':
        return <Badge className="bg-green-500 text-white">交易中</Badge>;
      case 'preMarket':
        return <Badge className="bg-blue-500 text-white">盘前</Badge>;
      case 'afterMarket':
        return <Badge className="bg-orange-500 text-white">已收盘</Badge>;
      case 'closed':
        return <Badge variant="secondary">休市中</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            市场状态
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态消息 */}
        <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center gap-2">
            {status.isWeekend || status.isHoliday ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        </div>

        {/* 距离下一个交易时段 */}
        {status.status !== 'trading' && (
          <div className="text-sm text-muted-foreground">
            {status.minutesToNextSession < 60 
              ? `距离开市还有约 ${status.minutesToNextSession} 分钟`
              : status.minutesToNextSession < 1440
                ? `距离开市还有约 ${Math.floor(status.minutesToNextSession / 60)} 小时 ${status.minutesToNextSession % 60} 分钟`
                : `距离开市还有 ${status.daysToNextTradingDay} 天`
            }
          </div>
        )}

        {/* 下一个交易日 */}
        {!status.isTradingDay && (
          <div className="text-sm">
            <span className="text-muted-foreground">下一个交易日：</span>
            <span className="font-medium">
              {status.nextTradingDay.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </span>
          </div>
        )}

        {/* 查看节假日安排按钮 */}
        {showDetails && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowSchedule(!showSchedule)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showSchedule ? '收起' : '查看节假日安排'}
          </Button>
        )}

        {/* 节假日安排详情 */}
        {showDetails && showSchedule && (
          <div className="mt-3 p-4 bg-muted/50 rounded-lg text-sm space-y-2 max-h-64 overflow-y-auto border border-muted">
            <pre className="whitespace-pre-wrap font-mono text-foreground leading-relaxed">
              {getHolidayScheduleText()}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TradingStatus;
