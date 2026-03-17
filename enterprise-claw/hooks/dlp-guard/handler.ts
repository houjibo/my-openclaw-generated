/**
 * 数据防泄漏（DLP）Hook
 * 
 * 检测和阻止敏感信息外发
 */

import type { HookHandler } from 'openclaw/plugin-sdk';

// 敏感信息检测规则
const DLP_RULES = {
  API_KEY: {
    pattern: /[A-Za-z0-9_-]{32,}/,
    description: 'API Key',
    severity: 'high'
  },
  AWS_ACCESS_KEY: {
    pattern: /AKIA[0-9A-Z]{16}/,
    description: 'AWS Access Key',
    severity: 'critical'
  },
  GITHUB_TOKEN: {
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/,
    description: 'GitHub Token',
    severity: 'critical'
  },
  PASSWORD: {
    pattern: /password["':\s=]+[^\s"',]{8,}/i,
    description: 'Password',
    severity: 'high'
  },
  PRIVATE_KEY: {
    pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    description: 'Private Key',
    severity: 'critical'
  },
  PHONE_NUMBER: {
    pattern: /1[3-9]\d{9}/,
    description: 'Phone Number',
    severity: 'medium'
  },
  EMAIL: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    description: 'Email Address',
    severity: 'low'
  },
  ID_CARD: {
    pattern: /\d{17}[\dXx]/,
    description: 'Chinese ID Card',
    severity: 'high'
  }
};

/**
 * 检测文本中的敏感信息
 */
function detectSensitiveData(text: string): Array<{
  type: string;
  description: string;
  severity: string;
  match: string;
}> {
  const detections = [];

  for (const [type, rule] of Object.entries(DLP_RULES)) {
    const matches = text.match(rule.pattern);
    if (matches) {
      for (const match of matches) {
        // 排除误报
        if (isFalsePositive(match, type)) continue;

        detections.push({
          type,
          description: rule.description,
          severity: rule.severity,
          match: maskSensitive(match)
        });
      }
    }
  }

  return detections;
}

/**
 * 排除误报
 */
function isFalsePositive(match: string, type: string): boolean {
  // API Key 误报排除
  if (type === 'API_KEY') {
    // 排除常见的非敏感长字符串
    if (match.includes('function') || match.includes('return')) return true;
    if (match.startsWith('data-')) return true;
  }

  // 密码误报排除
  if (type === 'PASSWORD') {
    if (match.toLowerCase().includes('password_policy')) return true;
  }

  return false;
}

/**
 * 脱敏处理
 */
function maskSensitive(text: string): string {
  if (text.length <= 8) {
    return '***';
  }
  return text.substring(0, 4) + '***' + text.substring(text.length - 4);
}

/**
 * 发送 DLP 告警
 */
function sendDLPAlert(detection: any, context: any) {
  console.error('[DLP] Alert:', {
    timestamp: new Date().toISOString(),
    type: detection.type,
    severity: detection.severity,
    user: context.user,
    session: context.session,
    match: detection.match
  });

  // 可选：发送到 SIEM 或告警系统
  // fetch('https://your-siem.com/api/dlp-alert', {...})
}

export const handler: HookHandler = {
  /**
   * 消息发送前检测
   */
  async onMessage(event) {
    const content = event.message?.content || '';
    if (!content) return;

    const detections = detectSensitiveData(content);

    if (detections.length > 0) {
      for (const detection of detections) {
        sendDLPAlert(detection, {
          user: event.session?.user,
          session: event.session?.id
        });

        // 根据严重程度处理
        if (detection.severity === 'critical') {
          console.error('[DLP] Blocked critical data leak:', detection.type);
          // 可选：阻止消息发送
          // event.message.content = content.replace(
          //   new RegExp(detection.match, 'g'),
          //   '[REDACTED]'
          // );
        }
      }

      // 脱敏处理
      let sanitized = content;
      for (const detection of detections) {
        sanitized = sanitized.replace(
          new RegExp(detection.match.replace(/\*/g, '\\*'), 'g'),
          '[REDACTED]'
        );
      }

      event.message.content = sanitized;
      console.log('[DLP] Message sanitized');
    }
  },

  /**
   * Agent 工具调用检测
   */
  async onAgent(event) {
    if (event.action !== 'tool-call') return;

    const tool = event.tool;

    // 检查可能外发数据的工具
    if (['web_search', 'browser', 'message'].includes(tool.name)) {
      const params = JSON.stringify(tool.params);
      const detections = detectSensitiveData(params);

      if (detections.length > 0) {
        for (const detection of detections) {
          sendDLPAlert(detection, {
            user: event.session?.user,
            session: event.session?.id,
            tool: tool.name
          });

          if (detection.severity === 'critical') {
            throw new Error(
              `[DLP] Cannot send ${detection.description} to ${tool.name}`
            );
          }
        }
      }
    }
  }
};
