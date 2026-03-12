import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/evaluation-runs/[id] - 获取评测运行详情
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const run = await prisma.evaluationRun.findUnique({
      where: { id },
      include: {
        testSuite: {
          select: {
            id: true,
            name: true,
            description: true,
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
        testResults: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                expectedAnswer: true,
                type: true,
                difficulty: true,
              },
            },
          },
          orderBy: {
            relevanceScore: 'desc',
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Evaluation run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: run.id,
      testSuite: run.testSuite,
      vectorizedDocument: {
        id: run.vectorizedDocument.id,
        document: run.vectorizedDocument.document,
        version: run.vectorizedDocument.documentVersion?.version,
        embeddingModel: run.vectorizedDocument.embeddingModel,
        chunkingStrategy: run.vectorizedDocument.chunkingStrategy,
      },
      totalQuestions: run.totalQuestions,
      passedQuestions: run.passedQuestions,
      passRate: Number(run.passRate),
      avgRelevanceScore: Number(run.avgRelevanceScore),
      metrics: run.metrics,
      executedAt: run.executedAt,
      executionTimeMs: run.executionTimeMs,
      testResults: run.testResults.map((result) => ({
        id: result.id,
        question: result.question,
        retrieved: result.retrieved,
        retrievedChunks: result.retrievedChunks,
        relevanceScore: Number(result.relevanceScore),
        passed: result.passed,
      })),
    });
  } catch (error) {
    console.error('Get evaluation run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
