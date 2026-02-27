/**
 * AKTools API 测试脚本
 * 测试基金数据接口的可用性
 */

const BASE_URL = 'http://45.152.66.117:8080/api/public';

async function testAPI(endpoint, params = {}, timeout = 120000) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  console.log(`\n测试接口: ${endpoint}`);
  console.log(`URL: ${url.toString()}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url.toString(), {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    console.log(`状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        console.log(`返回数据条数: ${data.length}`);
        if (data.length > 0) {
          console.log(`第一条数据: ${JSON.stringify(data[0], null, 2).substring(0, 500)}...`);
        }
      } else {
        console.log(`返回数据: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
      }
      return true;
    } else {
      console.log(`请求失败: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`请求超时 (${timeout}ms)`);
    } else {
      console.log(`请求异常: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('AKTools API 接口测试');
  console.log('='.repeat(60));
  
  // 测试开放式基金列表
  await testAPI('fund_open_fund_daily_em');
  
  // 测试货币基金列表
  await testAPI('fund_money_fund_daily_em');
  
  // 测试ETF基金列表
  await testAPI('fund_etf_fund_daily_em');
  
  // 测试LOF基金列表
  await testAPI('fund_lof_spot_em');
  
  // 测试基金排行
  await testAPI('fund_info_index_em', { symbol: '全部', indicator: '全部' });
  
  // 测试基金估算净值
  await testAPI('fund_value_estimation_em', { symbol: '全部' });
  
  // 测试基金历史净值
  await testAPI('fund_open_fund_info_em', { 
    symbol: '000001', 
    indicator: '单位净值走势', 
    period: '1月' 
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('测试完成');
  console.log('='.repeat(60));
}

main().catch(console.error);
