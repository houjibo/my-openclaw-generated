import { prisma } from '@/lib/db';

export interface EvaluationComparisonInput {
  baseEvaluationRunId: string;
  comparisonEvaluationRunId: string;
}

export interface MetricComparison {
  metric: string;
  baseValue: number;
  comparisonValue: number;
  diff: number;
  percentageChange: number;
  trend: 'improved' | 'degraded' | 'unchanged';
}

export interface EvaluationComparisonResult {
  baseEvaluationRunId: string;
  comparisonEvaluationRunId: string;
  documentId: string;
  baseVersion: number;
  comparisonVersion: number;
  comparisons: MetricComparison[];
  summary: {
    improved: number;
    degraded: number;
    unchanged: number;
    overallTrend: 'improved' | 'degraded' | 'unchanged';
  };
  questionLevelComparison: QuestionComparison[];
}

export interface QuestionComparison {
  questionId: string;
  question: string;
  baseResult: {
    retrieved: boolean;
    relevanceScore: number;
    passed: boolean;
  } | null;
  comparisonResult: {
    retrieved: boolean;
    relevanceScore: number;
    passed: boolean;
  } | null;
  change: 'improved' | 'degraded' | 'unchanged' | 'new' | 'removed';
}

export class EvaluationComparer {
  async compareEvaluations(
    input: EvaluationComparisonInput
  ): Promise<EvaluationComparisonResult> {
    const { baseEvaluationRunId, comparisonEvaluationRunId } = input;

    // 获取两个评测运行结果
    const [baseRun, comparisonRun] = await Promise.all([
      this.getEvaluationRunWithDetails(baseEvaluationRunId),
      this.getEvaluationRunWithDetails(comparisonEvaluationRunId),
    ]);

    if (!baseRun || !comparisonRun) {
      throw new Error('One or both evaluation runs not found');
    }

    if (baseRun.testSuiteId !== comparisonRun.testSuiteId) {
      throw new Error('Cannot compare evaluations from different test suites');
    }

    // 计算指标对比
    const comparisons = this.calculateComparisons(baseRun, comparisonRun);

    // 计算问题级别的对比
    const questionComparisons = this.compareQuestions(baseRun, comparisonRun);

    // 计算汇总
    const summary = this.calculateSummary(comparisons);

    const result: EvaluationComparisonResult = {
      baseEvaluationRunId,
      comparisonEvaluationRunId,
      documentId: baseRun.vectorizedDocument.documentId,
      baseVersion: baseRun.vectorizedDocument.documentVersion?.version || 0,
      comparisonVersion: comparisonRun.vectorizedDocument.documentVersion?.version || 0,
      comparisons,
      summary,
      questionLevelComparison: questionComparisons,
    };

    // 保存对比结果
    await prisma.$executeRaw`
      INSERT INTO "EvaluationComparison" (
        id, "documentId", "baseEvaluationRunId", "comparisonEvaluationRunId",
        "accuracyDiff", "recallDiff", "f1ScoreDiff", "passRateDiff",
        "detailedMetrics", "comparedAt"
      ) VALUES (
        ${crypto.randomUUID()},
        ${result.documentId},
        ${baseEvaluationRunId},
        ${comparisonEvaluationRunId},
        ${comparisons.find(c => c.metric === 'accuracy')?.diff || 0},
        ${comparisons.find(c => c.metric === 'recall')?.diff || 0},
        ${comparisons.find(c => c.metric === 'f1Score')?.diff || 0},
        ${comparisons.find(c => c.metric === 'passRate')?.diff || 0},
        ${comparisons as any},
        ${new Date()}
      )
    `;

    return result;
  }

  private async getEvaluationRunWithDetails(evaluationRunId: string) {
    return await prisma.evaluationRun.findUnique({
      where: { id: evaluationRunId },
      include: {
        testResults: {
          include: {
            question: true,
          },
        },
        vectorizedDocument: {
          include: {
            document: true,
            documentVersion: {
              select: {
                version: true,
              },
            },
          },
        },
      },
    });
  }

