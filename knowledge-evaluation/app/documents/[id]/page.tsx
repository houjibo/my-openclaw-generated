import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  History,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DocumentSection } from "@/types/document";

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getDocument(id: string) {
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

  return document;
}

function getFileIcon(fileType: string) {
  const iconMap: Record<string, string> = {
    docx: "📄",
    pdf: "📑",
    pptx: "📊",
    txt: "📝",
    md: "📝",
    html: "🌐",
    json: "📋",
  };
  return iconMap[fileType.toLowerCase()] || "📄";
}

function formatFileSize(bytes: bigint | null): string {
  if (!bytes) return "Unknown";
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-yellow-500" />;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "success":
      return "解析成功";
    case "failed":
      return "解析失败";
    default:
      return "解析中";
  }
}

function renderSections(sections: DocumentSection[]) {
  return sections.map((section) => {
    switch (section.type) {
      case "title":
        const level = section.level || 1;
        const sizeClass =
          level === 1
            ? "text-2xl"
            : level === 2
            ? "text-xl"
            : level === 3
            ? "text-lg"
            : "text-base";
        return (
          <h3
            key={section.id}
            className={`${sizeClass} font-semibold text-slate-900 mt-6 mb-3`}
          >
            {section.content}
          </h3>
        );
      case "list":
        return (
          <li key={section.id} className="ml-6 text-slate-700 mb-1">
            {section.content}
          </li>
        );
      case "code":
        return (
          <pre
            key={section.id}
            className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 text-sm"
          >
            <code>{section.content}</code>
          </pre>
        );
      default:
        return (
          <p key={section.id} className="text-slate-700 mb-3 leading-relaxed">
            {section.content}
          </p>
        );
    }
  });
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  const metadata = document.metadata as any;
  const structuredContent = (document.structuredContent as unknown as DocumentSection[]) || [];
  const latestEvaluation = document.evaluations[0];

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
            返回列表
          </Link>
        </div>

        {/* Document Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{getFileIcon(document.fileType)}</span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {document.filename}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    {getStatusIcon(document.parseStatus)}
                    {getStatusText(document.parseStatus)}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(document.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {document.parseStatus === "success" && (
                <>
                  <Link
                    href={`/evaluations/new?documentId=${document.id}`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    开始评估
                  </Link>
                  <Link
                    href={`/test-suites/new?documentId=${document.id}`}
                    className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    生成评测集
                  </Link>
                </>
              )}
            </div>
          </div>

          {metadata && (
            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-4 gap-4">
              {metadata.wordCount && (
                <div>
                  <p className="text-sm text-slate-500">字数</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metadata.wordCount.toLocaleString()}
                  </p>
                </div>
              )}
              {metadata.charCount && (
                <div>
                  <p className="text-sm text-slate-500">字符数</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metadata.charCount.toLocaleString()}
                  </p>
                </div>
              )}
              {metadata.pageCount && (
                <div>
                  <p className="text-sm text-slate-500">页数</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metadata.pageCount}
                  </p>
                </div>
              )}
              {metadata.language && (
                <div>
                  <p className="text-sm text-slate-500">语言</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metadata.language === "zh" ? "中文" : "英文"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evaluation Score */}
        {latestEvaluation && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              最新评估结果
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">综合评分</p>
                <p className="text-3xl font-bold text-blue-700">
                  {Number(latestEvaluation.overallScore).toFixed(1)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">内在质量</p>
                <p className="text-2xl font-bold text-green-700">
                  {Number(latestEvaluation.intrinsicScore).toFixed(1)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">结构语义</p>
                <p className="text-2xl font-bold text-purple-700">
                  {Number(latestEvaluation.structuralScore).toFixed(1)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600">消费效果</p>
                <p className="text-2xl font-bold text-orange-700">
                  {Number(latestEvaluation.consumptionScore).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Preview */}
        {document.parseStatus === "success" && structuredContent && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              内容预览
            </h2>
            <div className="prose prose-slate max-w-none">
              {renderSections(structuredContent.slice(0, 50))}
              {structuredContent.length > 50 && (
                <p className="text-slate-500 text-center py-4">
                  ... 还有 {structuredContent.length - 50} 个片段 ...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Parse Error */}
        {document.parseStatus === "failed" && document.parseError && (
          <div className="bg-red-50 rounded-lg border border-red-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              解析错误
            </h2>
            <p className="text-red-700">{document.parseError}</p>
          </div>
        )}

        {/* Versions */}
        {document.versions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              版本历史
            </h2>
            <div className="space-y-3">
              {document.versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      版本 {version.version}
                    </span>
                    {version.isOptimized && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        已优化
                      </span>
                    )}
                    {version.version === 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        原始版本
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(version.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
