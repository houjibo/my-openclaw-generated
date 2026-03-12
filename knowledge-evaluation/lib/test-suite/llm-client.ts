import OpenAI from 'openai';
import { LLMResponse, QuestionType } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateQuestionsParams {
  content: string;
  questionType: QuestionType;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  temperature?: number;
  model?: string;
}

export class LLMClient {
  private client: OpenAI;
  private defaultModel: string;
  private defaultTemperature: number;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.defaultTemperature = 0.7;
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<LLMResponse> {
    const {
      content,
      questionType,
      count,
      difficulty,
      temperature = this.defaultTemperature,
      model = this.defaultModel,
    } = params;

    const prompt = this.buildPrompt(content, questionType, count, difficulty);

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的知识评测问题生成助手。你的任务是根据提供的文档内容生成高质量的评测问题。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        response_format: { type: 'json_object' },
      });

      const content_text = response.choices[0]?.message?.content;
      if (!content_text) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(content_text) as LLMResponse;
      return parsed;
    } catch (error) {
      console.error('LLM generation error:', error);
      throw error;
    }
  }

  async extractKeywords(text: string, maxKeywords: number = 5): Promise<string[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: '你是一个关键词提取助手。请从文本中提取最重要的关键词。',
          },
          {
            role: 'user',
            content: `请从以下文本中提取最多 ${maxKeywords} 个最重要的关键词（名词或名词短语），以 JSON 数组格式返回：\n\n${text}\n\n返回格式：["关键词1", "关键词2", ...]`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content_text = response.choices[0]?.message?.content;
      if (!content_text) {
        return [];
      }

      const parsed = JSON.parse(content_text);
      return parsed.keywords || [];
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }

  private buildPrompt(
    content: string,
    questionType: QuestionType,
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): string {
    const typeDescriptions: Record<QuestionType, string> = {
      fact: '事实类问题 - 基于文档中的具体事实、数据、定义等信息',
      concept: '概念类问题 - 关于概念、原理、理论的解释和理解',
      application: '应用类问题 - 将知识应用到具体场景或案例',
      comparison: '对比类问题 - 比较两个或多个概念、方法、理论的异同',
      synthesis: '综合类问题 - 需要整合多个知识点进行分析和判断',
    };

    const difficultyInstructions: Record<string, string> = {
      easy: '问题应该简单直接，答案可以在文档中直接找到',
      medium: '问题需要一定的理解和推理，答案可能需要整合多个句子',
      hard: '问题需要深入理解和分析，可能需要跨段落整合信息',
      mixed: '混合难度，包含简单、中等和困难的问题',
    };

    return `请根据以下文档内容生成 ${count} 个${typeDescriptions[questionType]}。

难度要求：${difficultyInstructions[difficulty]}

文档内容：
---
${content.substring(0, 8000)}
---

请生成问题，并以以下 JSON 格式返回：
{
  "questions": [
    {
      "type": "${questionType}",
      "question": "问题内容",
      "expectedAnswer": "预期答案（详细且准确）",
      "referenceSection": "相关文档片段（原文引用）",
      "difficulty": "easy|medium|hard",
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}

要求：
1. 问题应该基于文档内容，不要引入外部知识
2. 预期答案应该准确、完整
3. 每个问题都要标注相关的文档片段
4. 关键词应该是问题涉及的核心概念`;
  }
}

export const llmClient = new LLMClient();
