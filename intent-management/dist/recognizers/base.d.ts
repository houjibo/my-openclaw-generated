import { Intent, IntentRecognitionResult } from '../models/intent';
/**
 * 意图识别器基类
 */
export declare abstract class IntentRecognizer {
    protected intents: Intent[];
    /**
     * 注册意图
     */
    registerIntent(intent: Intent): void;
    /**
     * 批量注册意图
     */
    registerIntents(intents: Intent[]): void;
    /**
     * 识别意图（需要子类实现）
     */
    abstract recognize(input: string, context?: any): Promise<IntentRecognitionResult>;
    /**
     * 获取所有已注册的意图
     */
    getIntents(): Intent[];
    /**
     * 根据ID查找意图
     */
    getIntentById(id: string): Intent | undefined;
}
//# sourceMappingURL=base.d.ts.map