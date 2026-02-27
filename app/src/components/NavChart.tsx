/**
 * 净值走势图组件
 * @module components/NavChart
 * @description 使用recharts绘制基金净值走势图
 */

import type { FundNAV } from '@/types/fund';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

/** 组件属性 */
interface NavChartProps {
  /** 净值数据 */
  data: FundNAV[];
  /** 加载状态 */
  loading?: boolean;
  /** 图表类型 */
  type?: 'line' | 'area';
}

/**
 * 净值走势图组件
 */
export function NavChart({ data, loading = false, type = 'area' }: NavChartProps) {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">暂无数据</div>
      </div>
    );
  }

  // 格式化数据
  const chartData = data.map(item => ({
    date: item.date,
    unitNav: item.unitNav,
    cumulativeNav: item.cumulativeNav,
    dailyGrowthRate: item.dailyGrowthRate
  }));

  // 计算Y轴范围
  const navValues = data.map(d => d.unitNav);
  const minNav = Math.min(...navValues);
  const maxNav = Math.max(...navValues);
  const navRange = maxNav - minNav;
  const yDomain = [
    Math.max(0, minNav - navRange * 0.1),
    maxNav + navRange * 0.1
  ];

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartComponent data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
          minTickGap={30}
        />
        <YAxis 
          domain={yDomain}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.toFixed(2)}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px'
          }}
          labelStyle={{ color: '#374151', fontWeight: 500 }}
          formatter={(value: number, name: string) => {
            const labelMap: Record<string, string> = {
              unitNav: '单位净值',
              cumulativeNav: '累计净值',
              dailyGrowthRate: '日增长率'
            };
            return [value.toFixed(4), labelMap[name] || name];
          }}
          labelFormatter={(label) => `日期: ${label}`}
        />
        {type === 'area' ? (
          <Area
            type="monotone"
            dataKey="unitNav"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNav)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="unitNav"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

/** 收益率对比图组件属性 */
interface ReturnsChartProps {
  /** 基金代码数组 */
  codes: string[];
  /** 历史数据映射 */
  dataMap: Record<string, FundNAV[]>;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 收益率对比图组件
 */
export function ReturnsChart({ codes, dataMap, loading = false }: ReturnsChartProps) {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">请选择基金</div>
      </div>
    );
  }

  // 合并数据
  const dateSet = new Set<string>();
  codes.forEach(code => {
    (dataMap[code] || []).forEach(item => dateSet.add(item.date));
  });
  
  const dates = Array.from(dateSet).sort();
  
  // 计算累计收益率
  const chartData = dates.map(date => {
    const point: Record<string, any> = { date };
    codes.forEach(code => {
      const navData = dataMap[code] || [];
      const item = navData.find(d => d.date === date);
      if (item) {
        const firstNav = navData[0]?.unitNav || item.unitNav;
        const returns = ((item.unitNav - firstNav) / firstNav) * 100;
        point[code] = returns;
      }
    });
    return point;
  });

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
          minTickGap={30}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value.toFixed(2)}%`}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px'
          }}
          formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
          labelFormatter={(label) => `日期: ${label}`}
        />
        {codes.map((code, index) => (
          <Line
            key={code}
            type="monotone"
            dataKey={code}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
