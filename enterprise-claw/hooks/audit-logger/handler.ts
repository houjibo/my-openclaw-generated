/**
 * 企业审计日志 Hook
 * 
 * 记录所有敏感操作到企业 SIEM 系统
 */

import type { HookHandler } from 'openclaw/plugin-sdk';

// 审计日志配置
const AUDIT_CONFIG = {
  enabled: true,
  siemEndpoint: process.env.ENTERPRISE_SIEM_ENDPOINT || 'https://your-siem.com/api/audit',
  apiKey: process.env.ENTERPRISE_SIEM_API_KEY || '',
  logLevel: process.env.AUDIT_LOG_LEVEL || 'info'
};

// 审计日志格式
interface AuditLog {
  timestamp: string;
  type: string;
  action: string;
  user?: string;
  session?: string;
  command?: string;
  tool?: string;
  cwd?: string;
  result?: string;
  riskScore?: number;
}

/**
 * 发送审计日志到 SIEM 系统
 */
async function sendToSIEM(log: AuditLog): Promise<void> {
  if (!AUDIT_CONFIG.enabled) {
    console.log('[AUDIT]', JSON.stringify(log));
    return;
  }

  try {
    // 生产环境：发送到 SIEM
    if (AUDIT_CONFIG.apiKey) {
      await fetch(AUDIT_CONFIG.siemEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUDIT_CONFIG.apiKey}`
        },
        body: JSON.stringify(log)
      });
    } else {
      // 开发环境：输出到控制台
      console.log('[AUDIT]', JSON.stringify(log, null, 2));
    }
  } catch (error) {
    console.error('[AUDIT] Failed to send to SIEM:', error);
  }
}

/**
 * 计算风险评分
 */
function calculateRiskScore(event: any): number {
  let score = 0;
  
  // 命令风险评估
  if (event.command) {
    if (event.command.includes('sudo')) score += 30;
    if (event.command.includes('rm')) score += 20;
    if (event.command.includes('chmod')) score += 15;
    if (event.command.includes('curl') || event.command.includes('wget')) score += 10;
  }
  
  // 工具风险评估
  if (event.tool) {
    if (['exec', 'write', 'edit'].includes(event.tool.name)) score += 20;
    if (event.tool.name === 'message') score += 10;
  }
  
  return Math.min(score, 100);
}

export const handler: HookHandler = {
  /**
   * 命令执行审计
   */
  async onCommand(event) {
    const log: AuditLog = {
      timestamp: new Date().toISOString(),
      type: 'command',
      action: event.action || 'execute',
      user: event.session?.user,
      session: event.session?.id,
      command: event.command,
      cwd: event.session?.cwd,
      result: 'pending',
      riskScore: calculateRiskScore(event)
    };

    // 高风险命令需要额外记录
    if (log.riskScore >= 50) {
      console.log('[AUDIT] High risk command detected:', event.command);
    }

    await sendToSIEM(log);
  },

  /**
   * 会话事件审计
   */
  async onSession(event) {
    const log: AuditLog = {
      timestamp: new Date().toISOString(),
      type: 'session',
      action: event.type,
      user: event.session?.user,
      session: event.session?.id,
      result: 'success'
    };

    await sendToSIEM(log);
  },

  /**
   * Agent 工具调用审计
   */
  async onAgent(event) {
    if (event.action !== 'tool-call') return;

    const log: AuditLog = {
      timestamp: new Date().toISOString(),
      type: 'agent',
      action: 'tool-call',
      user: event.session?.user,
      session: event.session?.id,
      tool: event.tool?.name,
      result: 'pending',
      riskScore: calculateRiskScore(event)
    };

    await sendToSIEM(log);
  },

  /**
   * 消息审计（数据防泄漏）
   */
  async onMessage(event) {
    const content = event.message?.content || '';
    
    // 简单的敏感信息检测
    const sensitivePatterns = {
      API_KEY: /[A-Za-z0-9]{32,}/,
      PASSWORD: /password["':\s]+[^\s]{8,}/i,
      PRIVATE_KEY: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/
    };

    for (const [type, pattern] of Object.entries(sensitivePatterns)) {
      if (pattern.test(content)) {
        const log: AuditLog = {
          timestamp: new Date().toISOString(),
          type: 'dlp',
          action: 'sensitive-data-detected',
          dataType: type,
          user: event.session?.user,
          session: event.session?.id,
          riskScore: 80
        };

        await sendToSIEM(log);
        console.log('[DLP] Sensitive data detected:', type);
      }
    }
  }
};
