/**
 * Button 组件单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button 组件', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole('button', { name: /点击我/i })).toBeInTheDocument();
  });

  it('应该处理点击事件', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该支持禁用状态', () => {
    render(<Button disabled>禁用按钮</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('应该支持默认变体', () => {
    render(<Button>默认</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
  });

  it('应该支持 destructive 变体', () => {
    render(<Button variant="destructive">删除</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('bg-destructive');
    expect(button).toHaveClass('text-white');
  });

  it('应该支持 outline 变体', () => {
    render(<Button variant="outline">边框</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('bg-background');
  });

  it('应该支持 ghost 变体', () => {
    render(<Button variant="ghost">幽灵</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('应该支持 link 变体', () => {
    render(<Button variant="link">链接</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('underline-offset-4');
    expect(button).toHaveClass('hover:underline');
  });

  it('应该支持默认尺寸', () => {
    render(<Button size="default">默认尺寸</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('h-9');
  });

  it('应该支持 sm 尺寸', () => {
    render(<Button size="sm">小尺寸</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('h-8');
  });

  it('应该支持 lg 尺寸', () => {
    render(<Button size="lg">大尺寸</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('h-10');
  });

  it('应该支持 icon 尺寸', () => {
    render(<Button size="icon">图标</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('size-9');
  });

  it('应该支持 asChild 属性', () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>
    );
    
    expect(screen.getByRole('link', { name: /链接按钮/i })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('应该支持自定义 className', () => {
    render(<Button className="custom-class">自定义类</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('custom-class');
  });

  it('应该支持多次点击', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>多次点击</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('禁用状态下不应该触发点击事件', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>禁用</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
