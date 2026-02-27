#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AKTools API 详细测试脚本
测试项目实际使用的接口
"""

import requests
import json
import sys
import os

# 设置环境变量避免编码问题
os.environ['PYTHONIOENCODING'] = 'utf-8'

BASE_URL = "http://45.152.66.117:8080/api/public"

def test_api(endpoint, params=None, timeout=60):
    """测试单个API接口"""
    url = f"{BASE_URL}/{endpoint}"
    try:
        print(f"\n{'='*60}")
        print(f"测试接口: {endpoint}")
        print(f"URL: {url}")
        if params:
            print(f"参数: {params}")
        
        response = requests.get(url, params=params, timeout=timeout)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"[OK] 返回数据条数: {len(data)}")
                print(f"第一条数据字段: {list(data[0].keys())[:10]}")
                return True, data
            elif isinstance(data, dict):
                print(f"[OK] 返回数据: {str(data)[:300]}...")
                return True, data
            else:
                print(f"[OK] 返回数据: {data}")
                return True, data
        else:
            print(f"[FAIL] 请求失败: {response.text[:200]}")
            return False, None
    except requests.exceptions.Timeout:
        print(f"[FAIL] 请求超时 ({timeout}秒)")
        return False, None
    except Exception as e:
        print(f"[FAIL] 请求异常: {e}")
        return False, None

def main():
    print("=" * 60)
    print("AKTools API 详细测试 - 项目接口验证")
    print("=" * 60)
    
    results = {}
    
    # 测试 1: 项目使用的 fund_open_fund_rank_em
    success, data = test_api("fund_open_fund_rank_em", {"symbol": "全部"})
    results["fund_open_fund_rank_em"] = "OK" if success else "FAIL"
    
    # 测试 2: 备用接口 fund_info_index_em
    success, data = test_api("fund_info_index_em", {"symbol": "全部", "indicator": "全部"})
    results["fund_info_index_em (备用)"] = "OK" if success else "FAIL"
    
    # 测试 3: LOF 基金 - 测试不同接口名称
    success, data = test_api("fund_lof_spot_em")
    results["fund_lof_spot_em (当前)"] = "OK" if success else "FAIL"
    
    success, data = test_api("fund_lof_hist_em")
    results["fund_lof_hist_em (备用1)"] = "OK" if success else "FAIL"
    
    # 测试 4: 分级基金
    success, data = test_api("fund_graded_fund_daily_em")
    results["fund_graded_fund_daily_em"] = "OK" if success else "FAIL"
    
    # 测试 5: 理财型基金
    success, data = test_api("fund_financial_fund_daily_em")
    results["fund_financial_fund_daily_em"] = "OK" if success else "FAIL"
    
    # 测试 6: 基金概况
    success, data = test_api("fund_overview_em", {"symbol": "000001"})
    results["fund_overview_em"] = "OK" if success else "FAIL"
    
    # 测试 7: 香港基金排行
    success, data = test_api("fund_hk_rank_em")
    results["fund_hk_rank_em"] = "OK" if success else "FAIL"
    
    # 测试 8: 规模变动
    success, data = test_api("fund_scale_change_em")
    results["fund_scale_change_em"] = "OK" if success else "FAIL"
    
    # 测试 9: ETF 历史净值参数检查
    success, data = test_api("fund_etf_fund_info_em", {"fund": "510050", "start_date": "20240101", "end_date": "20241231"})
    results["fund_etf_fund_info_em (fund参数)"] = "OK" if success else "FAIL"
    
    success, data = test_api("fund_etf_fund_info_em", {"symbol": "510050"})
    results["fund_etf_fund_info_em (symbol参数)"] = "OK" if success else "FAIL"
    
    # 汇总
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    for name, status in results.items():
        marker = "[OK]" if status == "OK" else "[FAIL]"
        print(f"{marker} {name}")
    print("=" * 60)

if __name__ == "__main__":
    main()
