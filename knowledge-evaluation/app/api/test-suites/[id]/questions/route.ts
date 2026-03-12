import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/test-suites/[id]/questions - 添加问题
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type,
      question,
      expectedAnswer,
      referenceSections,
      difficulty,
      keywords,
    } = body;

    if (!type || !question || !expectedAnswer) {
      return NextResponse.json(
        { error: "Type, question, and expectedAnswer are required" },
        { status: 400 }
      );
    }

    const testSuite = await prisma.testSuite.findUnique({
      where: { id },
    });

    if (!testSuite) {
      return NextResponse.json(
        { error: "Test suite not found" },
        { status: 404 }
      );
    }

    const newQuestion = await prisma.testQuestion.create({
      data: {
        testSuiteId: id,
        type,
        question,
        expectedAnswer,
        referenceSections: referenceSections || [],
        difficulty: difficulty || "medium",
        keywords: keywords || [],
      },
    });

    return NextResponse.json(
      {
        id: newQuestion.id,
        type: newQuestion.type,
        question: newQuestion.question,
        expectedAnswer: newQuestion.expectedAnswer,
        referenceSections: newQuestion.referenceSections,
        difficulty: newQuestion.difficulty,
        keywords: newQuestion.keywords,
        createdAt: newQuestion.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
