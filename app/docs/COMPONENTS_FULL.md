# 组件文档

生成时间：2026-02-28 21:08:41

---

## FundList

_我的基金列表组件，展示用户关注的基金_

**文件**: `src/components/FundList.tsx`

### Props

```typescript
interface FundItemProps {
fund: UserFund;
  onRefresh: (code: string) => void;
  onDelete: (code: string) => void;
  onDetail: (fund: UserFund) => void;
  loading: boolean;
}
```

---

## FundRankList

_基金排行榜组件，支持按类型筛选和加载更多_

**文件**: `src/components/FundRankList.tsx`

---

## FundSearchDialog

_基金搜索对话框，支持代码和名称搜索_

**文件**: `src/components/FundSearchDialog.tsx`

### Props

```typescript
interface FundSearchDialogProps {
/** 是否打开 */
  open: boolean;
  /** 打开状态改变回调 */
  onOpenChange: (open: boolean) => void;
  /** 选择基金回调 */
  onSelect: (code: string, name: string) => Promise<boolean>;
}
```

---

## FundDetailDialog

_基金详情对话框，展示基金详细信息和持有情况_

**文件**: `src/components/FundDetailDialog.tsx`

### Props

```typescript
interface FundDetailDialogProps {
/** 基金数据 */
  fund: UserFund;
  /** 是否打开 */
  open: boolean;
  /** 打开状态改变回调 */
  onOpenChange: (open: boolean) => void;
  /** 更新基金回调 */
  onUpdate: (data: FundUpdateData) => boolean;
}
```

---

## NavChart

_净值走势图组件，使用 Recharts 绘制_

**文件**: `src/components/NavChart.tsx`

### Props

```typescript
interface NavChartProps {
/** 净值数据 */
  data: FundNAV[];
  /** 加载状态 */
  loading?: boolean;
  /** 图表类型 */
  type?: 'line' | 'area';
}
```

---
