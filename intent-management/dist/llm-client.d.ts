/**
 * GLM API 配置
 */
interface GLMConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}
/**
 * LLM 客户端类
 */
export declare class LLMClient {
    private config;
    constructor(config: GLMConfig);
    /**
     * 调用 LLM API
     */
    chat(systemPrompt: string, userPrompt: string, temperature?: number): Promise<string>;
    /**
     * 重试机制
     */
    chatWithRetry(systemPrompt: string, userPrompt: string, maxRetries?: number, delay?: number): Promise<string>;
    private sleep;
}
export {};
//# sourceMappingURL=llm-client.d.ts.map