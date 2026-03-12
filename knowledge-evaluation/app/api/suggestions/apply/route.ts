import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { documentRewriter } from '@/lib/optimization';

// POST /api/suggestions/apply - 应用优化建议
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentId, suggestionIds, options = {} } = body;

    if (!documentId || !suggestionIds || !Array.isArray(suggestionIds)) {
      return NextResponse.json(
        { error: 'Document ID and suggestion IDs are required' },
        { status: 400 }
      );
    }

    // 获取文档
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 获取要应用的建议
    const suggestions = await prisma.optimizationSuggestion.findMany({
      where: {
        id: { in: suggestionIds },
        autoApplicable: true,
        applied: false,
      },
    });

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: 'No applicable suggestions found' },
        { status: 400 }
      );
    }

    // 执行文档改写
    const rewriteOptions = {
      replacePronouns: options.replacePronouns !== false,
      optimizeStructure: options.optimizeStructure !== false,
      removeDuplicates: options.removeDuplicates !== false,
      enhanceContext: options.enhanceContext !== false,
      preserveLength: options.preserveLength || false,
    };

    const rewriteResult = await documentRewriter.rewrite(
      document.rawContent || '',
      rewriteOptions
    );

    // 更新建议状态
    await prisma.optimizationSuggestion.updateMany({
      where: {
        id: { in: suggestionIds },
      },
      data: {
        applied: true,
        appliedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      documentId,
      appliedSuggestions: suggestions.length,
      changes: rewriteResult.changes.map((change) => ({
        type: change.type,
        description: change.description,
      })),
      preview: rewriteResult.rewrittenContent.substring(0, 500) + '...',
    });
  } catch (error) {
    console.error('Apply suggestions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
