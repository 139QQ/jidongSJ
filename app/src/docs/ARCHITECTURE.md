# 架构设计文档

## 系统架构

基金数据管理系统采用模块化设计，分为以下几个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层 (UI)                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  FundList   │ │ FundDetail  │ │  Settings   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                        业务逻辑层                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ useFundMgr  │ │ useNavHist  │ │ useFundRank │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                        服务层                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │fundService  │ │ navService  │ │fundManager  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   storage   │ │  scheduler  │ │   config    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                        数据层                                │
│  ┌─────────────┐ ┌─────────────┐                            │
│  │  localStorage│ │  AKTools API│                            │
│  └─────────────┘ └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## 模块职责

### 1. 表现层 (UI Layer)

负责用户界面的渲染和交互。

**组件列表**:
- `FundList`: 基金列表展示和管理
- `FundSearchDialog`: 基金搜索对话框
- `FundDetailDialog`: 基金详情展示
- `FundRankList`: 基金排行展示
- `NavChart`: 净值走势图
- `SettingsPanel`: 设置面板

### 2. 业务逻辑层 (Business Logic Layer)

封装业务逻辑，提供可复用的 Hooks。

**Hooks 列表**:
- `useFundManager`: 基金管理逻辑
- `useNavHistory`: 净值历史数据获取
- `useFundRank`: 基金排行数据获取

### 3. 服务层 (Service Layer)

提供底层服务支持。

**服务列表**:
- `fundService`: 基金数据获取服务
- `navService`: 净值数据获取服务
- `fundManager`: 本地基金管理
- `storage`: 本地存储服务
- `requestScheduler`: 请求调度服务
- `config`: 配置管理服务

### 4. 数据层 (Data Layer)

数据的持久化和获取。

**数据源**:
- `localStorage`: 本地数据存储
- `AKTools API`: 远程数据接口

## 数据流

### 基金数据获取流程

```
用户操作 → UI组件 → Hook → Service → API
                ↓
            更新状态 → 重新渲染UI
                ↓
            持久化存储 (localStorage)
```

### 净值数据获取流程

```
用户查看详情 → FundDetailDialog → useNavHistory → navService → API
                                          ↓
                                    缓存到localStorage
                                          ↓
                                    渲染NavChart
```

## 核心设计模式

### 1. 单例模式

`RequestScheduler` 和 `FundManager` 使用单例模式：

```typescript
export class RequestScheduler {
  private static instance: RequestScheduler;
  
  public static getInstance(): RequestScheduler {
    if (!RequestScheduler.instance) {
      RequestScheduler.instance = new RequestScheduler();
    }
    return RequestScheduler.instance;
  }
}
```

### 2. 观察者模式

React 的 useState 和 useEffect 实现了观察者模式：

```typescript
const [funds, setFunds] = useState<UserFund[]>([]);

useEffect(() => {
  // 当 funds 变化时执行
  updateUI();
}, [funds]);
```

### 3. 工厂模式

基金对象的创建使用工厂模式：

```typescript
async addFund(code: string, ...): Promise<UserFund | null> {
  // 获取基础数据
  const fundInfo = await this.fetchFundInfo(code);
  // 创建基金对象
  const userFund: UserFund = {
    id: this.generateId(),
    code: fundInfo.code,
    name: fundInfo.name,
    // ...
  };
  return userFund;
}
```

### 4. 策略模式

基金类型推断使用策略模式：

```typescript
private inferFundType(name: string): FundType {
  if (name.includes('货币')) return FundType.MONEY;
  if (name.includes('债券')) return FundType.BOND;
  if (name.includes('指数')) return FundType.INDEX;
  // ...
}
```

## 请求调度机制

### 问题

频繁请求 API 可能导致：
1. 服务器压力过大
2. 请求被限流或封禁
3. 用户体验下降

### 解决方案

使用 `RequestScheduler` 实现请求队列：

```typescript
class RequestScheduler {
  private requestQueue: Array<{
    task: RequestTask<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  
  async schedule<T>(task: RequestTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    // 按间隔依次执行请求
  }
}
```

## 数据缓存策略

### 缓存层级

1. **内存缓存**: React state 中的数据
2. **持久化缓存**: localStorage 中的数据

### 缓存更新策略

```typescript
// 1. 优先从内存获取
const [funds, setFunds] = useState<UserFund[]>([]);

// 2. 内存未命中，从 localStorage 获取
const loadFromStorage = () => {
  const saved = storage.get(StorageKey.USER_FUNDS, []);
  setFunds(saved);
};

// 3. 数据更新时同步更新内存和存储
const updateFund = (code: string, data: FundUpdateData) => {
  const updated = { ...fund, ...data };
  setFunds(prev => prev.map(f => f.code === code ? updated : f));
  storage.set(StorageKey.USER_FUNDS, updatedFunds);
};
```

## 错误处理机制

### 错误分类

1. **网络错误**: 请求超时、连接失败
2. **API 错误**: 接口返回错误状态码
3. **数据错误**: 返回数据格式异常
4. **业务错误**: 基金不存在、重复添加等

### 错误处理策略

```typescript
try {
  const data = await apiRequest();
} catch (error) {
  if (error.code === 'TIMEOUT') {
    // 超时重试
    return retryRequest();
  }
  if (error.code === 'NETWORK_ERROR') {
    // 网络错误，使用缓存数据
    return getCachedData();
  }
  // 其他错误，显示提示
  toast.error(error.message);
}
```

## 性能优化

### 1. 防抖搜索

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    searchFunds(keyword);
  }, 500);
  return () => clearTimeout(timer);
}, [keyword]);
```

### 2. 虚拟列表

对于大量基金数据，使用虚拟列表优化渲染性能。

### 3. 懒加载

净值历史数据按需加载，避免一次性加载大量数据。

### 4. 数据分页

基金列表支持分页，减少单次渲染的数据量。

## 安全考虑

### 1. XSS 防护

- 使用 React 的自动转义
- 对用户输入进行验证

### 2. CSRF 防护

- 使用 CORS 限制
- 验证请求来源

### 3. 数据验证

```typescript
function validateFundCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
```

## 扩展性设计

### 1. 新增数据源

实现新的 Service 类：

```typescript
class NewFundService {
  async getFundList(): Promise<Fund[]> {
    // 实现新的数据源
  }
}
```

### 2. 新增基金类型

扩展 FundType 枚举：

```typescript
export enum FundType {
  // ... 现有类型
  NEW_TYPE = '新类型'
}
```

### 3. 新增图表类型

扩展 NavChart 组件：

```typescript
interface NavChartProps {
  type?: 'line' | 'area' | 'bar' | 'candlestick';
}
```

## 测试策略

### 单元测试

- Service 层函数测试
- Hook 逻辑测试
- 工具函数测试

### 集成测试

- 组件交互测试
- 数据流测试

### E2E 测试

- 用户操作流程测试
- 端到端功能验证
