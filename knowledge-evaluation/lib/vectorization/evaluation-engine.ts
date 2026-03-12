import { prisma } from '@/lib/db';
import { documentVectorizer } from './document-vectorizer';
import OpenAI from 'openai';

export interface EvaluationRunOptions {
  testSuiteId: string;
  vectorizedDocumentId: string;
  topK?: number;
  relevanceThreshold?: number;
}

export interface EvaluationMetrics {
  totalQuestions: number;
  retrievedQuestions: number;
  passedQuestions: number;
  accuracy: number;
  recall: number;
  f1Score: number;
  passRate: number;
  avgRelevanceScore: number;
  detailedResults: TestResult[];
}

export interface TestResult {
  questionId: string;
  question: string;
  expectedAnswer: string;
  retrieved: boolean;
  relevanceScore: number;
  retrievedChunks: Array<{
    content: string;
    position: number;
    similarity: number;
  }>;
  passed: boolean;
  reason?: string;
}

export class EvaluationEngine {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async runEvaluation(options: EvaluationRunOptions): Promise<EvaluationMetrics> {
    const startTime = Date.now();
    const { testSuiteId, vectorizedDocumentId, topK = 5, relevanceThreshold = 0.7 } = options;

    // 获取评测集
    const testSuite = await prisma.testSuite.findUnique({
      where: { id: testSuiteId },
      include: {
        questions: true,
      },
    });

    if (!testSuite) {
      throw new Error('Test suite not found');
    }

    // 获取向量化文档
    const vectorizedDoc = await prisma.vectorizedDocument.findUnique({
      where: { id: vectorizedDocumentId },
    });

    if (!vectorizedDoc) {
      throw new Error('Vectorized document not found');
    }

    const detailedResults: TestResult[] = [];

    // 对每个问题进行检索测试
    for (const question of testSuite.questions) {
      const result = await this.evaluateQuestion(
        question.question,
        question.expectedAnswer,
        question.id,
        vectorizedDocumentId,
        topK,
        relevanceThreshold
      );
      detailedResults.push(result);
    }

    // 计算指标
    const metrics = this.calculateMetrics(detailedResults);

    // 保存评测运行结果
    const evaluationRun = await prisma.evaluationRun.create({
      data: {
        testSuiteId,
        vectorizedDocumentId,
        totalQuestions: metrics.totalQuestions,
        passedQuestions: metrics.passedQuestions,
        passRate: metrics.passRate,
        avgRelevanceScore: metrics.avgRelevanceScore,
        metrics: {
          accuracy: metrics.accuracy,
          recall: metrics.recall,
          f1Score: metrics.f1Score,
        },
        executionTimeMs: Date.now() - startTime,
      },
    });

    // 保存详细结果
    await Promise.all(
      detailedResults.map((result) =>
        prisma.testResult.create({
          data: {
            evaluationRunId: evaluationRun.id,
            questionId: result.questionId,
            retrieved: result.retrieved,
            retrievedChunks: result.retrievedChunks as any,
            relevanceScore: result.relevanceScore,
            passed: result.passed,
          },
        })
      )
    );

    return metrics;
  }

  private async evaluateQuestion(
    question: string,
    expectedAnswer: string,
    questionId: string,
    vectorizedDocumentId: string,
    topK: number,
    relevanceThreshold: number
  ): Promise<TestResult> {
    // 1. 检索相关chunks
    const searchResults = await documentVectorizer.searchSimilar(
      question,
      vectorizedDocumentId,
      topK
    );

    if (searchResults.length === 0) {
      return {
        questionId,
        question,
        expectedAnswer,
        retrieved: false,
        relevanceScore: 0,
        retrievedChunks: [],
        passed: false,
        reason: '未检索到相关文档片段',
      };
    }

    // 2. 计算相关度分数
    const bestMatch = searchResults[0];
    const relevanceScore = bestMatch.similarity;

    // 3. 判断是否通过（基于相关度和内容匹配）
    const retrievedChunks = searchResults.map((r) => ({
      content: r.chunk.content,
      position: r.chunk.position,
      similarity: r.similarity,
    }));

    // 4. 使用LLM判断答案是否包含在检索结果中
    const answerContained = await this.checkAnswerContainment(
      expectedAnswer,
      searchResults.map((r) => r.chunk.content).join('\n\n')
    );

    const passed = relevanceScore >= relevanceThreshold && answerContained;

    return {
      questionId,
      question,
      expectedAnswer,
      retrieved: true,
      relevanceScore,
      retrievedChunks,
      passed,
      reason: passed ? undefined : relevanceScore < relevanceThreshold 
        ? '相关度低于阈值' 
        : '答案未在检索结果中找到',
    };
  }

  private async checkAnswerContainment(
    expectedAnswer: string,
    retrievedContent: string
  ): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个答案匹配助手。判断检索到的内容是否包含预期答案的关键信息。只回答 true 或 false。',
          },
          {
            role: 'user',
            content: `预期答案: ${expectedAnswer}

检索到的内容:
${retrievedContent}

检索内容是否包含预期答案的关键信息？`,
          },
        ],
        temperature: 0.1,
      });

      const answer = response.choices[0]?.message?.content?.toLowerCase() || '';
      return answer.includes('true') || answer.includes('是');
    } catch (error) {
      console.error('Answer containment check error:', error);
      return false;
    }
  }

  private calculateMetrics(results: TestResult[]): EvaluationMetrics {
    const totalQuestions = results.length;
    const retrievedQuestions = results.filter((r) => r.retrieved).length;
    const passedQuestions = results.filter((r) => r.passed).length;

    // 准确率：检索到的相关问题中，答案正确的比例
    const accuracy = retrievedQuestions > 0 
      ? passedQuestions / retrievedQuestions 
      : 0;

    // 召回率：所有问题中，成功检索并回答正确的比例
    const recall = totalQuestions > 0 
      ? passedQuestions / totalQuestions 
      : 0;

    // F1分数
    const f1Score = accuracy + recall > 0 
      ? (2 * accuracy * recall) / (accuracy + recall) 
      : 0;

    // 通过率
    const passRate = totalQuestions > 0 
      ? passedQuestions / totalQuestions 
      : 0;

    // 平均相关度分数
    const avgRelevanceScore = retrievedQuestions > 0
      ? results
          .filter((r) => r.retrieved)
          .reduce((sum, r) => sum + r.relevanceScore, 0) / retrievedQuestions
      : 0;

    return {
      totalQuestions,
      retrievedQuestions,
      passedQuestions,
      accuracy,
      recall,
      f1Score,
      passRate,
      avgRelevanceScore,
      detailedResults: results,
    };
  }

  async getEvaluationRun(evaluationRunId: string) {
    return await prisma.evaluationRun.findUnique({
      where: { id: evaluationRunId },
      include: {
        testResults: {
          include: {
            question: true,
          },
        },
        vectorizedDocument: {
          include: {
            document: {
              select: {
                id: true,
                filename: true,
              },
            },
            documentVersion: {
              select: {
                version: true,
              },
            },
          },
        },
      },
    });
  }
}

export const evaluationEngine = new EvaluationEngine();
