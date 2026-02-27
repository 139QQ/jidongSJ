/**
 * API 参数测试脚本
 * 验证 AKShare 接口参数是否正确
 */

const BASE_URL = 'http://45.152.66.117:8080/api/public';

async function testAPI(endpoint, params = {}, description = '') {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  console.log(`\n[测试] ${description || endpoint}`);
  console.log(`URL: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), { timeout: 30000 });
    console.log(`状态: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        console.log(`✅ 成功，返回 ${data.length} 条数据`);
        if (data.length > 0) {
          console.log(`字段: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`);
        }
      } else {
        console.log(`✅ 成功，返回数据:`, typeof data);
      }
      return { success: true, data };
    } else {
      console.log(`❌ 失败: ${response.statusText}`);
      return { success: false, error: response.statusText };
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=== AKShare API 参数验证测试 ===\n');
  
  // 1. 测试开放式基金排行 - 不同 symbol 参数
  console.log('\n--- 1. fund_open_fund_rank_em (基金排行) ---');
  await testAPI('fund_open_fund_rank_em', { symbol: '全部' }, '全部基金');
  await testAPI('fund_open_fund_rank_em', { symbol: '股票型' }, '股票型基金');
  await testAPI('fund_open_fund_rank_em', { symbol: '混合型' }, '混合型基金');
  await testAPI('fund_open_fund_rank_em', { symbol: '债券型' }, '债券型基金');
  
  // 2. 测试开放式基金列表
  console.log('\n--- 2. fund_open_fund_daily_em (开放式基金列表) ---');
  await testAPI('fund_open_fund_daily_em', {}, '无参数');
  
  // 3. 测试基金历史净值
  console.log('\n--- 3. fund_open_fund_info_em (基金历史净值) ---');
  await testAPI('fund_open_fund_info_em', 
    { symbol: '000001', indicator: '单位净值走势', period: '1月' }, 
    '单位净值走势-1月');
  await testAPI('fund_open_fund_info_em', 
    { symbol: '000001', indicator: '累计净值走势', period: '3月' }, 
    '累计净值走势-3月');
  
  // 4. 测试 ETF 基金历史净值 - 注意参数是 fund 不是 symbol
  console.log('\n--- 4. fund_etf_fund_info_em (ETF历史净值) ---');
  await testAPI('fund_etf_fund_info_em', 
    { fund: '510050', start_date: '20240101', end_date: '20241231' }, 
    '使用 fund 参数');
  await testAPI('fund_etf_fund_info_em', 
    { symbol: '510050', start_date: '20240101', end_date: '20241231' }, 
    '使用 symbol 参数（可能错误）');
  
  // 5. 测试货币基金
  console.log('\n--- 5. fund_money_fund_info_em (货币基金历史) ---');
  await testAPI('fund_money_fund_info_em', { symbol: '000009' }, '货币基金');
  
  // 6. 测试净值估算
  console.log('\n--- 6. fund_value_estimation_em (净值估算) ---');
  await testAPI('fund_value_estimation_em', { symbol: '全部' }, '全部估算');
  await testAPI('fund_value_estimation_em', { symbol: '股票型' }, '股票型估算');
  
  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
