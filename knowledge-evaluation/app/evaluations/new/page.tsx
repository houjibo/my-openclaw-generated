"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, BarChart3, FileText, AlertCircle } from "lucide-react";

export default function NewEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!documentId) {
      setError("缺少文档 ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "评测失败");
      }

      router.push(`/evaluations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "评测失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={documentId ? `/documents/${documentId}` : "/documents"}
            className="inline-flex items-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            返回
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              开始文档评测
            </h1>
            <p className="text-slate-600">
              我们将对文档进行全面的质量评估，包括内在质量、结构语义和消费效果三个维度
            </p>
          </div>

          {!documentId ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium">未选择文档</p>
                <p className="text-yellow-700 text-sm mt-1">
                  请从文档列表中选择一个文档进行评测
                </p>
                <Link
                  href="/documents"
                  className="text-yellow-700 hover:text-yellow-800 text-sm mt-2 inline-block underline"
                >
                  查看文档列表 →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">待评测文档</p>
                    <p className="font-medium text-slate-900">
                      ID: {documentId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">内在质量评估</p>
                    <p className="text-sm text-slate-500">
                      解析成功率、信息密度、代词占比、术语一致性、可读性评分、错误率
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">结构语义评估</p>
                    <p className="text-sm text-slate-500">
                      层次结构完整度、段落连贯性、列表/表格使用、代码块标注、图表质量、引用完整性
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">消费效果评估</p>
                    <p className="text-sm text-slate-500">
                      检索友好度、上下文自包含性、问答匹配度、向量相似度、Token 效率
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleEvaluate}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    评测中...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    开始评测
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                评测过程可能需要几秒钟，请耐心等待
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
