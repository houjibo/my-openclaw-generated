import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/documents/[id] - 获取文档详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            version: true,
            isOptimized: true,
            createdAt: true,
          },
        },
        evaluations: {
          orderBy: { evaluatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            overallScore: true,
            intrinsicScore: true,
            structuralScore: true,
            consumptionScore: true,
            evaluatedAt: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize ? Number(document.fileSize) : null,
      parseStatus: document.parseStatus,
      parseError: document.parseError,
      rawContent: document.rawContent,
      structuredContent: document.structuredContent as any,
      metadata: document.metadata as any,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      versions: document.versions,
      evaluations: document.evaluations,
    });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - 删除文档
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
