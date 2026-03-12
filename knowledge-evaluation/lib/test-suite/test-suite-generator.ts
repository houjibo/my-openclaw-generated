import { 
  TestSuite, 
  Question, 
  GenerateOptions, 
  GenerationResult,
  QuestionType 
} from './types';
import { QuestionGenerator, ContentChunk } from './question-generator';
import { llmClient } from './llm-client';

interface DocumentData {
  id: string;
  rawContent: string | null;
}

export class TestSuiteGenerator {
  private questionGenerator: QuestionGenerator;

  constructor() {
    this.questionGenerator = new QuestionGenerator(llmClient);
  }

  /**
   * 生成评测集
   */
  async generate(
    document: DocumentData,
    options: GenerateOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      const {
        questionTypes = ['fact', 'concept', 'application', 'comparison', 'synthesis'],
        questionCount = 20,
        difficulty = 'mixed',
        temperature = 0.7,
        model = 'gpt-4o-mini',
      } = options;

      // 检查文档内容
      if (!document.rawContent) {
        return {
          success: false,
          questions: [],
          error: 'Document has no content',
          metadata: {
            totalGenerated: 0,
            generationTimeMs: 0,
            model,
          },
        };
      }

      // 将文档内容分块
      const chunks = this.splitContent(document.rawContent);
      
      // 计算每种类型的问题数量
      const countPerType = Math.floor(questionCount / questionTypes.length);
      const remainder = questionCount % questionTypes.length;

      const allQuestions: Question[] = [];

      // 为每种类型生成问题
      for (let i = 0; i < questionTypes.length; i++) {
        const type = questionTypes[i];
        const count = countPerType + (i < remainder ? 1 : 0);
        
        if (count === 0) continue;

        let questions: Question[] = [];

        switch (type) {
          case 'fact':
            questions = await this.questionGenerator.generateFactQuestions(
              chunks, count, difficulty
            );
            break;
          case 'concept':
            questions = await this.questionGenerator.generateConceptQuestions(
              chunks, count, difficulty
            );
            break;
          case 'application':
            questions = await this.questionGenerator.generateApplicationQuestions(
              chunks, count, difficulty
            );
            break;
          case 'comparison':
            questions = await this.questionGenerator.generateComparisonQuestions(
              chunks, count, difficulty
            );
            break;
          case 'synthesis':
            questions = await this.questionGenerator.generateSynthesisQuestions(
              chunks, count, difficulty
            );
            break;
        }

        allQuestions.push(...questions);
      }

      const generationTimeMs = Date.now() - startTime;

      return {
        success: true,
        questions: allQuestions,
        metadata: {
          totalGenerated: allQuestions.length,
          generationTimeMs,
          model,
        },
      };
    } catch (error) {
      const generationTimeMs = Date.now() - startTime;
      
      return {
        success: false,
        questions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalGenerated: 0,
          generationTimeMs,
          model: options.model || 'gpt-4o-mini',
        },
      };
    }
  }

  /**
   * 将文档内容分块
   */
  private splitContent(content: string, maxChunkSize: number = 2000): ContentChunk[] {
    // 按段落分割
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const chunks: ContentChunk[] = [];
    let currentChunk = '';
    let currentPosition = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      // 如果当前段落加上已有内容超过限制，保存当前块
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          position: chunkIndex,
          context: currentChunk.substring(0, 200),
        });
        chunkIndex++;
        currentChunk = paragraph;
        currentPosition = 0;
      } else {
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
      }
      currentPosition += paragraph.length;
    }

    // 添加最后一个块
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        position: chunkIndex,
        context: currentChunk.substring(0, 200),
      });
    }

    return chunks;
  }

  /**
   * 验证问题质量
   */
  validateQuestion(question: Question): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!question.question || question.question.trim().length < 10) {
      issues.push('问题太短或为空');
    }

    if (!question.expectedAnswer || question.expectedAnswer.trim().length < 10) {
      issues.push('预期答案太短或为空');
    }

    if (!question.referenceSections || question.referenceSections.length === 0) {
      issues.push('缺少参考文档片段');
    }

    if (!question.keywords || question.keywords.length === 0) {
      issues.push('缺少关键词');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

export const testSuiteGenerator = new TestSuiteGenerator();
