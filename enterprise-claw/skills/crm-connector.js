/**
 * 企业 CRM 系统对接技能
 * 
 * 提供客户管理、销售机会跟踪等功能
 */

// CRM 系统配置
const CRM_CONFIG = {
  apiEndpoint: process.env.CRM_API_ENDPOINT || 'https://your-crm-system.com/api',
  apiKey: process.env.CRM_API_KEY || '',
  timeout: 30000
};

/**
 * 查询客户信息
 * 
 * @param {string} name - 客户名称
 * @returns {Promise<Array>} 客户列表
 */
export async function queryCustomer(name) {
  try {
    const response = await fetch(`${CRM_CONFIG.apiEndpoint}/customers?name=${encodeURIComponent(name)}`, {
      headers: {
        'Authorization': `Bearer ${CRM_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CRM_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.customers || [];
  } catch (error) {
    console.error('[CRM] Query failed:', error);
    throw error;
  }
}

/**
 * 获取客户详情
 * 
 * @param {string} customerId - 客户 ID
 * @returns {Promise<Object>} 客户详情
 */
export async function getCustomerDetail(customerId) {
  try {
    const response = await fetch(`${CRM_CONFIG.apiEndpoint}/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${CRM_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CRM_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CRM] Get detail failed:', error);
    throw error;
  }
}

/**
 * 创建销售机会
 * 
 * @param {Object} params - 机会参数
 * @returns {Promise<Object>} 创建结果
 */
export async function createOpportunity(params) {
  try {
    const response = await fetch(`${CRM_CONFIG.apiEndpoint}/opportunities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRM_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: params.customerId,
        title: params.title,
        amount: params.amount,
        stage: params.stage || 'prospecting',
        close_date: params.closeDate,
        created_date: new Date().toISOString()
      }),
      timeout: CRM_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CRM] Create opportunity failed:', error);
    throw error;
  }
}

/**
 * 更新销售机会状态
 * 
 * @param {string} opportunityId - 机会 ID
 * @param {string} stage - 新阶段
 * @returns {Promise<Object>} 更新结果
 */
export async function updateOpportunityStage(opportunityId, stage) {
  try {
    const response = await fetch(`${CRM_CONFIG.apiEndpoint}/opportunities/${opportunityId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${CRM_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stage: stage,
        updated_date: new Date().toISOString()
      }),
      timeout: CRM_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CRM] Update opportunity failed:', error);
    throw error;
  }
}

/**
 * 查询销售管道
 * 
 * @returns {Promise<Object>} 管道数据
 */
export async function getSalesPipeline() {
  try {
    const response = await fetch(`${CRM_CONFIG.apiEndpoint}/pipeline`, {
      headers: {
        'Authorization': `Bearer ${CRM_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CRM_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CRM] Get pipeline failed:', error);
    throw error;
  }
}
