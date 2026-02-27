#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AKShare 基金数据 API 文档生成器
============================
根据源代码自动生成完整的 API 文档

使用方法:
    python docs/generate_api_docs.py

输出:
    docs/API_REFERENCE_FULL.md - 完整的 API 文档
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"
DOCS_DIR = PROJECT_ROOT / "docs"

# AKShare 官方文档链接
AKSHARE_BASE_URL = "https://akshare.akfamily.xyz/data/fund/fund_public.html"

# 接口定义
FUND_INTERFACES = {
    # 基础数据接口
    "fund_open_fund_daily_em": {
        "name": "开放式基金实时数据",
        "description": "获取所有开放式基金的实时净值数据",
        "params": [],
        "returns": "基金列表，包含代码、名称、净值、增长率等",
        "cache_ttl": "交易时间 30 分钟，非交易时间 24 小时",
        "example": "apiClient.get('fund_open_fund_daily_em')"
    },
    "fund_open_fund_rank_em": {
        "name": "开放式基金排行",
        "description": "获取开放式基金按收益率排序的排行榜",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "values": ["全部", "股票型", "混合型", "债券型", "指数型", "QDII", "FOF"]}
        ],
        "returns": "基金排行列表，包含排名、代码、名称、各周期收益率等",
        "cache_ttl": "交易时间 10 分钟，非交易时间 2 小时",
        "example": "apiClient.get('fund_open_fund_rank_em', { symbol: '全部' })"
    },
    "fund_open_fund_info_em": {
        "name": "开放式基金历史净值",
        "description": "获取单只基金的历史净值数据",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码，如 '000001'"},
            {"name": "indicator", "type": "str", "required": True, "values": ["单位净值走势", "累计净值走势", "累计收益率走势", "同类排名走势", "同类排名百分比"]},
            {"name": "period", "type": "str", "required": True, "values": ["1 月", "3 月", "6 月", "1 年", "3 年", "5 年", "今年来", "成立来"]}
        ],
        "returns": "历史净值数据列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_open_fund_info_em', { symbol: '000001', indicator: '单位净值走势', period: '1 年' })"
    },
    # ETF 基金
    "fund_etf_fund_info_em": {
        "name": "ETF 基金历史净值",
        "description": "获取 ETF 基金的历史净值数据",
        "params": [
            {"name": "fund", "type": "str", "required": True, "desc": "⚠️ 必须使用 fund 参数，不能用 symbol", "example": "'510050'"},
            {"name": "start_date", "type": "str", "required": True, "desc": "开始日期，格式 YYYYMMDD", "example": "'20240101'"},
            {"name": "end_date", "type": "str", "required": True, "desc": "结束日期，格式 YYYYMMDD", "example": "'20241231'"}
        ],
        "returns": "ETF 基金历史净值数据",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_etf_fund_info_em', { fund: '510050', start_date: '20240101', end_date: '20241231' })"
    },
    # 货币基金
    "fund_money_fund_daily_em": {
        "name": "货币基金列表",
        "description": "获取所有货币市场基金列表",
        "params": [],
        "returns": "货币基金列表",
        "cache_ttl": "10 分钟",
        "example": "apiClient.get('fund_money_fund_daily_em')"
    },
    "fund_money_fund_info_em": {
        "name": "货币基金历史收益",
        "description": "获取货币基金的历史收益率数据",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000009'"}
        ],
        "returns": "货币基金历史收益率数据",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_money_fund_info_em', { symbol: '000009' })"
    },
    # 净值估算
    "fund_value_estimation_em": {
        "name": "基金净值估算",
        "description": "获取基金的实时估算净值数据",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "values": ["全部", "股票型", "混合型", "债券型", "指数型", "QDII", "FOF"]}
        ],
        "returns": "基金估算净值列表，包含估算值和偏差",
        "cache_ttl": "交易时间 1 分钟，非交易时间 30 分钟",
        "example": "apiClient.get('fund_value_estimation_em', { symbol: '全部' })"
    },
    # LOF 基金
    "fund_lof_spot_em": {
        "name": "LOF 基金实时数据",
        "description": "获取 LOF 基金的实时数据",
        "params": [],
        "returns": "LOF 基金实时数据列表",
        "cache_ttl": "10 分钟",
        "status": "⚠️ 服务器暂时不可用，已做降级处理",
        "example": "apiClient.get('fund_lof_spot_em')"
    },
    # 基金详细信息
    "fund_overview_em": {
        "name": "基金概况",
        "description": "获取基金的基本概况信息",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"}
        ],
        "returns": "基金概况数据，包含全称、类型、规模、管理人等",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_overview_em', { symbol: '000001' })"
    },
    "fund_fee_em": {
        "name": "基金费率",
        "description": "获取基金的各项费率信息",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"},
            {"name": "indicator", "type": "str", "required": False, "values": ["申购费率", "赎回费率", "销售服务费"], "default": "申购费率"}
        ],
        "returns": "基金费率列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_fee_em', { symbol: '000001', indicator: '申购费率' })"
    },
    "fund_portfolio_hold_em": {
        "name": "基金持仓 - 股票",
        "description": "获取基金的股票持仓信息",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"},
            {"name": "date", "type": "str", "required": False, "desc": "年份，如 '2024'", "default": "当前年份"}
        ],
        "returns": "股票持仓列表，包含代码、名称、占净值比例等",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_portfolio_hold_em', { symbol: '000001', date: '2024' })"
    },
    "fund_portfolio_bond_hold_em": {
        "name": "基金持仓 - 债券",
        "description": "获取基金的债券持仓信息",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"},
            {"name": "date", "type": "str", "required": False, "desc": "年份", "default": "当前年份"}
        ],
        "returns": "债券持仓列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_portfolio_bond_hold_em', { symbol: '000001' })"
    },
    "fund_portfolio_industry_allocation_em": {
        "name": "基金持仓 - 行业配置",
        "description": "获取基金的行业配置信息",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"},
            {"name": "date", "type": "str", "required": False, "desc": "年份", "default": "当前年份"}
        ],
        "returns": "行业配置列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_portfolio_industry_allocation_em', { symbol: '000001' })"
    },
    # 基金公告
    "fund_announcement_dividend_em": {
        "name": "基金分红公告",
        "description": "获取基金的分红相关公告",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"}
        ],
        "returns": "分红公告列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_announcement_dividend_em', { symbol: '000001' })"
    },
    "fund_announcement_report_em": {
        "name": "基金定期报告",
        "description": "获取基金的定期报告（季报、年报等）",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"}
        ],
        "returns": "定期报告列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_announcement_report_em', { symbol: '000001' })"
    },
    "fund_announcement_personnel_em": {
        "name": "基金人事公告",
        "description": "获取基金的人事变动公告",
        "params": [
            {"name": "symbol", "type": "str", "required": True, "desc": "基金代码", "example": "'000001'"}
        ],
        "returns": "人事公告列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_announcement_personnel_em', { symbol: '000001' })"
    },
    # 基金评级
    "fund_rating_all": {
        "name": "基金评级",
        "description": "获取基金的评级信息",
        "params": [],
        "returns": "所有基金评级列表",
        "cache_ttl": "30 分钟",
        "example": "apiClient.get('fund_rating_all')"
    },
    # 基金经理
    "fund_manager_em": {
        "name": "基金经理",
        "description": "获取基金经理的详细信息",
        "params": [],
        "returns": "所有基金经理列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_manager_em')"
    },
    # 其他
    "fund_hk_rank_em": {
        "name": "香港基金排行",
        "description": "获取香港市场基金的排行榜",
        "params": [],
        "returns": "香港基金排行列表",
        "cache_ttl": "30 分钟",
        "example": "apiClient.get('fund_hk_rank_em')"
    },
    "fund_scale_change_em": {
        "name": "基金规模变动",
        "description": "获取基金规模变动数据",
        "params": [],
        "returns": "基金规模变动列表",
        "cache_ttl": "1 小时",
        "example": "apiClient.get('fund_scale_change_em')"
    }
}

