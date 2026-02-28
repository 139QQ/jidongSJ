/**
 * 工具页面组件
 * @module components/ToolsPanel
 * @description 展示基金对比、文档中心等工具功能
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FundCompare } from './FundCompare';
import { PieChart, FileText } from 'lucide-react';

/**
 * 工具页面组件
 */
export function ToolsPanel() {
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">工具</h2>
      </div>

      {/* 基金对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            基金对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FundCompare />
        </CardContent>
      </Card>

      {/* 文档中心 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            文档中心
          </CardTitle>
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
    </div>
  );
}
