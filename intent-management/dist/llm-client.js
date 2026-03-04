"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * LLM 客户端类
 */
class LLMClient {
    constructor(config) {
        this.config = config;
    }
    /**
     * 调用 LLM API
     */
    async chat(systemPrompt, userPrompt, temperature = 0.3) {
        try {
            const response = await (0, node_fetch_1.default)(`${this.config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature,
                    max_tokens: 2000
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GLM API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            if (!data.choices || data.choices.length === 0) {
                throw new Error('GLM API returned empty choices');
            }
            const content = data.choices[0].message.content;
            console.log(`[LLM] Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
            return content;
        }
        catch (error) {
            console.error('[LLM] API call failed:', error);
            throw error;
        }
    }
    /**
     * 重试机制
     */
    async chatWithRetry(systemPrompt, userPrompt, maxRetries = 3, delay = 1000) {
        let lastError = null;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.chat(systemPrompt, userPrompt);
            }
            catch (error) {
                lastError = error;
                console.error(`[LLM] Retry ${i + 1}/${maxRetries} failed:`, error);
                if (i < maxRetries - 1) {
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.LLMClient = LLMClient;
//# sourceMappingURL=llm-client.js.map