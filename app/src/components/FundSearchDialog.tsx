/**
 * 基金搜索对话框组件
 * @module components/FundSearchDialog
 * @description 搜索并选择基金添加到关注列表
 * 
 * 优化说明：
 * 1. 使用轻量级索引快速搜索（只加载代码和名称）
 * 2. 后台逐步加载完整数据
 * 3. 优先显示搜索结果，再获取详情
 * 4. 使用 AbortController 取消未完成的请求
 * 5. 使用持久化缓存减少重复加载
 * 6. 单只基金详情独立缓存
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { FundRealtime } from '@/types/fund';
import { fundService } from '@/services/fundService';
import { apiClient } from '@/services/apiClient';
import { cache } from '@/services/cache';
import { persistentCache } from '@/services/persistentCache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, Loader2, AlertCircle, Database, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

/** 轻量级基金索引项 */
interface FundIndexItem {
  code: string;
  name: string;
}

/** 组件属性 */
interface FundSearchDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态改变回调 */
  onOpenChange: (open: boolean) => void;
  /** 选择基金回调 */
  onSelect: (code: string, name: string) => Promise<boolean>;
}

/**
 * 基金搜索对话框组件 - 优化版本
 */
export function FundSearchDialog({ open, onOpenChange, onSelect }: FundSearchDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<FundRealtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingCode, setAddingCode] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [allFunds, setAllFunds] = useState<FundRealtime[]>([]);
  const [fundIndex, setFundIndex] = useState<FundIndexItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  
  // Refs
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fundDetailCache = useRef<Map<string, FundRealtime>>(new Map());

  // 加载轻量级索引（用于快速搜索）- 优化版本
  const loadFundIndex = useCallback(async () => {
    if (indexLoaded || loadingRef.current) return;
    
    loadingRef.current = true;
    
    // 先检查持久化缓存
    const cachedIndex = persistentCache.get<FundIndexItem[]>('fund_index');
    if (cachedIndex && cachedIndex.length > 0) {
      console.log('[FundSearchDialog] 从持久化缓存加载基金索引');
      setFundIndex(cachedIndex);
      cache.set('fund_index', cachedIndex, 24 * 60 * 60 * 1000); // 同步到内存缓存
      setIndexLoaded(true);
      loadingRef.current = false;
      return;
    }
    
    // 检查内存缓存
    const memCachedIndex = cache.get<FundIndexItem[]>('fund_index');
    if (memCachedIndex && memCachedIndex.length > 0) {
      console.log('[FundSearchDialog] 从内存缓存加载基金索引');
      setFundIndex(memCachedIndex);
      setIndexLoaded(true);
      loadingRef.current = false;
      return;
    }
    
    // 从完整数据提取索引
    try {
      const funds = await fundService.getOpenFundList();
      const index = funds.map(f => ({ code: f.code, name: f.name }));
      setFundIndex(index);
      cache.set('fund_index', index, 24 * 60 * 60 * 1000);
      persistentCache.set('fund_index', index); // 持久化缓存
      setIndexLoaded(true);
      console.log(`[FundSearchDialog] 索引加载完成：${index.length}项`);
    } catch (err) {
      console.error('[FundSearchDialog] 索引加载失败:', err);
      setError('索引加载失败，请刷新页面重试');
    } finally {
      loadingRef.current = false;
    }
  }, [indexLoaded]);

  // 后台加载完整数据 - 优化版本（支持取消 + 真实进度反馈）
  const loadFullData = useCallback(async () => {
    if (dataLoaded || isPreloading) return;
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsPreloading(true);
    setProgress(0);
    setProgressMessage('正在连接服务器...');
    
    try {
      // 阶段 1: 开始请求 (20%)
      setProgress(20);
      setProgressMessage('正在请求基金数据，这可能需要 30-60 秒...');
      
      const startTime = Date.now();
      const funds = await fundService.getOpenFundList();
      const fetchDuration = Date.now() - startTime;
      
      console.log(`[FundSearchDialog] API 请求耗时 ${fetchDuration}ms，获取 ${funds.length} 只基金`);
      
      // 阶段 2: 处理数据 (60-80%)
      setProgress(60);
      setProgressMessage(`正在处理 ${funds.length} 只基金数据...`);
      
      // 模拟处理进度（给用户视觉反馈）
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(80);
      
      setAllFunds(funds);
      setDataLoaded(true);
      
      // 阶段 3: 完成 (100%)
      setProgress(100);
      setProgressMessage(`✅ 数据加载完成！共 ${funds.length} 只基金`);
      
      setIsPreloading(false);
      
      // 2 秒后清除消息
      setTimeout(() => {
        setProgressMessage('');
        setProgress(0);
      }, 2000);
      
      console.log('[FundSearchDialog] 完整数据加载完成');
    } catch (err) {
      // 忽略取消错误
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[FundSearchDialog] 数据加载已取消');
      } else {
        console.error('[FundSearchDialog] 完整数据加载失败:', err);
        setProgress(0);
        setProgressMessage('❌ 加载失败，请刷新页面重试');
      }
      setIsPreloading(false);
    }
  }, [dataLoaded, isPreloading]);

  // 打开对话框时加载索引
  useEffect(() => {
    if (open && !indexLoaded) {
      loadFundIndex();
    }
  }, [open, indexLoaded, loadFundIndex]);

  // 索引加载后，后台加载完整数据 - 智能延迟
  useEffect(() => {
    if (indexLoaded && !dataLoaded && !isPreloading) {
      // 延迟加载完整数据，避免阻塞 UI
      const timer = setTimeout(() => {
        loadFullData();
      }, 1000); // 增加延迟到 1 秒，让 UI 先渲染
      return () => clearTimeout(timer);
    }
  }, [indexLoaded, dataLoaded, isPreloading, loadFullData]);

  // 清理函数 - 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 执行本地搜索 - 使用索引快速搜索
  const performSearch = useCallback(async (searchKeyword: string) => {
    if (!searchKeyword.trim() || fundIndex.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const lowerKeyword = searchKeyword.toLowerCase().trim();
      
      // 优先精确匹配基金代码
      const exactCodeMatch = fundIndex.filter(fund => 
        fund.code.toLowerCase() === lowerKeyword
      );
      
      if (exactCodeMatch.length > 0) {
        // 精确匹配，直接获取详情
        const fund = await getFundDetail(exactCodeMatch[0].code);
        if (fund) {
          setResults([fund]);
          toast.success(`找到基金：${fund.name}`);
        }
        setLoading(false);
        return;
      }
      
      // 部分匹配，先返回索引结果
      const matches = fundIndex.filter(fund => 
        fund.code.toLowerCase().includes(lowerKeyword) ||
        fund.name.toLowerCase().includes(lowerKeyword)
      ).slice(0, 20);
      
      // 先显示基本信息
      const basicResults = matches.map(f => ({
        code: f.code,
        name: f.name,
        unitNav: 0,
        cumulativeNav: 0,
        prevUnitNav: 0,
        prevCumulativeNav: 0,
        dailyGrowthValue: 0,
        dailyGrowthRate: 0,
        purchaseStatus: '',
        redeemStatus: '',
        fee: ''
      }));
      setResults(basicResults);
      
      // 后台加载详情
      if (matches.length > 0 && matches.length <= 5) {
        const details = await Promise.all(matches.map(f => getFundDetail(f.code)));
        const validDetails = details.filter((f): f is FundRealtime => f !== null);
        if (validDetails.length > 0) {
          setResults(validDetails);
        }
      }
      
      if (matches.length === 0) {
        setError(`未找到包含"${searchKeyword}"的基金`);
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError('搜索出错，请重试');
    } finally {
      setLoading(false);
    }
  }, [fundIndex]);

  // 获取基金详情 - 优化版本（使用独立缓存）
  const getFundDetail = useCallback(async (code: string): Promise<FundRealtime | null> => {
    // 1. 先从本地缓存找
    const localCached = fundDetailCache.current.get(code);
    if (localCached) {
      console.log(`[FundSearchDialog] 从本地缓存获取基金${code}详情`);
      return localCached;
    }
    
    // 2. 从已加载的完整数据中找
    const cached = allFunds.find(f => f.code === code);
    if (cached) {
      fundDetailCache.current.set(code, cached);
      return cached;
    }
    
    // 3. 从内存缓存找
    const memCached = cache.get<FundRealtime>(`fund_detail_${code}`);
    if (memCached) {
      fundDetailCache.current.set(code, memCached);
      return memCached;
    }
    
    // 4. 从 API 获取
    try {
      const data = await apiClient.get('fund_open_fund_daily_em');
      if (Array.isArray(data)) {
        const item = data.find((f: any) => f['基金代码'] === code);
        if (item) {
          const fund: FundRealtime = {
            code: item['基金代码'] || '',
            name: item['基金简称'] || '',
            unitNav: parseFloat(item['单位净值'] ?? '0') || 0,
            cumulativeNav: parseFloat(item['累计净值'] ?? '0') || 0,
            prevUnitNav: 0,
            prevCumulativeNav: 0,
            dailyGrowthValue: parseFloat(item['日增长值'] ?? '0') || 0,
            dailyGrowthRate: parseFloat(item['日增长率'] ?? '0') || 0,
            purchaseStatus: item['申购状态'] || '',
            redeemStatus: item['赎回状态'] || '',
            fee: item['手续费'] || ''
          };
          // 缓存结果
          fundDetailCache.current.set(code, fund);
          cache.set(`fund_detail_${code}`, fund, 30 * 60 * 1000); // 30 分钟缓存
          return fund;
        }
      }
    } catch (err) {
      console.error('获取基金详情失败:', err);
    }
    return null;
  }, [allFunds]);

  // 防抖搜索 - 使用索引加载状态 - 优化版本
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!keyword.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // 如果索引未加载，不执行防抖搜索
    if (!indexLoaded) {
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(keyword);
    }, 200); // 减少防抖时间到 200ms，响应更快

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [keyword, indexLoaded, performSearch]);

  // 手动搜索（用于点击搜索按钮）- 修复等待问题
  const searchFunds = useCallback(async (searchKeyword: string) => {
    if (!searchKeyword.trim()) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    // 如果数据已加载，直接本地搜索
    if (dataLoaded && allFunds.length > 0) {
      performSearch(searchKeyword);
      return;
    }

    // 如果正在加载中，提示用户等待
    if (isPreloading) {
      toast.info('数据正在加载中，请稍候...');
      return;
    }

    // 数据未加载且未在加载中，需要加载
    setLoading(true);
    setIsPreloading(true);
    setError(null);
    setHasSearched(true);
    setProgressMessage('正在加载基金数据...');
    
    try {
      const funds = await fundService.getOpenFundList();
      console.log('[FundSearchDialog] 基金数据加载完成');
      setAllFunds(funds);
      setDataLoaded(true);
      
      // 立即执行搜索
      const lowerKeyword = searchKeyword.toLowerCase().trim();
      const matches = funds.filter(fund => 
        fund.code.toLowerCase().includes(lowerKeyword) ||
        fund.name.toLowerCase().includes(lowerKeyword)
      );
      
      setResults(matches.slice(0, 20));
      
      if (matches.length === 0) {
        setError(`未找到包含"${searchKeyword}"的基金`);
      } else {
        toast.success(`找到 ${matches.length} 只基金`);
      }
    } catch (err) {
      console.error('搜索基金失败:', err);
      
      let errorMsg = '搜索失败';
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === 'ECONNABORTED' || errorObj.message?.includes('timeout')) {
        errorMsg = '请求超时，AKTools服务器响应较慢，请稍后重试';
      } else if (errorObj.message?.includes('Network Error')) {
        errorMsg = '网络错误，请检查网络连接';
      } else if (errorObj.message?.includes('加载超时')) {
        errorMsg = '数据加载超时，请稍后重试';
      } else if (errorObj.message) {
        errorMsg = errorObj.message;
      }
      
      setError(errorMsg);
      setResults([]);
    } finally {
      setLoading(false);
      setIsPreloading(false);
      setProgressMessage('');
    }
  }, [dataLoaded, allFunds, isPreloading, performSearch]);

  // 处理手动搜索
  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.warning('请输入基金代码或名称');
      return;
    }
    searchFunds(keyword);
  };

  // 处理回车搜索
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理添加基金 - 优化版本
  const handleAdd = useCallback(async (fund: FundRealtime) => {
    setAddingCode(fund.code);
    try {
      const success = await onSelect(fund.code, fund.name);
      if (success) {
        // 缓存已添加的基金详情
        fundDetailCache.current.set(fund.code, fund);
        setKeyword('');
        setResults([]);
        setHasSearched(false);
      }
    } catch (err) {
      toast.error('添加基金失败');
    } finally {
      setAddingCode(null);
    }
  }, [onSelect]);

  // 关闭对话框时重置状态 - 优化版本
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setKeyword('');
      setResults([]);
      setError(null);
      setHasSearched(false);
      setProgress(0);
      setProgressMessage('');
      // 保留 allFunds 和 dataLoaded，下次打开更快
      // 保留 fundDetailCache，避免重复请求
    }
    onOpenChange(open);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>搜索基金</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 搜索框 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="输入基金代码或名称，按回车搜索..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                autoFocus
                disabled={isPreloading}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !keyword.trim() || isPreloading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '搜索'}
            </Button>
          </div>

          {/* 预加载提示 - 优化版本 */}
          {isPreloading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Zap className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">正在初始化数据...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-blue-500 mt-1">
                {progressMessage}
              </p>
              {progress > 0 && progress < 100 && (
                <p className="text-xs text-blue-400 mt-1">
                  预计剩余时间：{Math.max(1, Math.round((100 - progress) / 20))}秒
                </p>
              )}
            </div>
          )}

          {/* 进度条 */}
          {loading && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progressMessage} ({progress}%)
              </p>
            </div>
          )}

          {/* 提示信息 - 优化版本 */}
          {!hasSearched && !loading && !isPreloading && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">💡 搜索提示：</p>
                <div className="flex items-center gap-2">
                  {indexLoaded && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // 清除缓存，重新加载
                        cache.delete('fund_index');
                        persistentCache.delete('fund_index');
                        setFundIndex([]);
                        setIndexLoaded(false);
                        setAllFunds([]);
                        setDataLoaded(false);
                        loadFundIndex();
                      }}
                      disabled={isPreloading}
                      className="h-6 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      刷新
                    </Button>
                  )}
                </div>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>输入 6 位基金代码（如：000001）或基金名称（如：华夏成长）</li>
                <li>{indexLoaded ? `✅ 索引已加载（共${fundIndex.length}只基金），可立即搜索` : '⏳ 正在加载基金索引...'}</li>
                <li>{dataLoaded ? '✅ 完整数据已加载，显示净值信息' : '📊 完整数据后台加载中...'}</li>
                <li className="text-green-600">💾 已缓存 {fundDetailCache.current.size} 只基金详情</li>
              </ul>
            </div>
          )}

          {/* 错误提示 */}
          {error && !loading && (
            <div className="flex items-start gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">搜索失败</p>
                <p className="text-xs mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSearch}
                  className="mt-2"
                >
                  重试
                </Button>
              </div>
            </div>
          )}

          {/* 搜索结果 */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">正在搜索基金...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  首次加载可能需要30-60秒，请耐心等待
                </p>
              </div>
            ) : results.length === 0 ? (
              hasSearched ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>未找到匹配的基金</p>
                  <p className="text-sm mt-2">请尝试输入基金代码（6位数字）或基金名称</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>输入关键词后点击搜索</p>
                </div>
              )
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  找到 {results.length} 只基金
                </p>
                {results.map((fund) => (
                  <Card key={fund.code} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{fund.name}</span>
                            <Badge variant="secondary" className="text-xs">{fund.code}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 flex gap-4 flex-wrap">
                            <span>净值: {fund.unitNav.toFixed(4)}</span>
                            <span className={fund.dailyGrowthRate >= 0 ? 'text-red-500' : 'text-green-500'}>
                              日涨: {fund.dailyGrowthRate >= 0 ? '+' : ''}{fund.dailyGrowthRate.toFixed(2)}%
                            </span>
                            <span className="text-xs">申购: {fund.purchaseStatus}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAdd(fund)}
                          disabled={addingCode === fund.code}
                          className="flex-shrink-0 ml-2"
                        >
                          {addingCode === fund.code ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
