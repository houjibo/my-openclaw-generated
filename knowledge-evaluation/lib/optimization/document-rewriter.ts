import { LLMClient } from '@/lib/test-suite/llm-client';

export interface RewriteOptions {
  replacePronouns?: boolean;
  optimizeStructure?: boolean;
  removeDuplicates?: boolean;
  enhanceContext?: boolean;
  preserveLength?: boolean;
}

export interface RewriteResult {
  originalContent: string;
  rewrittenContent: string;
  changes: RewriteChange[];
  tokensUsed?: number;
}

export interface RewriteChange {
  type: 'pronoun' | 'structure' | 'duplicate' | 'context';
  original: string;
  modified: string;
  position: number;
  description: string;
}

export class DocumentRewriter {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient();
  }

  async rewrite(
    content: string,
    options: RewriteOptions = {}
  ): Promise<RewriteResult> {
    const changes: RewriteChange[] = [];
    let rewrittenContent = content;

    // 步骤1: 代词替换
    if (options.replacePronouns !== false) {
      const pronounResult = await this.replacePronouns(rewrittenContent);
      rewrittenContent = pronounResult.content;
      changes.push(...pronounResult.changes);
    }

    // 步骤2: 去重
    if (options.removeDuplicates !== false) {
      const duplicateResult = this.removeDuplicates(rewrittenContent);
      rewrittenContent = duplicateResult.content;
      changes.push(...duplicateResult.changes);
    }

    // 步骤3: 结构优化
    if (options.optimizeStructure !== false) {
      const structureResult = await this.optimizeStructure(rewrittenContent);
      rewrittenContent = structureResult.content;
      changes.push(...structureResult.changes);
    }

    // 步骤4: 上下文补充
    if (options.enhanceContext !== false) {
      const contextResult = await this.enhanceContext(rewrittenContent);
      rewrittenContent = contextResult.content;
      changes.push(...contextResult.changes);
    }

    return {
      originalContent: content,
      rewrittenContent,
      changes,
    };
  }

  private async replacePronouns(content: string): Promise<{
    content: string;
    changes: RewriteChange[];
  }> {
    const changes: RewriteChange[] = [];
    const pronounPatterns = [
      {
        pattern: /\b(它|它们|他|她|这个|那个|这些|那些|前者|后者)\b/g,
        type: 'pronoun' as const,
        description: '代词替换为具体名词',
      },
      {
        pattern: /\b(it|they|them|this|that|these|those|the former|the latter)\b/gi,
        type: 'pronoun' as const,
        description: 'Pronoun replaced with specific noun',
      },
    ];

    // 使用 LLM 识别和替换代词
    const prompt = `分析以下文本中的代词，并将其替换为具体的名词或名词短语，以提高文档的清晰度和可理解性。

原文：
${content}

请返回改写后的文本，并列出所有修改。以 JSON 格式返回：
{
  "rewritten": "改写后的文本",
  "replacements": [
    {
      "original": "原文片段",
      "replacement": "替换后的片段",
      "position": 位置描述
    }
  ]
}`;

    try {
      const response = await this.llmClient['client'].chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文档编辑助手，擅长将模糊的代词替换为清晰的具体名词。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (result.replacements) {
        result.replacements.forEach((replacement: any) => {
          changes.push({
            type: 'pronoun',
            original: replacement.original,
            modified: replacement.replacement,
            position: content.indexOf(replacement.original),
            description: `代词替换: "${replacement.original}" → "${replacement.replacement}"`,
          });
        });
      }

      return {
        content: result.rewritten || content,
        changes,
      };
    } catch (error) {
      console.error('Pronoun replacement error:', error);
      return { content, changes };
    }
  }

  private removeDuplicates(content: string): {
    content: string;
    changes: RewriteChange[];
  } {
    const changes: RewriteChange[] = [];
    const paragraphs = content.split(/\n\n+/);
    const uniqueParagraphs: string[] = [];
    const seenContent = new Set<string>();

    for (const paragraph of paragraphs) {
      const normalized = this.normalizeText(paragraph);

      // 检查相似度
      let isDuplicate = false;
      for (const seen of seenContent) {
        if (this.calculateSimilarity(normalized, seen) > 0.85) {
          isDuplicate = true;
          changes.push({
            type: 'duplicate',
            original: paragraph.substring(0, 100) + '...',
            modified: '[已删除重复内容]',
            position: content.indexOf(paragraph),
            description: '删除重复段落',
          });
          break;
        }
      }

      if (!isDuplicate) {
        seenContent.add(normalized);
        uniqueParagraphs.push(paragraph);
      }
    }

    return {
      content: uniqueParagraphs.join('\n\n'),
      changes,
    };
  }

  private async optimizeStructure(content: string): Promise<{
    content: string;
    changes: RewriteChange[];
  }> {
    const changes: RewriteChange[] = [];

    const prompt = `优化以下文档的结构，包括：
1. 添加或优化标题层级
2. 改进段落划分
3. 为列表项添加适当的标记
4. 确保逻辑流畅

原文：
${content}

请返回优化后的文本，并描述所做的结构性修改。以 JSON 格式返回：
{
  "optimized": "优化后的文本",
  "changes": [
    {
      "description": "修改描述",
      "original": "原文（可选）",
      "modified": "修改后（可选）"
    }
  ]
}`;

    try {
      const response = await this.llmClient['client'].chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文档结构优化专家，擅长改善文档的组织结构和可读性。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (result.changes) {
        result.changes.forEach((change: any) => {
          changes.push({
            type: 'structure',
            original: change.original || '',
            modified: change.modified || '',
            position: 0,
            description: change.description,
          });
        });
      }

      return {
        content: result.optimized || content,
        changes,
      };
    } catch (error) {
      console.error('Structure optimization error:', error);
      return { content, changes };
    }
  }

  private async enhanceContext(content: string): Promise<{
    content: string;
    changes: RewriteChange[];
  }>

{
    const changes: RewriteChange[] = [];

    const prompt = `分析以下文档，为可能缺乏上下文的段落添加必要的背景信息或解释，使每个部分都能独立理解。

原文：
${content}

请返回增强后的文本，并列出所有添加上下文的地方。以 JSON 格式返回：
{
  "enhanced": "增强后的文本",
  "enhancements": [
    {
      "location": "位置描述",
      "addedContent": "添加的内容",
      "reason": "添加原因"
    }
  ]
}`;

    try {
      const response = await this.llmClient['client'].chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文档编辑助手，擅长为文档添加必要的上下文信息以提高可读性。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (result.enhancements) {
        result.enhancements.forEach((enhancement: any) => {
          changes.push({
            type: 'context',
            original: '',
            modified: enhancement.addedContent,
            position: 0,
            description: `上下文增强 (${enhancement.location}): ${enhancement.reason}`,
          });
        });
      }

      return {
        content: result.enhanced || content,
        changes,
      };
    } catch (error) {
      console.error('Context enhancement error:', error);
      return { content, changes };
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

export const documentRewriter = new DocumentRewriter();
