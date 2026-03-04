import fetch from 'node-fetch';

/**
 * GLM API 配置
 */
interface GLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * GLM API 响应
 */
interface GLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * LLM 客户端类
 */
export class LLMClient {
  private config: GLMConfig;

  constructor(config: GLMConfig) {
    this.config = config;
  }

  /**
   * 调用 LLM API
   */
  async chat(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.3
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/chat/completions`,
        {
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
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GLM API error: ${response.status} - ${errorText}`);
      }

      const data: GLMResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('GLM API returned empty choices');
      }

      const content = data.choices[0].message.content;

      console.log(`[LLM] Tokens used: ${data.usage?.total_tokens || 'N/A'}`);

      return content;
    } catch (error) {
      console.error('[LLM] API call failed:', error);
      throw error;
    }
  }

  /**
   * 重试机制
   */
  async chatWithRetry(
    systemPrompt: string,
    userPrompt: string,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.chat(systemPrompt, userPrompt);
      } catch (error) {
        lastError = error as Error;
        console.error(`[LLM] Retry ${i + 1}/${maxRetries} failed:`, error);

        if (i < maxRetries - 1) {
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
