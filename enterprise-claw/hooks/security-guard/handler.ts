/**
 * 企业安全护栏 Hook
 * 
 * 拦截危险操作，执行企业安全策略
 */

import type { HookHandler } from 'openclaw/plugin-sdk';

// 从配置文件加载安全策略
const SECURITY_POLICY = {
  dangerousCommands: [
    'rm -rf',
    'dd if=/dev/zero',
    'dd of=',
    'mkfs',
    'mklabel',
    'chmod 777',
    'chown root',
    'curl | bash',
    'curl | sh',
    'wget | bash',
    'wget | sh',
    ':(){ :|:& };:',
    'kill -9',
    'pkill -9',
    'shutdown',
    'reboot',
    'halt',
    'poweroff'
  ],
  sensitivePaths: [
    '/etc/',
    '/usr/',
    '/System/',
    '/Library/',
    '/private/',
    '/root/',
    '/boot/',
    '/dev/',
    'api-keys',
    'secrets',
    '.env',
    '.npmrc',
    '.gitconfig',
    'id_rsa',
    'id_ed25519'
  ]
};

/**
 * 检查命令是否包含危险模式
 */
function checkDangerousCommand(cmd: string): string | null {
  for (const pattern of SECURITY_POLICY.dangerousCommands) {
    if (cmd.includes(pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * 检查命令是否访问敏感路径
 */
function checkSensitivePath(cmd: string): string | null {
  for (const path of SECURITY_POLICY.sensitivePaths) {
    if (cmd.includes(path)) {
      return path;
    }
  }
  return null;
}

export const handler: HookHandler = {
  /**
   * 命令执行前拦截
   */
  async onCommand(event) {
    const cmd = event.command;

    // 1. 检查危险命令
    const dangerousPattern = checkDangerousCommand(cmd);
    if (dangerousPattern) {
      console.error('[SECURITY] Blocked dangerous command:', cmd);
      throw new Error(
        `[SECURITY] Execution blocked: Command contains dangerous pattern "${dangerousPattern}"`
      );
    }

    // 2. 检查敏感路径
    const sensitivePath = checkSensitivePath(cmd);
    if (sensitivePath) {
      console.warn('[SECURITY] Sensitive path access:', sensitivePath);
      // 记录但不阻止（可根据需求调整）
    }

    // 3. 检查 sudo 命令
    if (cmd.includes('sudo')) {
      console.error('[SECURITY] Sudo command blocked:', cmd);
      throw new Error('[SECURITY] Sudo commands are not allowed');
    }

    // 4. 检查管道执行
    if (cmd.includes('|') && (cmd.includes('curl') || cmd.includes('wget'))) {
      console.error('[SECURITY] Remote execution blocked:', cmd);
      throw new Error('[SECURITY] Remote script execution is not allowed');
    }

    console.log('[SECURITY] Command approved:', cmd);
  },

  /**
   * Agent 工具调用拦截
   */
  async onAgent(event) {
    if (event.action !== 'tool-call') return;

    const tool = event.tool;

    // 1. 检查 exec 工具
    if (tool.name === 'exec') {
      const cmd = tool.params?.command;
      if (cmd) {
        const dangerous = checkDangerousCommand(cmd);
        if (dangerous) {
          throw new Error(
            `[SECURITY] Tool execution blocked: ${dangerous}`
          );
        }
      }
    }

    // 2. 检查 write/edit 工具
    if (['write', 'edit'].includes(tool.name)) {
      const path = tool.params?.path;
      if (path) {
        const sensitive = checkSensitivePath(path);
        if (sensitive) {
          console.warn('[SECURITY] Writing to sensitive path:', path);
          // 可选：阻止写入
          // throw new Error(`[SECURITY] Cannot write to ${sensitive}`);
        }
      }
    }

    // 3. 检查 message 工具
    if (tool.name === 'message') {
      const content = tool.params?.content || '';
      
      // 敏感信息检测
      const sensitivePatterns = {
        API_KEY: /[A-Za-z0-9]{32,}/,
        PASSWORD: /password["':\s]+[^\s]{8,}/i,
        PRIVATE_KEY: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/
      };

      for (const [type, pattern] of Object.entries(sensitivePatterns)) {
        if (pattern.test(content)) {
          console.warn('[DLP] Potential data leak:', type);
          // 可选：阻止发送
          // throw new Error(`[DLP] Cannot send ${type}`);
        }
      }
    }

    console.log('[SECURITY] Tool call approved:', tool.name);
  }
};
