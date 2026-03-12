import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { versionManager } from '@/lib/optimization';

// GET /api/versions?documentId=xxx - 获取文档版本列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const versions = await versionManager.getVersions(documentId);

    return NextResponse.json({
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        isOptimized: v.isOptimized,
        optimizationPlan: v.optimizationPlan,
        createdAt: v.createdAt,
        evaluations: v.evaluations.map((e) => ({
          id: e.id,
          overallScore: Number(e.overallScore),
          intrinsicScore: Number(e.intrinsicScore),
          structuralScore: Number(e.structuralScore),
          consumptionScore: Number(e.consumptionScore),
          evaluatedAt: e.evaluatedAt,
        })),
      })),
    });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/versions - 创建新版本
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentId, content, structuredContent, isOptimized, optimizationPlan } = body;

    if (!documentId || !content) {
      return NextResponse.json(
        { error: 'Document ID and content are required' },
        { status: 400 }
      );
    }

    const version = await versionManager.createVersion({
      documentId,
      content,
      structuredContent,
      isOptimized,
      optimizationPlan,
    });

    return NextResponse.json({
      id: version.id,
      documentId: version.documentId,
      version: version.version,
      isOptimized: version.isOptimized,
      createdAt: version.createdAt,
    });
  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
