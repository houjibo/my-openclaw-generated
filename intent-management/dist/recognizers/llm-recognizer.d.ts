import { IntentRecognitionResult } from '../models/intent';
import { IntentRecognizer } from './base';
/**
 * LLM 意图识别器
 * 使用大语言模型来理解和识别用户意图
 */
export declare class LLMIntentRecognizer extends IntentRecognizer {
    private llmClient;
    constructor(config: {
        apiKey: string;
        baseUrl: string;
        model: string;
    });
    recognize(input: string, context?: any): Promise<IntentRecognitionResult>;
    private buildSystemPrompt;
    private buildUserPrompt;
    /**
     * 回退规则引擎
     * 当 LLM 调用失败时使用
     */
    private fallbackRuleBased;
    private parseLLMResponse;
}
//# sourceMappingURL=llm-recognizer.d.ts.map