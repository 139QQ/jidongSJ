# MCP 服务器安装和使用指南

本文档介绍了已安装的 MCP 服务器和相关库的使用方法。

## 已安装的 MCP 相关包

### 1. @modelcontextprotocol/sdk
- **版本**: 1.27.1
- **描述**: Model Context Protocol 官方 TypeScript SDK
- **用途**: 用于构建 MCP 服务器和客户端
- **安装位置**: node_modules/@modelcontextprotocol/sdk

### 2. @langchain/mcp-adapters
- **版本**: 1.1.3
- **描述**: LangChain.js MCP 适配器
- **用途**: 允许将 MCP 服务与 LangChain.js 应用程序集成
- **安装位置**: node_modules/@langchain/mcp-adapters

### 3. mcp-server-supos
- **描述**: supOS 工业操作系统的 MCP 服务器
- **用途**: 提供 supOS OpenAPI 的 MCP 接口
- **安装位置**: C:/Users/Administrator/AppData/Roaming/npm/node_modules/mcp-server-supos

## 已配置的 MCP 服务器

以下 MCP 服务器已配置在 cline_chinese_mcp_settings.json 中：

### 1. Playwright MCP
功能：浏览器自动化测试

### 2. Semgrep MCP
功能：代码安全扫描

### 3. React MCP
功能：React 应用开发辅助

### 4. Filesystem MCP
功能：文件系统访问

### 5. SQLite MCP
功能：数据库操作

### 6. GitHub MCP
功能：GitHub API 操作

### 7. Git MCP
功能：Git 版本控制操作

### 8. supOS MCP (新增)
功能：supOS 工业操作系统 API

**可用工具**:
- get-model-topic-tree: 查询 topic 树结构
- get-model-topic-detail: 获取 topic 详情

**配置说明**:
1. 访问 supOS 社区版 (https://supos-demo.supos.app/) 获取 API URL
2. 登录后进入 DataModeling -> 选择 topic -> Data Operation -> Fetch 获取 API Key
3. 将 SUPOS_API_KEY 和 SUPOS_API_URL 替换为实际值

## 使用示例

### 使用 @langchain/mcp-adapters

import { McpClient } from '@langchain/mcp-adapters';

// 创建 MCP 客户端
const client = new McpClient({
  server: {
    command: 'node',
    args: ['path/to/mcp-server.js']
  }
});

// 连接到服务器
await client.connect();

// 列出可用工具
const tools = await client.listTools();

// 调用工具
const result = await client.callTool('tool-name', { param: 'value' });

## 相关资源

- MCP 官方文档：https://modelcontextprotocol.io/
- LangChain.js MCP Adapters: https://github.com/langchain-ai/langchainjs/tree/main/libs/langchain-mcp-adapters
- supOS MCP Server: https://github.com/punkpeye/mcp-server-supos
