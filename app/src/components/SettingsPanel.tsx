/**
 * 设置面板组件
 * @module components/SettingsPanel
 * @description 配置基金数据获取参数
 */

import { useState, useEffect } from 'react';
import { getConfig, updateConfig, setRequestInterval, getRequestInterval, resetConfig } from '@/services/config';
import { storage, StorageKey } from '@/services/storage';
import { fundManager } from '@/services/fundManager';
import { fundService } from '@/services/fundService';
import { navService } from '@/services/navService';
import { cache } from '@/services/cache';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Settings, Download, Upload, Trash2, RotateCcw, Database } from 'lucide-react';

/**
 * 设置面板组件
 */
export function SettingsPanel() {
  const [requestInterval, setRequestIntervalState] = useState(getRequestInterval());
  const [baseURL, setBaseURL] = useState(getConfig().baseURL);
  const [timeout, setTimeout] = useState(getConfig().timeout);

  // 加载设置
  useEffect(() => {
    const savedSettings = storage.get<{
      requestInterval?: number;
      baseURL?: string;
      timeout?: number;
    }>(StorageKey.REQUEST_CONFIG, {});
    if (savedSettings.requestInterval) {
      setRequestIntervalState(savedSettings.requestInterval);
    }
    if (savedSettings.baseURL) {
      setBaseURL(savedSettings.baseURL);
    }
    if (savedSettings.timeout) {
      setTimeout(savedSettings.timeout);
    }
  }, []);

  // 保存请求间隔设置
  const handleSaveInterval = () => {
    setRequestInterval(requestInterval);
    storage.set(StorageKey.REQUEST_CONFIG, {
      ...getConfig(),
      requestInterval
    });
    toast.success(`请求间隔已设置为 ${requestInterval}ms`);
  };

  // 保存基础URL设置
  const handleSaveBaseURL = () => {
    updateConfig({ baseURL });
    storage.set(StorageKey.REQUEST_CONFIG, {
      ...getConfig(),
      baseURL
    });
    toast.success('API地址已更新');
  };

  // 保存超时设置
  const handleSaveTimeout = () => {
    updateConfig({ timeout });
    storage.set(StorageKey.REQUEST_CONFIG, {
      ...getConfig(),
      timeout
    });
    toast.success(`超时时间已设置为 ${timeout}ms`);
  };

  // 重置设置
  const handleReset = () => {
    resetConfig();
    setRequestIntervalState(getRequestInterval());
    setBaseURL(getConfig().baseURL);
    setTimeout(getConfig().timeout);
    storage.remove(StorageKey.REQUEST_CONFIG);
    toast.success('设置已重置为默认值');
  };

  // 清除缓存
  const handleClearCache = () => {
    cache.clear();
    fundService.clearCache();
    navService.clearCache();
    toast.success('缓存已清除');
  };

  // 导出数据
  const handleExport = () => {
    const data = fundManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fund_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('数据已导出');
  };

  // 导入数据
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = fundManager.importData(content);
        if (success) {
          toast.success('数据导入成功');
          window.location.reload();
        } else {
          toast.error('数据导入失败');
        }
      } catch (error) {
        toast.error('数据导入失败');
      }
    };
    reader.readAsText(file);
  };

  // 清空所有数据
  const handleClearAll = () => {
    fundManager.clearAllFunds();
    cache.clear();
    toast.success('所有基金数据已清空');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* 请求设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            请求设置
          </CardTitle>
          <CardDescription>
            配置数据请求的间隔时间和超时设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 请求间隔 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>请求间隔: {requestInterval}ms</Label>
              <Button size="sm" onClick={handleSaveInterval}>保存</Button>
            </div>
            <Slider
              value={[requestInterval]}
              onValueChange={([value]) => setRequestIntervalState(value)}
              min={100}
              max={5000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">
              设置连续请求之间的最小间隔时间，避免请求过于频繁导致服务不可用
            </p>
          </div>

          {/* API地址 */}
          <div className="space-y-2">
            <Label>API基础地址</Label>
            <div className="flex gap-2">
              <Input
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="http://45.152.66.117:8080/api/public"
              />
              <Button onClick={handleSaveBaseURL}>保存</Button>
            </div>
          </div>

          {/* 超时时间 */}
          <div className="space-y-2">
            <Label>请求超时: {timeout}ms</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value) || 120000)}
                min={10000}
                max={300000}
                step={5000}
              />
              <Button onClick={handleSaveTimeout}>保存</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              请求超时时间，建议设置为120秒以上（AKTools服务器响应较慢）
            </p>
          </div>

          {/* 重置按钮 */}
          <Button variant="outline" onClick={handleReset} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            重置为默认设置
          </Button>
        </CardContent>
      </Card>

      {/* 缓存管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            缓存管理
          </CardTitle>
          <CardDescription>
            清除缓存以获取最新数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleClearCache} className="w-full">
            <Trash2 className="w-4 h-4 mr-2" />
            清除缓存
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            清除缓存后，下次访问将重新从服务器获取数据
          </p>
        </CardContent>
      </Card>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">数据管理</CardTitle>
          <CardDescription>
            导入、导出或清空基金数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Label className="cursor-pointer">
              <Input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <div className="flex items-center justify-center w-full h-10 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                导入数据
              </div>
            </Label>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                清空所有数据
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清空所有数据？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将删除所有关注的基金数据，不可恢复。请确保已备份重要数据。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive">
                  确认清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* 关于 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">关于</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>基金数据管理系统 v1.1</p>
            <p>数据来源: AKShare / AKTools</p>
            <p>数据接口: http://45.152.66.117:8080</p>
            <p className="text-xs mt-2 text-orange-500">
              注意：AKTools服务器响应较慢，如遇加载失败请稍后重试
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
