import { QuestionType, Question, ReferenceSection, GenerateOptions, GenerationResult } from './types';
import { llmClient, LLMClient } from './llm-client';

export interface ContentChunk {
  content: string;
  position: number;
  context: string;
}

export class QuestionGenerator {
  private llmClient: LLMClient;

  constructor(llmClientInstance: LLMClient = llmClient) {
    this.llmClient = llmClientInstance;
  }

  /**
   * 生成事实类问题
   * 基于文档中的具体事实、数据、定义等信息
   */
  async generateFactQuestions(
    chunks: ContentChunk[],
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Question[]> {
    return this.generateQuestionsForType(chunks, 'fact', count, difficulty);
  }

  /**
   * 生成概念类问题
   * 关于概念、原理、理论的解释和理解
   */
  async generateConceptQuestions(
    chunks: ContentChunk[],
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Question[]> {
    return this.generateQuestionsForType(chunks, 'concept', count, difficulty);
  }

  /**
   * 生成应用类问题
   * 将知识应用到具体场景或案例
   */
  async generateApplicationQuestions(
    chunks: ContentChunk[],
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Question[]> {
    return this.generateQuestionsForType(chunks, 'application', count, difficulty);
  }

  /**
   * 生成对比类问题
   * 比较两个或多个概念、方法、理论的异同
   */
  async generateComparisonQuestions(
    chunks: ContentChunk[],
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Question[]> {
    // 对比类问题需要更长的上下文，合并相邻的 chunks
    const mergedChunks = this.mergeAdjacentChunks(chunks, 3);
    return this.generateQuestionsForType(mergedChunks, 'comparison', count, difficulty);
  }

  /**
   * 生成综合类问题
   * 需要整合多个知识点进行分析和判断
   */
  async generateSynthesisQuestions(
    chunks: ContentChunk[],
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Question[]> {
    // 综合类问题需要更全面的上下文，使用更大的合并
    const mergedChunks = this.mergeAdjacentChunks(chunks, 5);
    return this.generateQuestionsForType(mergedChunks, 'synthesis', count, difficulty);
  }

  /**
   * 为指定类型生成问题
   */
  private async generateQuestionsForType(
    chunks: ContentChunk[],
    type: QuestionType,
    count: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Question[]> {
    const questions: Question[] = [];
    const chunksPerQuestion = Math.max(1, Math.floor(chunks.length / count));
    
    for (let i = 0; i < count && i < chunks.length; i++) {
      const chunkIndex = Math.min(i * chunksPerQuestion, chunks.length - 1);
      const chunk = chunks[chunkIndex];
      
      try {
        const response = await this.llmClient.generateQuestions({
          content: chunk.content,
          questionType: type,
          count: 1,
          difficulty,
        });

        if (response.questions && response.questions.length > 0) {
          const q = response.questions[0];
          questions.push({
            type: q.type,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            referenceSections: [{
              content: q.referenceSection || chunk.content,
              position: chunk.position,
              context: chunk.context,
            }],
            difficulty: q.difficulty,
            keywords: q.keywords,
            metadata: {
              generatedAt: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error(`Error generating ${type} question:`, error);
      }
    }

    return questions;
  }

  /**
   * 合并相邻的 content chunks
   */
  private mergeAdjacentChunks(chunks: ContentChunk[], mergeCount: number): ContentChunk[] {
    const merged: ContentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i += mergeCount) {
      const toMerge = chunks.slice(i, i + mergeCount);
      if (toMerge.length > 0) {
        merged.push({
          content: toMerge.map(c => c.content).join('\n\n'),
          position: toMerge[0].position,
          context: toMerge.map(c => c.context).join(' '),
        });
      }
    }

    return merged;
  }
}

export const questionGenerator = new QuestionGenerator();
