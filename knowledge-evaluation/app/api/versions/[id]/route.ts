import { NextResponse } from 'next/server';
import { versionManager } from '@/lib/optimization';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/versions/[id]/compare - 对比版本
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: sourceVersionId } = await params;
    const body = await request.json();
    const { targetVersionId } = body;

    if (!targetVersionId) {
      return NextResponse.json(
        { error: 'Target version ID is required' },
        { status: 400 }
      );
    }

    const comparison = await versionManager.compareVersions(
      sourceVersionId,
      targetVersionId
    );

    return NextResponse.json({
      sourceVersionId: comparison.sourceVersionId,
      targetVersionId: comparison.targetVersionId,
      sourceVersion: comparison.sourceVersion,
      targetVersion: comparison.targetVersion,
      intrinsicDiff: comparison.intrinsicDiff,
      structuralDiff: comparison.structuralDiff,
      consumptionDiff: comparison.consumptionDiff,
      overallScoreDiff: comparison.overallScoreDiff,
      improvements: comparison.improvements,
      regressions: comparison.regressions,
      unchanged: comparison.unchanged,
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/versions/[id]/rollback - 回滚到版本
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id: versionId } = await params;
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const rollbackVersion = await versionManager.rollbackToVersion(
      documentId,
      versionId
    );

    return NextResponse.json({
      id: rollbackVersion.id,
      documentId: rollbackVersion.documentId,
      version: rollbackVersion.version,
      message: `Successfully rolled back to version ${rollbackVersion.version}`,
    });
  } catch (error) {
    console.error('Rollback version error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/versions/[id] - 获取版本详情
export async function GET(request: Request, { params }: Params) {
  try {
    const { id: versionId } = await params;

    const version = await versionManager.getVersionById(versionId);

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: version.id,
      documentId: version.documentId,
      version: version.version,
      content: version.content,
      structuredContent: version.structuredContent,
      isOptimized: version.isOptimized,
      optimizationPlan: version.optimizationPlan,
      createdAt: version.createdAt,
      document: version.document,
      evaluations: version.evaluations,
    });
  } catch (error) {
    console.error('Get version error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
