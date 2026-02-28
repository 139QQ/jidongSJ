/**
 * 专题页面组件
 * @module components/SpecialTopics
 * @description 展示 LOF 基金、ETF 基金、分红送配等专题内容
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LOFList } from './LOFList';
import { ETFList } from './ETFList';
import { DividendList } from './DividendList';
import { PieChart, BarChart3, Gift } from 'lucide-react';

/**
 * 专题页面组件
 */
export function SpecialTopics() {
  const [activeTopic, setActiveTopic] = useState('lof');

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">专题</h2>
      </div>

      {/* 专题选择 Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTopic} onValueChange={setActiveTopic} className="w-full">
            <TabsList className="w-full grid grid-cols-3 gap-2 h-auto min-h-[2.5rem]">
              <TabsTrigger value="lof" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <PieChart className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">LOF 基金</span>
                <span className="sm:hidden">LOF</span>
              </TabsTrigger>
              <TabsTrigger value="etf" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">ETF 基金</span>
                <span className="sm:hidden">ETF</span>
              </TabsTrigger>
              <TabsTrigger value="dividend" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <Gift className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">分红送配</span>
                <span className="sm:hidden">分红</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lof" className="mt-4">
              <LOFList />
            </TabsContent>

            <TabsContent value="etf" className="mt-4">
              <ETFList />
            </TabsContent>

            <TabsContent value="dividend" className="mt-4">
              <DividendList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
