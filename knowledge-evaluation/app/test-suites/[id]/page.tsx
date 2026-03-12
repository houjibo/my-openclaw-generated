import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  Edit,
  Trash2,
  Tag,
  BookOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DeleteTestSuiteButton } from "./delete-button";
import { QuestionList } from "./question-list";

interface TestSuiteDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface TestQuestion {
  id: string;
  type: string;
  question: string;
  expectedAnswer: string;
  referenceSections: unknown;
  difficulty: string | null;
  keywords: unknown;
  metadata: unknown;
  createdAt: Date;
}

interface TestSuiteWithQuestions {
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
  questions: TestQuestion[];
}

async function getTestSuite(id: string): Promise<TestSuiteWithQuestions | null> {
  const testSuite = await prisma.testSuite.findUnique({
    where: { id },
    include: {
      document: {
        select: {
          id: true,
          filename: true,
          fileType: true,
        },
      },
      questions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return testSuite as TestSuiteWithQuestions | null;
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

function getQuestionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    fact: "bg-blue-100 text-blue-800",
    concept: "bg-green-100 text-green-800",
    application: "bg-purple-100 text-purple-800",
    comparison: "bg-orange-100 text-orange-800",
    synthesis: "bg-red-100 text-red-800",
  };
  return colors[type] || "bg-slate-100 text-slate-800";
}

function getDifficultyLabel(difficulty: string | null): string {
  if (!difficulty) return "未知";
  const labels: Record<string, string> = {
    easy: "简单",
    medium: "中等",
    hard: "困难",
  };
  return labels[difficulty] || difficulty;
}

function getDifficultyColor(difficulty: string | null): string {
  if (!difficulty) return "bg-slate-100 text-slate-800";
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800",
  };
  return colors[difficulty] || "bg-slate-100 text-slate-800";
}

export default async function TestSuiteDetailPage({
  params,
}: TestSuiteDetailPageProps) {
  const { id } = await params;
  const testSuite = await getTestSuite(id);

  if (!testSuite) {
    notFound();
  }

  const questionTypes = [
    ...new Set(testSuite.questions.map((q) => q.type)),
  ];

  const typeCounts = testSuite.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link
            href="/test-suites"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回评测集列表
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {testSuite.name}
              </h1>
              {testSuite.description && (
                <p className="text-slate-600 mt-2 max-w-2xl">
                  {testSuite.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/test-suites/${testSuite.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                编辑
              </Link>
              <DeleteTestSuiteButton testSuiteId={testSuite.id} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">问题总数</p>
                <p className="text-2xl font-bold text-slate-900">
                  {testSuite.questions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">问题类型</p>
                <p className="text-2xl font-bold text-slate-900">
                  {questionTypes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">版本</p>
                <p className="text-2xl font-bold text-slate-900">
                  v{testSuite.version}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">来源文档</p>
                <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                  {testSuite.document.filename}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              问题类型分布
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div
                  key={type}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getQuestionTypeColor(
                    type
                  )}`}
                >
                  <span>{getQuestionTypeLabel(type)}</span>
                  <span className="bg-white bg-opacity-50 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">问题列表</h2>
            <span className="text-sm text-slate-500">
              共 {testSuite.questions.length} 个问题
            </span>
          </div>
          <QuestionList
            testSuiteId={testSuite.id}
            questions={testSuite.questions.map((q) => ({
              id: q.id,
              testSuiteId: testSuite.id,
              type: q.type,
              question: q.question,
              expectedAnswer: q.expectedAnswer,
              referenceSections: (q.referenceSections || []) as Array<{content: string; position: number; context?: string}>,
              difficulty: q.difficulty,
              keywords: (q.keywords || []) as string[],
              metadata: q.metadata,
              createdAt: q.createdAt,
            }))}
          />
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>
            创建时间：
            {formatDistanceToNow(new Date(testSuite.createdAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </p>
          <p className="mt-1">
            更新时间：
            {formatDistanceToNow(new Date(testSuite.updatedAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
