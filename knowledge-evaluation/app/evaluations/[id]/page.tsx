import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { EvaluationMetrics } from "@/lib/evaluators";

interface EvaluationDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getEvaluation(id: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      document: {
        select: {
          id: true,
          filename: true,
          fileType: true,
          metadata: true,
        },
      },
    },
  });

  return evaluation;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-50";
  if (score >= 60) return "bg-yellow-50";
  return "bg-red-50";
}

function getScoreIcon(score: number) {
  if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
}

function MetricCard({
  title,
  score,
  description,
}: {
  title: string;
  score: number;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {getScoreIcon(score)}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              score >= 80
                ? "bg-green-500"
                : score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className={`text-lg font-bold ${getScoreColor(score)} w-12`}>
          {score.toFixed(0)}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-2">{description}</p>
    </div>
  );
}

export default async function EvaluationDetailPage({
  params,
}: EvaluationDetailPageProps) {
  const { id } = await params;
  const evaluation = await getEvaluation(id);

  if (!evaluation) {
    notFound();
  }

  const metrics = (evaluation.metrics || {}) as unknown as EvaluationMetrics;
  const intrinsic = metrics.intrinsic || {};
  const structural = metrics.structural || {};
  const consumption = metrics.consumption || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/evaluations"
            className="inline-flex items-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            返回评测列表
          </Link>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">
                  {evaluation.document.filename}
                </h1>
              </div>
              <p className="text-slate-500">
                评测于{" "}
                {formatDistanceToNow(new Date(evaluation.evaluatedAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
                {evaluation.evaluationTimeMs && (
                  <>
                    {" "}
                    • 耗时 {evaluation.evaluationTimeMs}ms
                  </>
                )}
              </p>
            </div>

            <div
              className={`text-center px-6 py-4 rounded-lg ${getScoreBgColor(
                Number(evaluation.overallScore)
              )}`}
            >
              <p className="text-sm text-slate-500 mb-1">综合评分</p>
              <p
                className={`text-4xl font-bold ${getScoreColor(
                  Number(evaluation.overallScore)
                )}`}
              >
                {Number(evaluation.overallScore).toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">内在质量</p>
              <p
                className={`text-2xl font-bold ${getScoreColor(
                  Number(evaluation.intrinsicScore)
                )}`}
              >
                {Number(evaluation.intrinsicScore).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">结构语义</p>
              <p
                className={`text-2xl font-bold ${getScoreColor(
                  Number(evaluation.structuralScore)
                )}`}
              >
                {Number(evaluation.structuralScore).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">消费效果</p>
              <p
                className={`text-2xl font-bold ${getScoreColor(
                  Number(evaluation.consumptionScore)
                )}`}
              >
                {Number(evaluation.consumptionScore).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Intrinsic Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            内在质量指标
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="解析成功率"
              score={intrinsic.parseSuccessRate || 0}
              description="文档解析的成功程度，100%表示完全成功"
            />
            <MetricCard
              title="信息密度"
              score={intrinsic.informationDensity || 0}
              description="每字符的有效信息含量"
            />
            <MetricCard
              title="代词占比"
              score={intrinsic.pronounRatio || 0}
              description="代词在总词汇中的比例，越低越好"
            />
            <MetricCard
              title="术语一致性"
              score={intrinsic.terminologyConsistency || 0}
              description="同一概念使用相同术语的程度"
            />
            <MetricCard
              title="可读性评分"
              score={intrinsic.readabilityScore || 0}
              description="基于句子长度和词汇难度的综合评分"
            />
            <MetricCard
              title="错误率"
              score={intrinsic.errorRate || 0}
              description="拼写和语法错误的比例，越高越好"
            />
          </div>
        </div>

        {/* Structural Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            结构语义指标
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="层次结构完整度"
              score={structural.hierarchyCompleteness || 0}
              description="文档标题层次结构的完整性"
            />
            <MetricCard
              title="段落连贯性"
              score={structural.paragraphCoherence || 0}
              description="段落间的逻辑连贯程度"
            />
            <MetricCard
              title="列表/表格使用"
              score={structural.listTableUsage || 0}
              description="结构化元素的使用情况"
            />
            <MetricCard
              title="代码块标注"
              score={structural.codeBlockAnnotation || 0}
              description="代码块的语言标注完整度"
            />
            <MetricCard
              title="图表质量"
              score={structural.figureQuality || 0}
              description="图表的清晰度和标注完整性"
            />
            <MetricCard
              title="引用完整性"
              score={structural.referenceIntegrity || 0}
              description="引用的完整性和可追踪性"
            />
          </div>
        </div>

        {/* Consumption Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            消费效果指标
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="检索友好度"
              score={consumption.retrievalFriendliness || 0}
              description="文档内容对检索系统的友好程度"
            />
            <MetricCard
              title="上下文自包含性"
              score={consumption.contextSelfContainment || 0}
              description="段落或片段的上下文完整性"
            />
            <MetricCard
              title="问答匹配度"
              score={consumption.qaMatchingScore || 0}
              description="文档内容与问答任务的匹配程度"
            />
            <MetricCard
              title="向量相似度分布"
              score={consumption.vectorSimilarityDistribution || 0}
              description="文档分块间向量相似度的分布情况"
            />
            <MetricCard
              title="Token 效率"
              score={consumption.tokenEfficiency || 0}
              description="每 Token 传递的有效信息量"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
