import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/test-suites/[id]/questions/[questionId] - 更新问题
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;
    const body = await request.json();
    const {
      type,
      question,
      expectedAnswer,
      referenceSections,
      difficulty,
      keywords,
    } = body;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: "Test suite not found" },
        { status: 404 }
      );
    }

    const existingQuestion = await prisma.testQuestion.findFirst({
      where: {
        id: questionId,
        testSuiteId: id,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.testQuestion.update({
      where: { id: questionId },
      data: {
        type: type ?? existingQuestion.type,
        question: question ?? existingQuestion.question,
        expectedAnswer: expectedAnswer ?? existingQuestion.expectedAnswer,
        referenceSections: referenceSections ?? existingQuestion.referenceSections,
        difficulty: difficulty ?? existingQuestion.difficulty,
        keywords: keywords ?? existingQuestion.keywords,
      },
    });

    return NextResponse.json({
      id: updated.id,
      type: updated.type,
      question: updated.question,
      expectedAnswer: updated.expectedAnswer,
      referenceSections: updated.referenceSections,
      difficulty: updated.difficulty,
      keywords: updated.keywords,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/test-suites/[id]/questions/[questionId] - 删除问题
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: "Test suite not found" },
        { status: 404 }
      );
    }

    const existingQuestion = await prisma.testQuestion.findFirst({
      where: {
        id: questionId,
        testSuiteId: id,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    await prisma.testQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
