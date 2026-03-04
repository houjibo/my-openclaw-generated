import { Intent, IntentRecognitionResult } from '../models/intent';
import { IntentRecognizer } from './base';
import { LLMClient } from '../llm-client';

/**
 * LLM 意图识别器
 * 使用大语言模型来理解和识别用户意图
 */
export class LLMIntentRecognizer extends IntentRecognizer {
  private llmClient: LLMClient;

  constructor(config: { apiKey: string; baseUrl: string; model: string }) {
    super();
    this.llmClient = new LLMClient(config);
  }

  async recognize(input: string, context?: any): Promise<IntentRecognitionResult> {
    // 构建 LLM prompt
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    try {
      // 调用 LLM API
      const llmResponse = await this.llmClient.chatWithRetry(systemPrompt, userPrompt);

      // 解析 LLM 响应
      return this.parseLLMResponse(llmResponse);
    } catch (error) {
      console.error('[IntentRecognizer] LLM 调用失败，回退到规则引擎:', error);
      // 回退到规则引擎
      const fallbackResponse = this.fallbackRuleBased(input);
      return this.parseLLMResponse(fallbackResponse);
    }
  }

  private buildSystemPrompt(): string {
    const intentDescriptions = this.intents
      .map(intent => `- ${intent.id} (${intent.name}): ${intent.description}`)
      .join('\n');

    return `你是一个意图识别专家。你的任务是从用户的输入中识别出最可能的意图。

可用的意图列表：
${intentDescriptions}

请分析用户输入，识别出最匹配的意图，并提供置信度（0-1之间的数字）。
返回格式必须是有效的 JSON，包含以下字段：
{
  "intent_id": "意图ID",
  "confidence": 0.95,
  "reasoning": "选择这个意图的理由",
  "alternatives": [
    {"intent_id": "备选意图ID", "confidence": 0.3}
  ]
}

注意：
1. 只返回 JSON，不要有任何其他文字
2. confidence 必须是 0-1 之间的数字
3. alternatives 数组可选，最多 3 个`;
  }

  private buildUserPrompt(input: string, context?: any): string {
    let prompt = `用户输入: "${input}"`;

    if (context) {
      prompt += `\n\n上下文信息:\n${JSON.stringify(context, null, 2)}`;
    }

    return prompt;
  }

  /**
   * 回退规则引擎
   * 当 LLM 调用失败时使用
   */
  private fallbackRuleBased(input: string): string {
    const lowerInput = input.toLowerCase();

    // 简单规则匹配
    if (lowerInput.includes('打开') || lowerInput.includes('open')) {
      return JSON.stringify({
        intent_id: 'open_folder',
        confidence: 0.8,
        reasoning: '规则引擎：检测到"打开"关键词',
        alternatives: [
          { intent_id: 'explore_folder', confidence: 0.4 }
        ]
      });
    }

    if (lowerInput.includes('删除') || lowerInput.includes('delete')) {
      return JSON.stringify({
        intent_id: 'delete_folder',
        confidence: 0.85,
        reasoning: '规则引擎：检测到"删除"关键词',
        alternatives: []
      });
    }

    if (lowerInput.includes('压缩') || lowerInput.includes('zip') || lowerInput.includes('compress')) {
      return JSON.stringify({
        intent_id: 'compress_folder',
        confidence: 0.8,
        reasoning: '规则引擎：检测到"压缩"关键词',
        alternatives: []
      });
    }

    if (lowerInput.includes('依赖') || lowerInput.includes('dependency')) {
      return JSON.stringify({
        intent_id: 'analyze_dependencies',
        confidence: 0.85,
        reasoning: '规则引擎：检测到"依赖"关键词',
        alternatives: []
      });
    }

    if (lowerInput.includes('构建') || lowerInput.includes('build')) {
      return JSON.stringify({
        intent_id: 'build_project',
        confidence: 0.85,
        reasoning: '规则引擎：检测到"构建"关键词',
        alternatives: []
      });
    }

    // 默认：探索/分析
    return JSON.stringify({
      intent_id: 'explore_folder',
      confidence: 0.6,
      reasoning: '规则引擎：默认意图',
      alternatives: []
    });
  }

  private parseLLMResponse(response: string): IntentRecognitionResult {
    try {
      // 尝试解析 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法找到有效的 JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const intent = this.getIntentById(parsed.intent_id);

      if (!intent) {
        throw new Error(`Intent ${parsed.intent_id} not found`);
      }

      return {
        intent: { ...intent, confidence: parsed.confidence },
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        alternatives: (parsed.alternatives || []).map((alt: any) => ({
          intent: this.getIntentById(alt.intent_id)!,
          confidence: alt.confidence
        })).filter((alt: any) => alt.intent)
      };
    } catch (error) {
      console.error('[IntentRecognizer] 解析 LLM 响应失败:', error);
      throw new Error(`Failed to parse LLM response: ${error}`);
    }
  }
}
