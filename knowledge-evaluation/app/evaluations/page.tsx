import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft, BarChart3, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface EvaluationWithDocument {
  id: string;
  documentId: string;
  overallScore: number;
  intrinsicScore: number;
  structuralScore: number;
  consumptionScore: number;
  evaluationTimeMs: number | null;
  evaluatedAt: Date;
  document: {
    id: string;
    filename: string;
    fileType: string;
  };
}

async function getEvaluations(): Promise<EvaluationWithDocument[]> {
  const evaluations = await prisma.evaluation.findMany({
    orderBy: { evaluatedAt: "desc" },
    take: 50,
    include: {
      document: {
        select: {
          id: true,
          filename: true,
          fileType: true,
        },
      },
    },
  });

  return evaluations.map((e) => ({
    ...e,
    overallScore: Number(e.overallScore),
    intrinsicScore: Number(e.intrinsicScore),
    structuralScore: Number(e.structuralScore),
    consumptionScore: Number(e.consumptionScore),
  }));
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

export default async function EvaluationsPage() {
  const evaluations = await getEvaluations();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/documents"
            className="inline-flex items-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            返回文档
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              评测记录
            </h1>
            <p className="text-slate-600 mt-2">
              查看所有文档的质量评测结果
            </p>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">
              还没有评测记录
            </h2>
            <p className="text-slate-500 mb-4">
              在文档详情页开始第一个评测
            </p>
            <Link
              href="/documents"
              className="text-blue-600 hover:underline"
            >
              查看文档列表 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Link
                key={evaluation.id}
                href={`/evaluations/${evaluation.id}`}
                className="block bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {evaluation.document.filename}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {evaluation.document.fileType.toUpperCase()} • 评测于{" "}
                        {formatDistanceToNow(new Date(evaluation.evaluatedAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                      {evaluation.evaluationTimeMs && (
                        <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          耗时 {evaluation.evaluationTimeMs}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`text-center px-4 py-2 rounded-lg ${getScoreBgColor(
                        evaluation.overallScore
                      )}`}
                    >
                      <p className="text-xs text-slate-500">综合评分</p>
                      <p
                        className={`text-2xl font-bold ${getScoreColor(
                          evaluation.overallScore
                        )}`}
                      >
                        {evaluation.overallScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">内在质量</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${evaluation.intrinsicScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-10">
                        {evaluation.intrinsicScore.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">结构语义</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${evaluation.structuralScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-10">
                        {evaluation.structuralScore.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">消费效果</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${evaluation.consumptionScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-10">
                        {evaluation.consumptionScore.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
