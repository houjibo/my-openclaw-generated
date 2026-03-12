import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evaluationEngine } from '@/lib/vectorization';

// GET /api/evaluation-runs - 获取评测运行列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testSuiteId = searchParams.get('testSuiteId');
    const vectorizedDocumentId = searchParams.get('vectorizedDocumentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (testSuiteId) where.testSuiteId = testSuiteId;
    if (vectorizedDocumentId) where.vectorizedDocumentId = vectorizedDocumentId;

    const [runs, total] = await Promise.all([
      prisma.evaluationRun.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        skip,
        take: limit,
        include: {
          testSuite: {
            select: {
              id: true,
              name: true,
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
      }),
      prisma.evaluationRun.count({ where }),
    ]);

    return NextResponse.json({
      runs: runs.map((run) => ({
        id: run.id,
        testSuiteId: run.testSuiteId,
        testSuiteName: run.testSuite.name,
        vectorizedDocumentId: run.vectorizedDocumentId,
        documentName: run.vectorizedDocument.document.filename,
        version: run.vectorizedDocument.documentVersion?.version,
        totalQuestions: run.totalQuestions,
        passedQuestions: run.passedQuestions,
        passRate: Number(run.passRate),
        avgRelevanceScore: Number(run.avgRelevanceScore),
        metrics: run.metrics,
        executedAt: run.executedAt,
        executionTimeMs: run.executionTimeMs,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get evaluation runs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/evaluation-runs - 执行评测
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      testSuiteId,
      vectorizedDocumentId,
      topK = 5,
      relevanceThreshold = 0.7,
    } = body;

    if (!testSuiteId || !vectorizedDocumentId) {
      return NextResponse.json(
        { error: 'Test suite ID and vectorized document ID are required' },
        { status: 400 }
      );
    }

    // 执行评测
    const metrics = await evaluationEngine.runEvaluation({
      testSuiteId,
      vectorizedDocumentId,
      topK,
      relevanceThreshold,
    });

    return NextResponse.json({
      success: true,
      testSuiteId,
      vectorizedDocumentId,
      metrics: {
        totalQuestions: metrics.totalQuestions,
        retrievedQuestions: metrics.retrievedQuestions,
        passedQuestions: metrics.passedQuestions,
        accuracy: metrics.accuracy,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        passRate: metrics.passRate,
        avgRelevanceScore: metrics.avgRelevanceScore,
      },
      detailedResults: metrics.detailedResults.map((r) => ({
        questionId: r.questionId,
        question: r.question,
        retrieved: r.retrieved,
        relevanceScore: r.relevanceScore,
        passed: r.passed,
        reason: r.reason,
      })),
    });
  } catch (error) {
    console.error('Run evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
