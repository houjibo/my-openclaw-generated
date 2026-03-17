/**
 * 企业 HR 系统对接技能
 * 
 * 提供员工查询、请假申请等功能
 */

// HR 系统配置
const HR_CONFIG = {
  apiEndpoint: process.env.HR_API_ENDPOINT || 'https://your-hr-system.com/api',
  apiKey: process.env.HR_API_KEY || '',
  timeout: 30000
};

/**
 * 查询员工信息
 * 
 * @param {string} name - 员工姓名
 * @returns {Promise<Array>} 员工列表
 */
export async function queryEmployee(name) {
  try {
    const response = await fetch(`${HR_CONFIG.apiEndpoint}/employees?name=${encodeURIComponent(name)}`, {
      headers: {
        'Authorization': `Bearer ${HR_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: HR_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`HR API error: ${response.status}`);
    }

    const data = await response.json();
    return data.employees || [];
  } catch (error) {
    console.error('[HR] Query failed:', error);
    throw error;
  }
}

/**
 * 查询员工详情
 * 
 * @param {string} employeeId - 员工 ID
 * @returns {Promise<Object>} 员工详情
 */
export async function getEmployeeDetail(employeeId) {
  try {
    const response = await fetch(`${HR_CONFIG.apiEndpoint}/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${HR_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: HR_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`HR API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HR] Get detail failed:', error);
    throw error;
  }
}

/**
 * 申请请假
 * 
 * @param {Object} params - 请假参数
 * @param {string} params.employeeId - 员工 ID
 * @param {number} params.days - 请假天数
 * @param {string} params.type - 请假类型
 * @param {string} params.reason - 请假原因
 * @returns {Promise<Object>} 申请结果
 */
export async function requestLeave(params) {
  try {
    const response = await fetch(`${HR_CONFIG.apiEndpoint}/leave/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HR_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employee_id: params.employeeId,
        days: params.days,
        type: params.type,
        reason: params.reason,
        request_date: new Date().toISOString()
      }),
      timeout: HR_CONFIG.timeout
    });

    if (!response.ok) {
      throw new Error(`HR API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HR] Leave request failed:', error);
    throw error;
  }
}

/**
 * 查询考勤记录
 * 
 * @param {string} employeeId - 员工 ID
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Promise<Array>} 考勤记录
 */
export async function getAttendance(employeeId, startDate, endDate) {
  try {
    const response = await fetch(
      `${HR_CONFIG.apiEndpoint}/attendance?employee_id=${employeeId}&start=${startDate}&end=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${HR_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: HR_CONFIG.timeout
      }
    );

    if (!response.ok) {
      throw new Error(`HR API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HR] Attendance query failed:', error);
    throw error;
  }
}
