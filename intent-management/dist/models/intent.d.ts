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
    confidence: number;
    description: string;
    parameters: IntentParameter[];
    actions: IntentAction[];
    metadata?: {
        tags?: string[];
        priority?: number;
        context?: Record<string, any>;
        cost?: number;
        risk?: number;
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
//# sourceMappingURL=intent.d.ts.map