  private calculateComparisons(
    baseRun: any,
    comparisonRun: any
  ): MetricComparison[] {
    const baseMetrics = baseRun.metrics as any || {};
    const comparisonMetrics = comparisonRun.metrics as any || {};

    const metrics = [
      { key: 'passRate', base: Number(baseRun.passRate), comparison: Number(comparisonRun.passRate) },
      { key: 'avgRelevanceScore', base: Number(baseRun.avgRelevanceScore), comparison: Number(comparisonRun.avgRelevanceScore) },
      { key: 'accuracy', base: baseMetrics.accuracy || 0, comparison: comparisonMetrics.accuracy || 0 },
      { key: 'recall', base: baseMetrics.recall || 0, comparison: comparisonMetrics.recall || 0 },
      { key: 'f1Score', base: baseMetrics.f1Score || 0, comparison: comparisonMetrics.f1Score || 0 },
    ];

    return metrics.map(({ key, base, comparison }) => {
      const diff = comparison - base;
      const percentageChange = base !== 0 ? (diff / base) * 100 : 0;
      const threshold = 0.01; // 1% threshold for significant change

      let trend: 'improved' | 'degraded' | 'unchanged';
      if (Math.abs(diff) < threshold) {
        trend = 'unchanged';
      } else if (diff > 0) {
        trend = 'improved';
      } else {
        trend = 'degraded';
      }

      return {
        metric: key,
        baseValue: base,
        comparisonValue: comparison,
        diff,
        percentageChange,
        trend,
      };
    });
  }

  private compareQuestions(baseRun: any, comparisonRun: any): QuestionComparison[] {
    const baseResults = new Map<string, { retrieved: boolean; relevanceScore: number; passed: boolean }>(
      baseRun.testResults.map((r: any) => [
        r.questionId,
        {
          retrieved: r.retrieved as boolean,
          relevanceScore: Number(r.relevanceScore),
          passed: r.passed as boolean,
        },
      ])
    );

    const comparisonResults = new Map<string, { retrieved: boolean; relevanceScore: number; passed: boolean }>(
      comparisonRun.testResults.map((r: any) => [
        r.questionId,
        {
          retrieved: r.retrieved as boolean,
          relevanceScore: Number(r.relevanceScore),
          passed: r.passed as boolean,
        },
      ])
    );

    const allQuestionIds = new Set([
      ...baseResults.keys(),
      ...comparisonResults.keys(),
    ]);

    const comparisons: QuestionComparison[] = [];

    for (const questionId of allQuestionIds) {
      const baseResult = baseResults.get(questionId);
      const comparisonResult = comparisonResults.get(questionId);
      const question =
        (baseRun.testResults.find((r: any) => r.questionId === questionId) as { question: { question: string } } | undefined)?.question ||
        (comparisonRun.testResults.find((r: any) => r.questionId === questionId) as { question: { question: string } } | undefined)?.question;

      let change: 'improved' | 'degraded' | 'unchanged' | 'new' | 'removed';

      if (!baseResult) {
        change = 'new';
      } else if (!comparisonResult) {
        change = 'removed';
      } else if (comparisonResult.passed && !baseResult.passed) {
        change = 'improved';
      } else if (!comparisonResult.passed && baseResult.passed) {
        change = 'degraded';
      } else if (comparisonResult.relevanceScore > baseResult.relevanceScore + 0.05) {
        change = 'improved';
      } else if (comparisonResult.relevanceScore < baseResult.relevanceScore - 0.05) {
        change = 'degraded';
      } else {
        change = 'unchanged';
      }

      comparisons.push({
        questionId,
        question: question?.question || 'Unknown',
        baseResult: baseResult || null,
        comparisonResult: comparisonResult || null,
        change,
      });
    }

    return comparisons;
  }

