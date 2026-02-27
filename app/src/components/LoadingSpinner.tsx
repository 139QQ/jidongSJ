/**
 * 加载动画组件
 * @module components/LoadingSpinner
 * @description 显示加载状态
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = '加载中...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className={`${sizeClass[size]} animate-spin text-muted-foreground mb-4`} />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
