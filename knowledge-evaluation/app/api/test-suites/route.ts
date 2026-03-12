import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { testSuiteGenerator } from "@/lib/test-suite";

// POST /api/test-suites - 创建评测集
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      documentId,
      name,
      description,
      questionTypes,
      questionCount,
      difficulty,
    } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Test suite name is required" },
        { status: 400 }
      );
    }

    // 检查文档是否存在
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.parseStatus !== "success" || !document.rawContent) {
      return NextResponse.json(
        { error: "Document must be successfully parsed before generating test suite" },
        { status: 400 }
      );
    }

    // 生成评测问题
    const result = await testSuiteGenerator.generate(document, {
      questionTypes: questionTypes || ["fact", "concept", "application", "comparison", "synthesis"],
      questionCount: questionCount || 20,
      difficulty: difficulty || "mixed",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate questions" },
        { status: 500 }
      );
    }

    // 创建评测集
    const testSuite = await prisma.testSuite.create({
      data: {
        documentId,
        name,
        description: description || null,
        version: 1,
        generatedBy: "auto",
      },
    });

    // 创建评测问题
    const questionsData = result.questions.map((q) => ({
      testSuiteId: testSuite.id,
      type: q.type,
      question: q.question,
      expectedAnswer: q.expectedAnswer,
      referenceSections: q.referenceSections as any,
      difficulty: q.difficulty,
      keywords: q.keywords as any,
      metadata: q.metadata as any,
    }));

    await prisma.testQuestion.createMany({
      data: questionsData,
    });

    // 获取完整的问题列表
    const questions = await prisma.testQuestion.findMany({
      where: { testSuiteId: testSuite.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        id: testSuite.id,
        documentId: testSuite.documentId,
        name: testSuite.name,
        description: testSuite.description,
        version: testSuite.version,
        generatedBy: testSuite.generatedBy,
        createdAt: testSuite.createdAt,
        updatedAt: testSuite.updatedAt,
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          expectedAnswer: q.expectedAnswer,
          referenceSections: q.referenceSections,
          difficulty: q.difficulty,
          keywords: q.keywords,
        })),
        generationMetadata: result.metadata,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create test suite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/test-suites - 获取评测集列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const where = documentId ? { documentId } : {};

    const [testSuites, total] = await Promise.all([
      prisma.testSuite.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
          _count: {
            select: {
              questions: true,
            },
          },
        },
      }),
      prisma.testSuite.count({ where }),
    ]);

    return NextResponse.json({
      testSuites: testSuites.map((suite) => ({
        id: suite.id,
        documentId: suite.documentId,
        name: suite.name,
        description: suite.description,
        version: suite.version,
        generatedBy: suite.generatedBy,
        questionCount: suite._count.questions,
        createdAt: suite.createdAt,
        updatedAt: suite.updatedAt,
        document: suite.document,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get test suites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
