/**
 * 测试示例文件
 * 展示如何使用 Vitest + Testing Library 测试 React 组件
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '../components/ui/button';

// 模拟自定义钩子
vi.mock('../hooks/use-mobile', () => ({
  useMobile: () => ({ isMobile: false }),
}));

describe('UI 组件测试', () => {
  describe('Button 组件', () => {
    it('应该渲染按钮文本', () => {
      render(<Button>点击我</Button>);
      expect(screen.getByRole('button', { name: /点击我/i })).toBeInTheDocument();
    });

    it('应该处理点击事件', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>点击</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('应该支持禁用状态', () => {
      render(<Button disabled>禁用按钮</Button>);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('应该支持不同的变体', () => {
      const { container: defaultBtn } = render(<Button>默认</Button>);
      const { container: outlineBtn } = render(<Button variant="outline">边框</Button>);
      
      expect(defaultBtn.firstChild).toHaveClass('bg-primary');
      expect(outlineBtn.firstChild).toHaveClass('border');
    });

    it('应该支持不同的尺寸', () => {
      const { container: sm } = render(<Button size="sm">小</Button>);
      const { container: lg } = render(<Button size="lg">大</Button>);
      
      expect(sm.firstChild).toHaveClass('h-8');
      expect(lg.firstChild).toHaveClass('h-10');
    });
  });
});

describe('辅助函数测试', () => {
  it('应该正确格式化数字', () => {
    const formatNumber = (num: number): string => {
      return num.toLocaleString('zh-CN');
    };
    
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });

  it('应该正确计算百分比', () => {
    const calculatePercent = (part: number, total: number): string => {
      return ((part / total) * 100).toFixed(2) + '%';
    };
    
    expect(calculatePercent(50, 100)).toBe('50.00%');
    expect(calculatePercent(1, 3)).toBe('33.33%');
  });
});

describe('异步操作测试', () => {
  it('应该等待异步操作完成', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ name: '测试数据' });
    
    const result = await mockFetch();
    
    await waitFor(() => {
      expect(result).toEqual({ name: '测试数据' });
    });
  });

  it('应该处理异步错误', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('网络错误'));
    
    await expect(mockFetch()).rejects.toThrow('网络错误');
  });
});