# 服务模块定义
SERVICE_MODULES = {
    "fundService": {
        "file": "src/services/fundService.ts",
        "description": "基金数据服务模块，提供基金列表、排行、估算等核心功能"
    },
    "fundInfoService": {
        "file": "src/services/fundInfoService.ts",
        "description": "基金信息服务模块，提供基金概况、费率、持仓、公告等详细信息"
    },
    "apiClient": {
        "file": "src/services/apiClient.ts",
        "description": "API 客户端模块，统一的 HTTP 请求封装"
    },
    "cacheAdapter": {
        "file": "src/services/cacheAdapter.ts",
        "description": "缓存适配器模块，提供多级缓存支持"
    },
    "fundManager": {
        "file": "src/services/fundManager.ts",
        "description": "基金管理模块，负责用户自选基金的增删改查"
    }
}

# 组件定义
COMPONENTS = {
    "FundList": {
        "file": "src/components/FundList.tsx",
        "description": "我的基金列表组件，展示用户关注的基金"
    },
    "FundRankList": {
        "file": "src/components/FundRankList.tsx",
        "description": "基金排行榜组件，支持按类型筛选和加载更多"
    },
    "FundSearchDialog": {
        "file": "src/components/FundSearchDialog.tsx",
        "description": "基金搜索对话框，支持代码和名称搜索"
    },
    "FundDetailDialog": {
        "file": "src/components/FundDetailDialog.tsx",
        "description": "基金详情对话框，展示基金详细信息和持有情况"
    },
    "NavChart": {
        "file": "src/components/NavChart.tsx",
        "description": "净值走势图组件，使用 Recharts 绘制"
    }
}


