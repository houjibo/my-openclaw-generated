import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EvaluationEngine } from "@/lib/evaluators";

// POST /api/evaluations - 创建文档评测
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.parseStatus !== "success") {
      return NextResponse.json(
        { error: "Document must be successfully parsed before evaluation" },
        { status: 400 }
      );
    }

    const engine = new EvaluationEngine();
    const result = await engine.evaluate(document);

    const evaluation = await prisma.evaluation.create({
      data: {
        documentId,
        overallScore: result.overallScore,
        intrinsicScore: result.intrinsicScore,
        structuralScore: result.structuralScore,
        consumptionScore: result.consumptionScore,
        metrics: result.metrics as any,
        evaluationTimeMs: result.evaluationTimeMs,
      },
    });

    return NextResponse.json(
      {
        id: evaluation.id,
        documentId: evaluation.documentId,
        overallScore: Number(evaluation.overallScore),
        intrinsicScore: Number(evaluation.intrinsicScore),
        structuralScore: Number(evaluation.structuralScore),
        consumptionScore: Number(evaluation.consumptionScore),
        metrics: evaluation.metrics,
        evaluationTimeMs: evaluation.evaluationTimeMs,
        evaluatedAt: evaluation.evaluatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/evaluations - 获取评测列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const where = documentId ? { documentId } : {};

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        orderBy: { evaluatedAt: "desc" },
        skip,
        take: limit,
        include: {
          document: {
            select: {
              id: true,
              filename: true,
              fileType: true,
            },
          },
        },
      }),
      prisma.evaluation.count({ where }),
    ]);

    return NextResponse.json({
      evaluations: evaluations.map((evaluation) => ({
        id: evaluation.id,
        documentId: evaluation.documentId,
        overallScore: Number(evaluation.overallScore),
        intrinsicScore: Number(evaluation.intrinsicScore),
        structuralScore: Number(evaluation.structuralScore),
        consumptionScore: Number(evaluation.consumptionScore),
        metrics: evaluation.metrics,
        evaluationTimeMs: evaluation.evaluationTimeMs,
        evaluatedAt: evaluation.evaluatedAt,
        document: evaluation.document,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get evaluations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
