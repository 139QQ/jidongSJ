#!/usr/bin/env python3
"""
AKTools API 测试脚本
测试基金数据接口的可用性和参数正确性
"""

import requests
import json
import sys

BASE_URL = "http://45.152.66.117:8080/api/public"

def test_api(endpoint, params=None, timeout=60):
    """测试单个API接口"""
    url = f"{BASE_URL}/{endpoint}"
    try:
        print(f"\n测试接口: {endpoint}")
        print(f"URL: {url}")
        if params:
            print(f"参数: {params}")
        
        response = requests.get(url, params=params, timeout=timeout)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"返回数据条数: {len(data)}")
                print(f"第一条数据示例: {json.dumps(data[0], ensure_ascii=False, indent=2)[:500]}...")
                return True
            elif isinstance(data, dict):
                print(f"返回数据: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}...")
                return True
            else:
                print(f"返回数据: {data}")
                return True
        else:
            print(f"请求失败: {response.text}")
            return False
    except requests.exceptions.Timeout:
        print(f"请求超时 ({timeout}秒)")
        return False
    except Exception as e:
        print(f"请求异常: {e}")
        return False

def main():
    print("=" * 60)
    print("AKTools API 接口测试")
    print("=" * 60)
    
    # 测试开放式基金列表
    test_api("fund_open_fund_daily_em")
    
    # 测试货币基金列表
    test_api("fund_money_fund_daily_em")
    
    # 测试ETF基金列表
    test_api("fund_etf_fund_daily_em")
    
    # 测试LOF基金列表
    test_api("fund_lof_spot_em")
    
    # 测试基金排行
    test_api("fund_info_index_em", {"symbol": "全部", "indicator": "全部"})
    
    # 测试基金估算净值
    test_api("fund_value_estimation_em", {"symbol": "全部"})
    
    # 测试基金历史净值
    test_api("fund_open_fund_info_em", {"symbol": "000001", "indicator": "单位净值走势", "period": "1月"})
    
    # 测试货币基金历史
    test_api("fund_money_fund_info_em", {"symbol": "000009"})
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    main()
