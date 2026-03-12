import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { suggestionGenerator } from '@/lib/optimization';

// GET /api/suggestions?evaluationId=xxx - 获取优化建议
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID is required' },
        { status: 400 }
      );
    }

    // 获取已有的建议
    const suggestions = await prisma.optimizationSuggestion.findMany({
      where: { evaluationId },
      orderBy: { priority: 'asc' },
    });

    if (suggestions.length > 0) {
      return NextResponse.json({
        suggestions: suggestions.map((s) => ({
          id: s.id,
          category: s.category,
          subcategory: s.subcategory,
          severity: s.severity,
          description: s.description,
          currentValue: s.currentValue,
          suggestedValue: s.suggestedValue,
          autoApplicable: s.autoApplicable,
          priority: s.priority,
          applied: s.applied,
          appliedAt: s.appliedAt,
        })),
        totalSuggestions: suggestions.length,
        criticalCount: suggestions.filter((s) => s.severity === 'critical').length,
        warningCount: suggestions.filter((s) => s.severity === 'warning').length,
        infoCount: suggestions.filter((s) => s.severity === 'info').length,
        autoApplicableCount: suggestions.filter((s) => s.autoApplicable).length,
      });
    }

    // 如果没有建议，基于评测结果生成
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: evaluation.documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 生成建议
    const result = suggestionGenerator.generateSuggestions(
      evaluation.metrics as any,
      Number(evaluation.overallScore),
      document.rawContent || ''
    );

    // 保存建议到数据库
    const savedSuggestions = await Promise.all(
      result.suggestions.map((suggestion) =>
        prisma.optimizationSuggestion.create({
          data: {
            evaluationId,
            category: suggestion.category,
            subcategory: suggestion.subcategory,
            severity: suggestion.severity,
            description: suggestion.description,
            currentValue: suggestion.currentValue,
            suggestedValue: suggestion.suggestedValue,
            autoApplicable: suggestion.autoApplicable,
            priority: suggestion.priority,
          },
        })
      )
    );

    return NextResponse.json({
      suggestions: savedSuggestions.map((s) => ({
        id: s.id,
        category: s.category,
        subcategory: s.subcategory,
        severity: s.severity,
        description: s.description,
        currentValue: s.currentValue,
        suggestedValue: s.suggestedValue,
        autoApplicable: s.autoApplicable,
        priority: s.priority,
        applied: s.applied,
        appliedAt: s.appliedAt,
      })),
      totalSuggestions: result.totalSuggestions,
      criticalCount: result.criticalCount,
      warningCount: result.warningCount,
      infoCount: result.infoCount,
      autoApplicableCount: result.autoApplicableCount,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
