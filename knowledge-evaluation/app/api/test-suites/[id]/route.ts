import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/test-suites/[id] - 获取评测集详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            fileType: true,
          },
        },
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: "Test suite not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: testSuite.id,
      documentId: testSuite.documentId,
      name: testSuite.name,
      description: testSuite.description,
      version: testSuite.version,
      generatedBy: testSuite.generatedBy,
      createdAt: testSuite.createdAt,
      updatedAt: testSuite.updatedAt,
      document: testSuite.document,
      questions: testSuite.questions.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        expectedAnswer: q.expectedAnswer,
        referenceSections: q.referenceSections,
        difficulty: q.difficulty,
        keywords: q.keywords,
        metadata: q.metadata,
        createdAt: q.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get test suite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/test-suites/[id] - 更新评测集
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: "Test suite not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.testSuite.update({
      where: { id },
      data: {
        name: name ?? testSuite.name,
        description: description ?? testSuite.description,
      },
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
    });

    return NextResponse.json({
      id: updated.id,
      documentId: updated.documentId,
      name: updated.name,
      description: updated.description,
      version: updated.version,
      generatedBy: updated.generatedBy,
      questionCount: updated._count.questions,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      document: updated.document,
    });
  } catch (error) {
    console.error("Update test suite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/test-suites/[id] - 删除评测集
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: "Test suite not found" },
        { status: 404 }
      );
    }

    await prisma.testSuite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test suite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
