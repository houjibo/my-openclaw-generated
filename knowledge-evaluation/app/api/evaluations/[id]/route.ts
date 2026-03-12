import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/evaluations/[id] - 获取评测详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            metadata: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: evaluation.id,
      documentId: evaluation.documentId,
      documentVersionId: evaluation.documentVersionId,
      overallScore: Number(evaluation.overallScore),
      intrinsicScore: Number(evaluation.intrinsicScore),
      structuralScore: Number(evaluation.structuralScore),
      consumptionScore: Number(evaluation.consumptionScore),
      metrics: evaluation.metrics,
      evaluationTimeMs: evaluation.evaluationTimeMs,
      evaluatedAt: evaluation.evaluatedAt,
      document: evaluation.document,
    });
  } catch (error) {
    console.error("Get evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
