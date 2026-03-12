import Link from "next/link";
import { prisma } from "@/lib/db";
import { FileText, Plus, Clock, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TestSuiteWithMeta {
  id: string;
  documentId: string;
  name: string;
  description: string | null;
  version: number;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  document: {
    id: string;
    filename: string;
    fileType: string;
  };
  _count: {
    questions: number;
  };
}

async function getTestSuites(): Promise<TestSuiteWithMeta[]> {
  const testSuites = await prisma.testSuite.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    include: {
      document: {
        select: {
          id: true,
          filename: true,
          fileType: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return testSuites;
}

function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fact: "事实类",
    concept: "概念类",
    application: "应用类",
    comparison: "对比类",
    synthesis: "综合类",
  };
  return labels[type] || type;
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: "简单",
    medium: "中等",
    hard: "困难",
  };
  return labels[difficulty] || difficulty;
}

export default async function TestSuitesPage() {
  const testSuites = await getTestSuites();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">📝 评测集管理</h1>
            <p className="text-slate-600 mt-2">
              生成和管理用于知识库评测的测试问题集
            </p>
          </div>
          <Link
            href="/test-suites/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            生成评测集
          </Link>
        </div>

        {testSuites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">
              还没有评测集
            </h2>
            <p className="text-slate-500 mb-4">
              创建您的第一个评测集来测试知识库质量
            </p>
            <Link
              href="/test-suites/new"
              className="text-blue-600 hover:underline"
            >
              生成评测集 →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      评测集
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      来源文档
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      问题数量
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      生成方式
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                      创建时间
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {testSuites.map((suite) => (
                    <tr key={suite.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-slate-900">
                              {suite.name}
                            </p>
                            {suite.description && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">
                                {suite.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {suite.document.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {suite._count.questions} 个问题
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            suite.generatedBy === "auto"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {suite.generatedBy === "auto" ? "自动生成" : "手动创建"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDistanceToNow(new Date(suite.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/test-suites/${suite.id}`}
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