  private calculateSummary(comparisons: MetricComparison[]) {
    const improved = comparisons.filter((c) => c.trend === 'improved').length;
    const degraded = comparisons.filter((c) => c.trend === 'degraded').length;
    const unchanged = comparisons.filter((c) => c.trend === 'unchanged').length;

    let overallTrend: 'improved' | 'degraded' | 'unchanged';
    if (improved > degraded) {
      overallTrend = 'improved';
    } else if (degraded > improved) {
      overallTrend = 'degraded';
    } else {
      overallTrend = 'unchanged';
    }

    return {
      improved,
      degraded,
      unchanged,
      overallTrend,
    };
  }

  generateComparisonReport(result: EvaluationComparisonResult): string {
    const lines: string[] = [];

    lines.push('# 评测结果对比报告');
    lines.push('');
    lines.push(`## 基本信息`);
    lines.push(`- 基准版本: v${result.baseVersion}`);
    lines.push(`- 对比版本: v${result.comparisonVersion}`);
    lines.push(`- 整体趋势: ${this.translateTrend(result.summary.overallTrend)}`);
    lines.push('');

    lines.push(`## 指标对比`);
    lines.push('');
    lines.push('| 指标 | 基准值 | 对比值 | 变化 | 变化率 | 趋势 |');
    lines.push('|------|--------|--------|------|--------|------|');

    for (const comparison of result.comparisons) {
      lines.push(
        `| ${this.translateMetric(comparison.metric)} | ${comparison.baseValue.toFixed(4)} | ${comparison.comparisonValue.toFixed(4)} | ${comparison.diff >= 0 ? '+' : ''}${comparison.diff.toFixed(4)} | ${comparison.percentageChange >= 0 ? '+' : ''}${comparison.percentageChange.toFixed(2)}% | ${this.translateTrend(comparison.trend)} |`
      );
    }

    lines.push('');
    lines.push(`## 汇总`);
    lines.push(`- 改进: ${result.summary.improved} 项`);
    lines.push(`- 退化: ${result.summary.degraded} 项`);
    lines.push(`- 未变化: ${result.summary.unchanged} 项`);
    lines.push('');

    lines.push(`## 问题级别对比`);
    lines.push('');
    lines.push('| 问题 | 基准结果 | 对比结果 | 变化 |');
    lines.push('|------|----------|----------|------|');

    for (const qc of result.questionLevelComparison.slice(0, 20)) {
      const baseStatus = qc.baseResult 
        ? (qc.baseResult.passed ? '✅' : '❌') 
        : '-';
      const comparisonStatus = qc.comparisonResult 
        ? (qc.comparisonResult.passed ? '✅' : '❌') 
        : '-';
      
      lines.push(
        `| ${qc.question.substring(0, 50)}${qc.question.length > 50 ? '...' : ''} | ${baseStatus} | ${comparisonStatus} | ${this.translateChange(qc.change)} |`
      );
    }

    if (result.questionLevelComparison.length > 20) {
      lines.push(`| ... 还有 ${result.questionLevelComparison.length - 20} 个问题 ... | | | |`);
    }

    return lines.join('\n');
  }

  private translateMetric(metric: string): string {
    const translations: Record<string, string> = {
      passRate: '通过率',
      avgRelevanceScore: '平均相关度',
      accuracy: '准确率',
      recall: '召回率',
      f1Score: 'F1分数',
    };
    return translations[metric] || metric;
  }

  private translateTrend(trend: string): string {
    const translations: Record<string, string> = {
      improved: '改进 ↗️',
      degraded: '退化 ↘️',
      unchanged: '未变化 ➡️',
    };
    return translations[trend] || trend;
  }

  private translateChange(change: string): string {
    const translations: Record<string, string> = {
      improved: '改进 ↗️',
      degraded: '退化 ↘️',
      unchanged: '未变化 ➡️',
      new: '新增 🆕',
      removed: '移除 🗑️',
    };
    return translations[change] || change;
  }
}

export const evaluationComparer = new EvaluationComparer();
