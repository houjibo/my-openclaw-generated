import Link from "next/link";
import { prisma } from "@/lib/db";
import { FileText, Upload, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface DocumentWithMeta {
  id: string;
  filename: string;
  fileType: string;
  fileSize: bigint | null;
  parseStatus: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

async function getDocuments(): Promise<DocumentWithMeta[]> {
  const documents = await prisma.document.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      filename: true,
      fileType: true,
      fileSize: true,
      parseStatus: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return documents;
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

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">📚 文档管理</h1>
            <p className="text-slate-600 mt-2">
              上传、解析和管理您的知识文档
            </p>
          </div>
          <Link
            href="/documents/upload"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            上传文档
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">
              还没有文档
            </h2>
            <p className="text-slate-500 mb-4">
              上传您的第一个文档开始知识评价
            </p>
            <Link
              href="/documents/upload"
              className="text-blue-600 hover:underline"
            >
              上传文档 →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      文档
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      类型
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      大小
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      状态
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      上传时间
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getFileIcon(doc.fileType)}
                          </span>
                          <div>
                            <p className="font-medium text-slate-900">
                              {doc.filename}
                            </p>
                            {doc.metadata?.wordCount && (
                              <p className="text-sm text-slate-500">
                                {doc.metadata.wordCount} 字
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 uppercase">
                          {doc.fileType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.parseStatus)}
                          <span className="text-sm text-slate-600">
                            {getStatusText(doc.parseStatus)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDistanceToNow(new Date(doc.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
