/**
 * 基金排行列表组件
 * @module components/FundRankList
 * @description 展示基金排行数据，支持分页加载
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fundService } from '@/services/fundService';
import { fundManager } from '@/services/fundManager';
import { cache, generateCacheKey } from '@/services/cache';
import { persistentCache } from '@/services/persistentCache';
import type { FundRank, FundEstimate } from '@/types/fund';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, AlertCircle, RefreshCw, Database, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

/** 排行类型 - 与 AKShare 官方文档保持一致 */
type RankType = '全部' | '股票型' | '混合型' | '债券型' | '指数型' | 'QDII' | 'FOF';

/** 每页加载数量 */
const PAGE_SIZE = 50;

/** 初始加载数量 */
const INITIAL_SIZE = 30;

/**
 * 基金排行列表组件
 */
export function FundRankList() {
  const [rankType, setRankType] = useState<RankType>('全部');
  const [allRanks, setAllRanks] = useState<FundRank[]>([]); // 全部数据
  const [displayRanks, setDisplayRanks] = useState<FundRank[]>([]); // 当前显示的数据
  const [estimates, setEstimates] = useState<FundEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // 使用 ref 跟踪已加载的类型
  const loadedTypes = useRef<Set<string>>(new Set());

  // 获取缓存 key - 与 fundService 保持一致 (fund_open_fund_rank_em)
  const getCacheKey = useCallback((type: string) => {
    return generateCacheKey('fund_open_fund_rank_em', { symbol: type });
  }, []);

  // 从缓存加载数据
  const loadFromCache = useCallback((type: string): FundRank[] | null => {
    const cacheKey = getCacheKey(type);
    
    // 先检查内存缓存
    const memoryCached = cache.get<FundRank[]>(cacheKey);
    if (memoryCached) {
      console.log(`[FundRankList] 从内存缓存加载：${type}`);
      return memoryCached;
    }
    
    // 再检查持久化缓存
    const persistentCached = persistentCache.get<FundRank[]>(cacheKey);
    if (persistentCached) {
      console.log(`[FundRankList] 从持久化缓存加载：${type}`);
      // 同步到内存缓存
      cache.set(cacheKey, persistentCached, 30 * 60 * 1000);
      return persistentCached;
    }
    
    return null;
  }, [getCacheKey]);

  // 保存到缓存
  const saveToCache = useCallback((type: string, data: FundRank[]) => {
    const cacheKey = getCacheKey(type);
    cache.set(cacheKey, data, 30 * 60 * 1000);
    persistentCache.set(cacheKey, data, 60 * 60 * 1000);
  }, [getCacheKey]);

  // 加载指定类型的排行数据
  const loadRankData = useCallback(async (type: RankType, forceRefresh: boolean = false) => {
    console.log(`[FundRankList] 开始加载排行数据：${type}, forceRefresh=${forceRefresh}`);
    
    // 检查是否已加载过（且不是强制刷新）
    if (!forceRefresh && loadedTypes.current.has(type)) {
      console.log(`[FundRankList] ${type} 已加载，跳过`);
      // 确保从缓存恢复数据
      const cached = loadFromCache(type);
      if (cached && cached.length > 0) {
        setAllRanks(cached);
        setDisplayRanks(cached.slice(0, INITIAL_SIZE));
        setHasMore(cached.length > INITIAL_SIZE);
        setIsPreloaded(true);
        setError(null);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      // 先尝试从缓存加载
      if (!forceRefresh) {
        const cacheKey = getCacheKey(type);
        console.log(`[FundRankList] 检查缓存：${cacheKey}`);
        
        const cached = loadFromCache(type);
        if (cached && cached.length > 0) {
          console.log(`[FundRankList] 从缓存加载成功：${cached.length} 条`);
          setAllRanks(cached);
          setDisplayRanks(cached.slice(0, INITIAL_SIZE));
          setHasMore(cached.length > INITIAL_SIZE);
          setIsPreloaded(true);
          loadedTypes.current.add(type);
          setLoading(false);
          setProgress(0);
          
          // 后台刷新估算数据
          fundService.getFundEstimate('全部')
            .then(estimatesData => setEstimates(estimatesData))
            .catch(() => {});
          return;
        }
        console.log('[FundRankList] 缓存未命中，从 API 加载');
      }

      setProgress(50);
      toast.info(`正在加载${type}排行数据...`, { duration: 5000 });

      // 从 API 加载
      console.log(`[FundRankList] 调用 API: fundService.getFundRank('${type}')`);
      const data = await fundService.getFundRank(type);
      console.log(`[FundRankList] API 返回数据：${data?.length || 0} 条`);
      
      if (!data || data.length === 0) {
        console.warn('[FundRankList] API 返回空数据');
        setError('暂无数据');
        setLoading(false);
        return;
      }

      // 保存到缓存
      saveToCache(type, data);
      console.log(`[FundRankList] 数据已保存到缓存`);
      
      setAllRanks(data);
      setDisplayRanks(data.slice(0, INITIAL_SIZE));
      setHasMore(data.length > INITIAL_SIZE);
      setIsPreloaded(true);
      loadedTypes.current.add(type);
      
      setProgress(100);
      toast.success(`加载完成，共 ${data.length} 只基金`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[FundRankList] 加载排行数据失败:', error);
      
      let errorMsg = '加载失败';
      const errorObj = err as { code?: string; message?: string; response?: { status?: number } };
      if (errorObj.code === 'ECONNABORTED' || errorObj.message?.includes('timeout')) {
        errorMsg = '请求超时，AKTools 服务器响应较慢，请稍后重试';
      } else if (errorObj.message?.includes('Network Error')) {
        errorMsg = '网络错误，请检查网络连接或 AKTools 服务器状态';
      } else if (errorObj.response?.status === 404) {
        errorMsg = 'API 接口不存在，请检查 AKTools 服务';
      } else if (errorObj.response?.status && errorObj.response.status >= 500) {
        errorMsg = '服务器错误，请稍后重试';
      } else if (errorObj.message) {
        errorMsg = `加载失败：${errorObj.message}`;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [loadFromCache, saveToCache, getCacheKey]);

  // 加载更多数据 - 修复版本
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      console.log(`[FundRankList] 跳过加载：loadingMore=${loadingMore}, hasMore=${hasMore}`);
      return;
    }
    
    // 检查是否有数据可加载
    if (!allRanks || allRanks.length === 0) {
      console.warn('[FundRankList] 没有可加载的数据');
      return;
    }
    
    console.log(`[FundRankList] 开始加载更多，当前显示${displayRanks.length}条，总共${allRanks.length}条`);
    
    setLoadingMore(true);
    
    try {
      // 简单计算：在当前显示数量基础上增加 PAGE_SIZE
      const currentLength = displayRanks.length;
      const newLength = Math.min(currentLength + PAGE_SIZE, allRanks.length);
      
      console.log(`[FundRankList] 加载更多：从${currentLength}条到${newLength}条`);
      
      // 直接截取数据
      const newData = allRanks.slice(0, newLength);
      setDisplayRanks(newData);
      setHasMore(newLength < allRanks.length);
    } catch (error) {
      console.error('[FundRankList] 加载更多失败:', error);
      toast.error('加载更多失败，请稍后重试');
      setHasMore(false); // 失败时停止加载
    } finally {
      setLoadingMore(false);
    }
  }, [allRanks, displayRanks.length, hasMore, loadingMore]);

  // 初始加载 - 只在组件挂载时执行一次
  useEffect(() => {
    console.log('[FundRankList] 组件挂载，开始初始加载');
    loadRankData('全部');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换排行类型 - 统一处理数据加载
  const handleTypeChange = async (type: RankType) => {
    if (type === rankType) return; // 避免重复点击
    
    console.log(`[FundRankList] 切换到 ${type}`);
    setRankType(type);
    setError(null);
    
    // 检查是否已加载过 - 直接从内存缓存恢复，不再调用 API
    const cached = loadFromCache(type);
    if (cached && cached.length > 0) {
      console.log(`[FundRankList] ${type} 从缓存恢复：${cached.length} 条`);
      setAllRanks(cached);
      setDisplayRanks(cached.slice(0, INITIAL_SIZE));
      setHasMore(cached.length > INITIAL_SIZE);
      setIsPreloaded(true);
      loadedTypes.current.add(type);
      return;
    }
    
    // 未加载过，重新加载
    console.log(`[FundRankList] ${type} 缓存未命中，开始加载`);
    setHasMore(true);
    await loadRankData(type);
  };

  // 刷新数据
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      toast.info('正在刷新数据...');
      
      // 清除当前类型的缓存
      const cacheKey = getCacheKey(rankType);
      cache.delete(cacheKey);
      persistentCache.delete(cacheKey);
      loadedTypes.current.delete(rankType);
      
      // 重新加载
      await loadRankData(rankType, true);
      
      toast.success('数据刷新完成');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('刷新失败:', error);
      setError('刷新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理添加基金 - 添加超时处理
  const handleAddFund = async (code: string, name: string) => {
    if (fundManager.hasFund(code)) {
      toast.info('该基金已在您的关注列表中');
      return;
    }

    setAddingCode(code);
    
    // 设置超时，防止进度条卡住不动（15 秒超时）
    const timeoutId = setTimeout(() => {
      console.warn(`[FundRankList] 添加基金 ${code} 超时`);
      toast.error('添加基金超时，请稍后重试');
      setAddingCode(null);
    }, 15000);
    
    try {
      const fund = await fundManager.addFund(code, name);
      clearTimeout(timeoutId); // 清除超时
      
      if (fund) {
        toast.success(`成功添加基金：${name}`);
      } else {
        toast.error('添加基金失败，请检查基金代码是否正确');
      }
    } catch (error) {
      clearTimeout(timeoutId); // 清除超时
      console.error(`[FundRankList] 添加基金 ${code} 失败:`, error);
      toast.error(`添加基金失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setAddingCode(null);
    }
  };

  // 渲染排行表格
  const renderRankTable = () => {
    // 加载中且没有预加载数据时显示加载状态
    if (loading && !isPreloaded) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">正在加载排行数据...</p>
          {progress > 0 && (
            <div className="w-64 mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {progress}%
              </p>
            </div>
          )}
        </div>
      );
    }

    // 有错误且没有预加载数据时显示错误状态
    if (error && !isPreloaded) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">加载失败</p>
          <p className="text-muted-foreground text-sm mb-4 max-w-md">{error}</p>
          <Button onClick={() => loadRankData(rankType)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </div>
      );
    }

    // 没有数据时显示空状态（包括 allRanks 为空的情况）
    if (!allRanks || allRanks.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无数据</p>
          <Button onClick={() => loadRankData(rankType)} variant="outline" className="mt-4">
            加载数据
          </Button>
        </div>
      );
    }

    // 渲染表格 - 只要有 allRanks 数据就显示表格（即使 displayRanks 为空也会显示空表格）
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          {/* 表格容器 - 固定高度，内部滚动 */}
          <div className="max-h-[600px] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="text-left py-3 px-2">排名</th>
                <th className="text-left py-3 px-2">基金</th>
                <th className="text-right py-3 px-2">净值</th>
                <th className="text-right py-3 px-2">日涨</th>
                <th className="text-right py-3 px-2">近 1 月</th>
                <th className="text-right py-3 px-2">近 3 月</th>
                <th className="text-right py-3 px-2">近 1 年</th>
                <th className="text-right py-3 px-2">今年来</th>
                <th className="text-center py-3 px-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayRanks.length > 0 ? (
                displayRanks.map((item, index) => (
                  <tr key={item.code} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 justify-center">
                        {item.rank}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium truncate max-w-[150px]">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.code}</div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">{item.unitNav.toFixed(4)}</td>
                    <td className={`text-right py-3 px-2 ${item.dailyGrowthRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.dailyGrowthRate >= 0 ? '+' : ''}{item.dailyGrowthRate.toFixed(2)}%
                    </td>
                    <td className={`text-right py-3 px-2 ${item.month1 >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.month1 >= 0 ? '+' : ''}{item.month1.toFixed(2)}%
                    </td>
                    <td className={`text-right py-3 px-2 ${item.month3 >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.month3 >= 0 ? '+' : ''}{item.month3.toFixed(2)}%
                    </td>
                    <td className={`text-right py-3 px-2 ${item.year1 >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.year1 >= 0 ? '+' : ''}{item.year1.toFixed(2)}%
                    </td>
                    <td className={`text-right py-3 px-2 ${item.thisYear >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.thisYear >= 0 ? '+' : ''}{item.thisYear.toFixed(2)}%
                    </td>
                    <td className="text-center py-3 px-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddFund(item.code, item.name)}
                        disabled={addingCode === item.code || fundManager.hasFund(item.code)}
                      >
                        {addingCode === item.code ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : fundManager.hasFund(item.code) ? (
                          '已添加'
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
              
              {/* 加载更多时的骨架屏行 - 只在有数据且正在加载时显示 */}
              {loadingMore && displayRanks.length > 0 && (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b">
                    <td className="py-3 px-2">
                      <Skeleton className="w-6 h-6 rounded-full" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[60px]" />
                      </div>
                    </td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-[50px] ml-auto" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-[50px] ml-auto" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-[50px] ml-auto" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-[50px] ml-auto" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-[50px] ml-auto" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-[50px] ml-auto" /></td>
                    <td className="py-3 px-2 text-center"><Skeleton className="h-8 w-8 mx-auto" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* 加载进度条 - 仅在加载更多时显示 */}
        {loadingMore && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在加载更多数据...</span>
            </div>
            <Progress value={66} className="h-1 animate-pulse" />
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full max-w-xs transition-all duration-200"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  加载中...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  加载更多 ({displayRanks.length} / {allRanks.length})
                </>
              )}
            </Button>
          </div>
        )}

        {/* 数据状态 */}
        <div className="text-center text-xs text-muted-foreground py-2">
          显示 {displayRanks.length} 条，共 {allRanks.length} 条
          {estimates.length > 0 && ` · 估算数据 ${estimates.length} 条`}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>基金排行</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs value={rankType} onValueChange={(v) => handleTypeChange(v as RankType)}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="全部">全部</TabsTrigger>
                <TabsTrigger value="股票型">股票型</TabsTrigger>
                <TabsTrigger value="混合型">混合型</TabsTrigger>
                <TabsTrigger value="债券型">债券型</TabsTrigger>
                <TabsTrigger value="指数型">指数型</TabsTrigger>
                <TabsTrigger value="QDII">QDII</TabsTrigger>
                <TabsTrigger value="FOF">FOF</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* 表格内容 */}
            {renderRankTable()}
          </div>
        </CardContent>
      </Card>

      {/* 估算净值 */}
      {isPreloaded && estimates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">净值估算</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">基金</th>
                    <th className="text-right py-2">估算净值</th>
                    <th className="text-right py-2">估算涨跌</th>
                    <th className="text-right py-2">公布净值</th>
                    <th className="text-center py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.slice(0, 10).map((item) => (
                    <tr key={item.code} className="border-b hover:bg-muted/50">
                      <td className="py-2">
                        <div>
                          <div className="font-medium truncate max-w-[150px]">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.code}</div>
                        </div>
                      </td>
                      <td className="text-right py-2">{item.estimateNav.toFixed(4)}</td>
                      <td className={`text-right py-2 ${item.estimateGrowthRate.includes('+') ? 'text-red-500' : 'text-green-500'}`}>
                        {item.estimateGrowthRate}
                      </td>
                      <td className="text-right py-2">{item.publishedNav.toFixed(4)}</td>
                      <td className="text-center py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddFund(item.code, item.name)}
                          disabled={addingCode === item.code || fundManager.hasFund(item.code)}
                        >
                          {addingCode === item.code ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : fundManager.hasFund(item.code) ? (
                            '已添加'
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
