import { IntentRecognitionResult } from '../models/intent';
import { LLMIntentRecognizer } from '../recognizers/llm-recognizer';
import { DetectionResult } from './file-detector';
/**
 * 上下文推断器
 * 基于文件/文件夹信息，推断可能的意图
 */
export declare class ContextInferencer {
    private recognizer;
    constructor(recognizer: LLMIntentRecognizer);
    /**
     * 推断所有可能的意图
     */
    inferIntents(detection: DetectionResult): Promise<{
        topIntent: IntentRecognitionResult;
        allIntents: Array<{
            intent: any;
            confidence: number;
            description: string;
        }>;
    }>;
    /**
     * 基于上下文识别意图
     */
    private recognizeWithContext;
    /**
     * 构建上下文输入
     */
    private buildContextualInput;
    /**
     * 对所有意图进行排序
     */
    private rankAllIntents;
}
//# sourceMappingURL=context-inferencer.d.ts.map