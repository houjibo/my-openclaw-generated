import { prisma } from '@/lib/db';
import { EvaluationMetrics, IntrinsicMetrics, StructuralMetrics, ConsumptionMetrics } from '@/lib/evaluators/types';

export interface VersionCreateInput {
  documentId: string;
  content: string;
  structuredContent?: any;
  isOptimized?: boolean;
  optimizationPlan?: any;
}

export interface VersionComparisonResult {
  sourceVersionId: string;
  targetVersionId: string;
  sourceVersion: number;
  targetVersion: number;
  intrinsicDiff: MetricDiff;
  structuralDiff: MetricDiff;
  consumptionDiff: MetricDiff;
  overallScoreDiff: number;
  improvements: string[];
  regressions: string[];
  unchanged: string[];
}

export interface MetricDiff {
  scoreDiff: number;
  percentageChange: number;
  details: Record<string, { before: number; after: number; diff: number }>;
}

export class VersionManager {
  async createVersion(input: VersionCreateInput) {
    const { documentId, content, structuredContent, isOptimized, optimizationPlan } = input;

    // 获取当前最新版本号
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // 创建新版本
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        version: nextVersion,
        content,
        structuredContent: structuredContent || {},
        isOptimized: isOptimized || false,
        optimizationPlan: optimizationPlan || {},
      },
    });

    // 更新文档的当前内容
    await prisma.document.update({
      where: { id: documentId },
      data: {
        rawContent: content,
        structuredContent: structuredContent || {},
        updatedAt: new Date(),
      },
    });

    return version;
  }

  async getVersions(documentId: string) {
    return await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
      include: {
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
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
  }

  async getVersionById(versionId: string) {
    return await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
            fileType: true,
          },
        },
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async rollbackToVersion(documentId: string, versionId: string) {
    const targetVersion = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!targetVersion || targetVersion.documentId !== documentId) {
      throw new Error('Version not found or does not belong to this document');
    }

    // 创建回滚版本
    const rollbackVersion = await this.createVersion({
      documentId,
      content: targetVersion.content,
      structuredContent: targetVersion.structuredContent,
      isOptimized: false,
      optimizationPlan: {
        type: 'rollback',
        sourceVersionId: versionId,
        sourceVersion: targetVersion.version,
      },
    });

    return rollbackVersion;
  }

  async compareVersions(
    sourceVersionId: string,
    targetVersionId: string
  ): Promise<VersionComparisonResult> {
    const [sourceVersion, targetVersion] = await Promise.all([
      prisma.documentVersion.findUnique({
        where: { id: sourceVersionId },
        include: {
          evaluations: {
            orderBy: { evaluatedAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.documentVersion.findUnique({
        where: { id: targetVersionId },
        include: {
          evaluations: {
            orderBy: { evaluatedAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    if (!sourceVersion || !targetVersion) {
      throw new Error('One or both versions not found');
    }

    const sourceMetrics = sourceVersion.evaluations[0]?.metrics as unknown as EvaluationMetrics | undefined;
    const targetMetrics = targetVersion.evaluations[0]?.metrics as unknown as EvaluationMetrics | undefined;

    const sourceOverallScore = Number(sourceVersion.evaluations[0]?.overallScore || 0);
    const targetOverallScore = Number(targetVersion.evaluations[0]?.overallScore || 0);

    const result: VersionComparisonResult = {
      sourceVersionId,
      targetVersionId,
      sourceVersion: sourceVersion.version,
      targetVersion: targetVersion.version,
      intrinsicDiff: this.calculateMetricDiff(
        this.metricsToRecord(sourceMetrics?.intrinsic),
        this.metricsToRecord(targetMetrics?.intrinsic),
        sourceOverallScore,
        targetOverallScore
      ),
      structuralDiff: this.calculateMetricDiff(
        this.metricsToRecord(sourceMetrics?.structural),
        this.metricsToRecord(targetMetrics?.structural),
        sourceOverallScore,
        targetOverallScore
      ),
      consumptionDiff: this.calculateMetricDiff(
        this.metricsToRecord(sourceMetrics?.consumption),
        this.metricsToRecord(targetMetrics?.consumption),
        sourceOverallScore,
        targetOverallScore
      ),
      overallScoreDiff: targetOverallScore - sourceOverallScore,
      improvements: [],
      regressions: [],
      unchanged: [],
    };

    // 分析改进和退化
    if (sourceMetrics && targetMetrics) {
      this.analyzeChanges(sourceMetrics, targetMetrics, result);
    }

    return result;
  }

  private metricsToRecord(metrics: IntrinsicMetrics | StructuralMetrics | ConsumptionMetrics | undefined): Record<string, number> | undefined {
    if (!metrics) return undefined;
    return metrics as unknown as Record<string, number>;
  }

  private calculateMetricDiff(
    before: Record<string, number> | undefined,
    after: Record<string, number> | undefined,
    beforeOverall: number,
    afterOverall: number
  ): MetricDiff {
    const scoreDiff = afterOverall - beforeOverall;
    const percentageChange = beforeOverall > 0 ? (scoreDiff / beforeOverall) * 100 : 0;

    const details: Record<string, { before: number; after: number; diff: number }> = {};

    if (before && after) {
      for (const key of Object.keys(before)) {
        if (key in after) {
          const beforeValue = before[key];
          const afterValue = after[key];
          details[key] = {
            before: beforeValue,
            after: afterValue,
            diff: afterValue - beforeValue,
          };
        }
      }
    }

    return {
      scoreDiff,
      percentageChange,
      details,
    };
  }

  private analyzeChanges(
    before: EvaluationMetrics,
    after: EvaluationMetrics,
    result: VersionComparisonResult
  ) {
    const threshold = 5; // 变化阈值

    // 分析内在质量指标
    const beforeIntrinsic = this.metricsToRecord(before.intrinsic) || {};
    const afterIntrinsic = this.metricsToRecord(after.intrinsic) || {};
    for (const [key, beforeValue] of Object.entries(beforeIntrinsic)) {
      const afterValue = afterIntrinsic[key];
      if (afterValue === undefined) continue;
      const diff = afterValue - beforeValue;

      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          result.improvements.push(`内在质量 - ${key}: ${beforeValue.toFixed(1)} → ${afterValue.toFixed(1)} (+${diff.toFixed(1)})`);
        } else {
          result.regressions.push(`内在质量 - ${key}: ${beforeValue.toFixed(1)} → ${afterValue.toFixed(1)} (${diff.toFixed(1)})`);
        }
      } else {
        result.unchanged.push(`内在质量 - ${key}`);
      }
    }

    // 分析结构语义指标
    const beforeStructural = this.metricsToRecord(before.structural) || {};
    const afterStructural = this.metricsToRecord(after.structural) || {};
    for (const [key, beforeValue] of Object.entries(beforeStructural)) {
      const afterValue = afterStructural[key];
      if (afterValue === undefined) continue;
      const diff = afterValue - beforeValue;

      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          result.improvements.push(`结构语义 - ${key}: ${beforeValue.toFixed(1)} → ${afterValue.toFixed(1)} (+${diff.toFixed(1)})`);
        } else {
          result.regressions.push(`结构语义 - ${key}: ${beforeValue.toFixed(1)} → ${afterValue.toFixed(1)} (${diff.toFixed(1)})`);
        }
      } else {
        result.unchanged.push(`结构语义 - ${key}`);
      }
    }

    // 分析消费效果指标
    const beforeConsumption = this.metricsToRecord(before.consumption) || {};
    const afterConsumption = this.metricsToRecord(after.consumption) || {};
    for (const [key, beforeValue] of Object.entries(beforeConsumption)) {
      const afterValue = afterConsumption[key];
      if (afterValue === undefined) continue;
      const diff = afterValue - beforeValue;

      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          result.improvements.push(`消费效果 - ${key}: ${beforeValue.toFixed(1)} → ${afterValue.toFixed(1)} (+${diff.toFixed(1)})`);
        } else {
          result.regressions.push(`消费效果 - ${key}: ${beforeValue.toFixed(1)} → ${afterValue.toFixed(1)} (${diff.toFixed(1)})`);
        }
      } else {
        result.unchanged.push(`消费效果 - ${key}`);
      }
    }
  }
}

export const versionManager = new VersionManager();
