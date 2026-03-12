import { NextResponse } from 'next/server';
import { evaluationComparer } from '@/lib/vectorization';

// POST /api/evaluation-runs/compare - 对比两个评测运行
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { baseEvaluationRunId, comparisonEvaluationRunId } = body;

    if (!baseEvaluationRunId || !comparisonEvaluationRunId) {
      return NextResponse.json(
        { error: 'Both base and comparison evaluation run IDs are required' },
        { status: 400 }
      );
    }

    const comparison = await evaluationComparer.compareEvaluations({
      baseEvaluationRunId,
      comparisonEvaluationRunId,
    });

    return NextResponse.json({
      baseEvaluationRunId: comparison.baseEvaluationRunId,
      comparisonEvaluationRunId: comparison.comparisonEvaluationRunId,
      documentId: comparison.documentId,
      baseVersion: comparison.baseVersion,
      comparisonVersion: comparison.comparisonVersion,
      comparisons: comparison.comparisons,
      summary: comparison.summary,
      questionLevelComparison: comparison.questionLevelComparison.map((qc) => ({
        questionId: qc.questionId,
        question: qc.question,
        baseResult: qc.baseResult,
        comparisonResult: qc.comparisonResult,
        change: qc.change,
      })),
    });
  } catch (error) {
    console.error('Compare evaluations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
