# 更新日志 (Changelog)

所有值得注意的项目变更都将记录在这个文件中。

本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/) (SemVer)。

---

## [1.5.1] - 2026-03-01

### 修复
- **类型安全**：修复 `fundManager.ts` 中多处使用 `any` 类型的问题，改为强类型 `FundNAV`
- **性能优化 - addFund**：新增 `getFundByCode` 方法，避免每次添加基金都请求全量数据
- **性能优化 - refreshAllNavs**：从串行刷新改为 `Promise.allSettled` 并发刷新，显著提升性能
- **错误处理增强**：`getFundRank` 和 `getFundEstimate` 增加过期缓存降级机制
- **构建修复**：修复 TypeScript 编译时的未使用变量错误

### 测试
- 44 个单元测试全部通过

---

## [1.5.0] - 2026-02-28

### 新增
- **LOF 基金支持**：新增 `LOFRealtime` 类型和 `getLOFRealtime` 服务方法
- **ETF 实时行情**：新增 `ETFRealtime` 类型和 `getETFRealtime` 服务方法
- **基金分红送配**：新增 `FundDividend`、`FundSplit` 类型和相关服务方法
- **类型模块统一导出**：新增 `src/types/index.ts` 统一导出所有类型
- **服务模块统一导出**：更新 `src/services/index.ts` 导出新增服务

### 组件
- 新增 `LOFList` 组件
- 新增 `ETFList` 组件
- 新增 `DividendList` 组件

---

## [1.4.0] - 2026-02-27

### 新增
- 基金数据管理系统基础架构
- AKShare/AKTools API 集成
- 缓存管理系统
- 请求调度器
- 用户基金管理功能

### 功能
- 开放式基金列表和排行
- 基金搜索和详情
- 用户自选基金
- 净值历史查询
- 缓存策略（内存 + 持久化）

---

## [1.3.0] - 2026-02-26

### 新增
- React + TypeScript + Vite 基础框架
- shadcn/ui 组件库集成
- Tailwind CSS 样式
- 主题系统

---

## [1.2.0] - 2026-02-25

### 新增
- 项目初始化
- 基础目录结构
- 开发环境配置

---

## [1.1.0] - 2026-02-24

### 新增
- 项目规划
- 技术选型

---

## [1.0.0] - 2026-02-23

### 新增
- 项目创建

---

## 版本格式

版本格式：`[MAJOR].[MINOR].[PATCH]`

- **MAJOR**：破坏性 API 变更
- **MINOR**：新增功能（向后兼容）
- **PATCH**：Bug 修复（向后兼容）

## 发布渠道

- Beta 版本：通过 GitHub Releases 发布
- 稳定版本：通过 npm 发布

## 迁移指南

如有重大变更，将在发布说明中提供迁移指南。

---

## 更多信息

- 完整文档：参见 `/docs` 目录
- API 参考：参见 `docs/API_REFERENCE.md`
- 开发计划：参见 `docs/DEVELOPMENT_PLAN.md`
