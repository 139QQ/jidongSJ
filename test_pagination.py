#!/usr/bin/env python3
"""测试基金排行API分页参数"""
import requests
import time

BASE_URL = "http://45.152.66.117:8080/api/public"

def test_api(endpoint, params=None, timeout=60):
    url = f"{BASE_URL}/{endpoint}"
    start = time.time()
    try:
        print(f"\n测试: {endpoint}")
        print(f"参数: {params}")
        response = requests.get(url, params=params, timeout=timeout)
        elapsed = time.time() - start
        print(f"状态码: {response.status_code}, 耗时: {elapsed:.2f}秒")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"返回数据条数: {len(data)}")
            return data
    except Exception as e:
        print(f"错误: {e}")
    return None

# 测试不同参数
print("=" * 60)
print("测试 fund_open_fund_rank_em 分页参数")
print("=" * 60)

# 测试1: 无参数
test_api("fund_open_fund_rank_em")

# 测试2: 尝试分页参数
test_api("fund_open_fund_rank_em", {"symbol": "全部", "page": 1, "size": 50})
test_api("fund_open_fund_rank_em", {"symbol": "全部", "limit": 50})
test_api("fund_open_fund_rank_em", {"symbol": "全部", "per_page": 50})

# 测试3: 不同类型
test_api("fund_open_fund_rank_em", {"symbol": "股票型"})
test_api("fund_open_fund_rank_em", {"symbol": "混合型"})
test_api("fund_open_fund_rank_em", {"symbol": "债券型"})
