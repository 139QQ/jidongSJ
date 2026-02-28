# 文档索引

生成时间：2026-02-28 17:17:23

## 快速链接

| 文档 | 说明 |
|------|------|
| [API 完整参考](API_REFERENCE_FULL.md) | AKShare 所有基金数据接口的完整参考 |
| [服务模块文档](SERVICES_FULL.md) | 项目服务层模块的详细说明 |
| [组件文档](COMPONENTS_FULL.md) | React 组件的 Props 和使用说明 |
| [缓存策略](CACHE_STRATEGY.md) | 各级缓存的策略和实现说明 |
| [AKShare 官方文档](https://akshare.akfamily.xyz/data/fund/fund_public.html) | AKShare 官方文档链接 |

## 接口状态概览

| 接口类别 | 正常 | 异常 | 总计 |
|----------|------|------|------|
| 基础数据 | 3 | 0 | 3 |
| ETF 基金 | 1 | 0 | 1 |
| 货币基金 | 2 | 0 | 2 |
| 净值估算 | 1 | 0 | 1 |
| LOF 基金 | 0 | 1 | 1 |
| 详细信息 | 3 | 0 | 3 |
| 基金公告 | 3 | 0 | 3 |
| 评级经理 | 2 | 0 | 2 |
| **总计** | **15** | **1** | **16** |

## 使用说明

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生成文档
python docs/generate_api_docs.py
```

### 生产环境

```bash
# 构建
npm run build

# 预览
npm run preview
```

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **图表**: Recharts
- **数据源**: AKShare / AKTools
- **缓存**: 三级缓存架构（内存 + localStorage + IndexedDB）

---

*文档由脚本自动生成，最后更新：2026-02-28 17:17:23*
