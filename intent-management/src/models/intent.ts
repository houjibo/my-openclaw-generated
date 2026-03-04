/**
 * 意图参数定义
 */
export interface IntentParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'path' | 'json';
  required: boolean;
  description: string;
  defaultValue?: any;
}

/**
 * 可执行的动作
 */
export interface IntentAction {
  id: string;
  name: string;
  description: string;
  execute: (params: Record<string, any>) => Promise<any>;
}

/**
 * 意图本体
 */
export interface Intent {
  id: string;
  name: string;
  category: string;
  confidence: number; // 0-1
  description: string;
  parameters: IntentParameter[];
  actions: IntentAction[];
  metadata?: {
    tags?: string[];
    priority?: number;
    context?: Record<string, any>;
    cost?: number;   // 执行成本（0-1）
    risk?: number;   // 风险等级（0-1）
  };
}

/**
 * 意图识别结果
 */
export interface IntentRecognitionResult {
  intent: Intent | null;
  confidence: number;
  alternatives: Array<{
    intent: Intent;
    confidence: number;
  }>;
  reasoning: string;
}