def read_file_content(filepath: str) -> str:
    """读取文件内容"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"⚠️ 无法读取文件：{e}"


def extract_function_info(content: str, func_name: str) -> dict:
    """从代码中提取函数信息"""
    info = {
        "name": func_name,
        "description": "",
        "params": [],
        "returns": ""
    }
    
    # 提取 JSDoc 注释
    pattern = r'/\*\*\s*\n(?:\s*\*\s*(.+?)\n)*?\s*\*/\s*(?:export\s+)?(?:async\s+)?function\s+' + re.escape(func_name)
    match = re.search(pattern, content, re.MULTILINE)
    if match:
        lines = match.group(0).split('\n')
        desc_lines = []
        for line in lines:
            line = line.strip().lstrip('*').strip()
            if line.startswith('@'):
                break
            if line and not line.startswith('/*'):
                desc_lines.append(line)
        info["description"] = ' '.join(desc_lines)
    
    return info


def generate_markdown_table(headers: list, rows: list) -> str:
    """生成 Markdown 表格"""
    lines = []
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
    for row in rows:
        lines.append("| " + " | ".join(str(cell) for cell in row) + " |")
    return '\n'.join(lines)


def generate_api_reference() -> str:
    """生成 API 参考文档"""
    md = []
    md.append("# AKShare 基金数据 API 完整参考")
    md.append("")
    md.append(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    md.append("")
    md.append(f"官方文档：[{AKSHARE_BASE_URL}]({AKSHARE_BASE_URL})")
    md.append("")
    md.append("---")
    md.append("")
    
    # 按类别分组
    categories = {
        "基础数据": ["fund_open_fund_daily_em", "fund_open_fund_rank_em", "fund_open_fund_info_em"],
        "ETF 基金": ["fund_etf_fund_info_em"],
        "货币基金": ["fund_money_fund_daily_em", "fund_money_fund_info_em"],
        "净值估算": ["fund_value_estimation_em"],
        "LOF 基金": ["fund_lof_spot_em"],
        "基金详细信息": ["fund_overview_em", "fund_fee_em", "fund_portfolio_hold_em", "fund_portfolio_bond_hold_em", "fund_portfolio_industry_allocation_em"],
        "基金公告": ["fund_announcement_dividend_em", "fund_announcement_report_em", "fund_announcement_personnel_em"],
        "评级与经理": ["fund_rating_all", "fund_manager_em"],
        "其他": ["fund_hk_rank_em", "fund_scale_change_em"]
    }
    
    for category, interfaces in categories.items():
        md.append(f"## {category}")
        md.append("")
        
        for interface_id in interfaces:
            if interface_id not in FUND_INTERFACES:
                continue
                
            iface = FUND_INTERFACES[interface_id]
            md.append(f"### {interface_id}")
            md.append("")
            md.append(f"**{iface['name']}**")
            md.append("")
            md.append(f"_{iface['description']}_")
            md.append("")
            
            # 参数表格
            if iface['params']:
                md.append("**参数**:")
                md.append("")
                param_headers = ["参数名", "类型", "必填", "说明"]
                param_rows = []
                for param in iface['params']:
                    required = "是" if param.get('required', False) else "否"
                    desc = param.get('desc', '')
                    if 'values' in param:
                        desc += f" 可选值：`{'`, `'.join(param['values'])}`"
                    if 'default' in param:
                        desc += f" 默认：`{param['default']}`"
                    if 'example' in param:
                        desc += f" 示例：`{param['example']}`"
                    param_rows.append([param['name'], param['type'], required, desc.strip()])
                md.append(generate_markdown_table(param_headers, param_rows))
                md.append("")
            
            # 返回值
            md.append(f"**返回值**: {iface['returns']}")
            md.append("")
            
            # 缓存策略
            md.append(f"**缓存策略**: {iface['cache_ttl']}")
            md.append("")
            
            # 状态提示
            if 'status' in iface:
                md.append(f"> ⚠️ {iface['status']}")
                md.append("")
            
            # 示例代码
            md.append("**示例代码**:")
            md.append("")
            md.append(f"```typescript")
            md.append(iface['example'])
            md.append(f"```")
            md.append("")
            md.append("---")
            md.append("")
    
    return '\n'.join(md)


def generate_service_docs() -> str:
    """生成服务模块文档"""
    md = []
    md.append("# 服务模块文档")
    md.append("")
    md.append(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    md.append("")
    md.append("---")
    md.append("")
    
    for module_id, module_info in SERVICE_MODULES.items():
        md.append(f"## {module_id}")
        md.append("")
        md.append(f"_{module_info['description']}_")
        md.append("")
        md.append(f"**文件**: `{module_info['file']}`")
        md.append("")
        
        content = read_file_content(PROJECT_ROOT / module_info['file'])
        md.append("### 导出接口")
        md.append("")
        md.append("```typescript")
        # 提取 export 语句
        exports = re.findall(r'export\s+(?:async\s+)?(?:function|const|class)\s+\w+', content)
        for exp in exports[:10]:  # 限制显示数量
            md.append(exp)
        md.append("```")
        md.append("")
        md.append("---")
        md.append("")
    
    return '\n'.join(md)


def generate_component_docs() -> str:
    """生成组件文档"""
    md = []
    md.append("# 组件文档")
    md.append("")
    md.append(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    md.append("")
    md.append("---")
    md.append("")
    
    for comp_id, comp_info in COMPONENTS.items():
        md.append(f"## {comp_id}")
        md.append("")
        md.append(f"_{comp_info['description']}_")
        md.append("")
        md.append(f"**文件**: `{comp_info['file']}`")
        md.append("")
        
        content = read_file_content(PROJECT_ROOT / comp_info['file'])
        
        # 提取 Props 接口
        props_match = re.search(r'interface\s+(\w+Props)\s*\{([^}]+)\}', content, re.DOTALL)
        if props_match:
            md.append("### Props")
            md.append("")
            md.append("```typescript")
            md.append(f"interface {props_match.group(1)} {{")
            md.append(props_match.group(2).strip())
            md.append("}")
            md.append("```")
            md.append("")
        
        md.append("---")
        md.append("")
    
    return '\n'.join(md)


def generate_cache_docs() -> str:
    """生成缓存策略文档"""
    md = []
    md.append("# 缓存策略文档")
    md.append("")
    md.append(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 缓存架构")
    md.append("")
    md.append("项目采用三级缓存架构：")
    md.append("")
    md.append("1. **内存缓存** - 使用 Map 存储，最快访问速度")
    md.append("2. **本地存储** - 使用 localStorage，持久化存储")
    md.append("3. **IndexedDB** - 大容量数据存储（可选）")
    md.append("")
    md.append("## 各接口缓存策略")
    md.append("")
    
    headers = ["接口", "缓存时间", "说明"]
    rows = []
    for iface_id, iface in FUND_INTERFACES.items():
        rows.append([iface_id, iface['cache_ttl'], iface.get('status', '')])
    
    md.append(generate_markdown_table(headers, rows))
    md.append("")
    md.append("## 缓存键生成规则")
    md.append("")
    md.append("```typescript")
    md.append("// 基础格式")
    md.append("[接口名]?[参数 1]=[值 1]&[参数 2]=[值 2]")
    md.append("")
    md.append("// 示例")
    md.append("fund_open_fund_rank_em?symbol=全部")
    md.append("fund_open_fund_info_em?symbol=000001&indicator=单位净值走势&period=1 年")
    md.append("```")
    md.append("")
    
    return '\n'.join(md)


def main():
    """主函数"""
    print("=" * 60)
    print("AKShare 基金数据 API 文档生成器")
    print("=" * 60)
    print()
    
    # 确保文档目录存在
    DOCS_DIR.mkdir(exist_ok=True)
    
    # 生成各部分文档
    print("[1/5] 生成 API 参考文档...")
    api_ref = generate_api_reference()
    with open(DOCS_DIR / "API_REFERENCE_FULL.md", 'w', encoding='utf-8') as f:
        f.write(api_ref)
    print(f"      -> {DOCS_DIR / 'API_REFERENCE_FULL.md'}")
    
    print("[2/5] 生成服务模块文档...")
    service_docs = generate_service_docs()
    with open(DOCS_DIR / "SERVICES_FULL.md", 'w', encoding='utf-8') as f:
        f.write(service_docs)
    print(f"      -> {DOCS_DIR / 'SERVICES_FULL.md'}")
    
    print("[3/5] 生成组件文档...")
    component_docs = generate_component_docs()
    with open(DOCS_DIR / "COMPONENTS_FULL.md", 'w', encoding='utf-8') as f:
        f.write(component_docs)
    print(f"      -> {DOCS_DIR / 'COMPONENTS_FULL.md'}")
    
    print("[4/5] 生成缓存策略文档...")
    cache_docs = generate_cache_docs()
    with open(DOCS_DIR / "CACHE_STRATEGY.md", 'w', encoding='utf-8') as f:
        f.write(cache_docs)
    print(f"      -> {DOCS_DIR / 'CACHE_STRATEGY.md'}")
    
    # 更新主 README
    print("[5/5] 更新主文档索引...")
    index_md = f"""# 文档索引

生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 快速链接

| 文档 | 说明 |
|------|------|
| [API 完整参考](API_REFERENCE_FULL.md) | AKShare 所有基金数据接口的完整参考 |
| [服务模块文档](SERVICES_FULL.md) | 项目服务层模块的详细说明 |
| [组件文档](COMPONENTS_FULL.md) | React 组件的 Props 和使用说明 |
| [缓存策略](CACHE_STRATEGY.md) | 各级缓存的策略和实现说明 |
| [AKShare 官方文档]({AKSHARE_BASE_URL}) | AKShare 官方文档链接 |

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

*文档由脚本自动生成，最后更新：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    with open(DOCS_DIR / "README.md", 'w', encoding='utf-8') as f:
        f.write(index_md)
    print(f"      -> {DOCS_DIR / 'README.md'}")
    
    print()
    print("=" * 60)
    print("✅ 文档生成完成!")
    print("=" * 60)
    print()
    print("生成的文档:")
    for f in DOCS_DIR.glob("*.md"):
        print(f"  - {f.name}")


if __name__ == "__main__":
    main()
