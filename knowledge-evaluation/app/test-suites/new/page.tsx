"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  fileType: string;
  parseStatus: string;
}

interface TestSuiteFormData {
  documentId: string;
  name: string;
  description: string;
  questionTypes: string[];
  questionCount: number;
  difficulty: string;
}

const QUESTION_TYPES = [
  { id: "fact", label: "事实类", description: "基于具体事实、数据、定义" },
  { id: "concept", label: "概念类", description: "概念、原理、理论解释" },
  { id: "application", label: "应用类", description: "知识应用到具体场景" },
  { id: "comparison", label: "对比类", description: "比较概念、方法异同" },
  { id: "synthesis", label: "综合类", description: "整合多个知识点分析" },
];

async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch("/api/documents?status=success");
  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  const data = await response.json();
  return data.documents;
}

export default function NewTestSuitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [formData, setFormData] = useState<TestSuiteFormData>({
    documentId: "",
    name: "",
    description: "",
    questionTypes: ["fact", "concept", "application"],
    questionCount: 15,
    difficulty: "mixed",
  });

  // 加载文档列表
  useState(() => {
    fetchDocuments()
      .then((docs) => {
        setDocuments(docs);
        if (docs.length > 0 && !formData.documentId) {
          setFormData((prev) => ({ ...prev, documentId: docs[0].id }));
        }
      })
      .catch((error) => {
        toast.error("加载文档列表失败");
        console.error(error);
      })
      .finally(() => {
        setDocumentsLoading(false);
      });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.documentId) {
      toast.error("请选择来源文档");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("请输入评测集名称");
      return;
    }

    if (formData.questionTypes.length === 0) {
      toast.error("请至少选择一种问题类型");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/test-suites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "生成评测集失败");
      }

      const result = await response.json();
      toast.success(`成功生成 ${result.questions.length} 个问题`);
      router.push(`/test-suites/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成评测集失败");
      setLoading(false);
    }
  };

  const toggleQuestionType = (typeId: string) => {
    setFormData((prev) => {
      const types = prev.questionTypes.includes(typeId)
        ? prev.questionTypes.filter((t) => t !== typeId)
        : [...prev.questionTypes, typeId];
      return { ...prev, questionTypes: types };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link
            href="/test-suites"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回评测集列表
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">生成评测集</h1>
          <p className="text-slate-600 mt-2">
            使用 AI 根据文档内容自动生成评测问题
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              基本信息
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  来源文档 *
                </label>
                <select
                  value={formData.documentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">选择文档</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename}
                    </option>
                  ))}
                </select>
                {documents.length === 0 && !documentsLoading && (
                  <p className="text-sm text-red-600 mt-1">
                    没有可用的文档，请先
                    <Link href="/documents/upload" className="underline">
                      上传文档
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  评测集名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="例如：产品知识评测集"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="评测集的描述信息（可选）"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              问题配置
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  问题类型 *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleQuestionType(type.id)}
                      className={`flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${
                        formData.questionTypes.includes(type.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          formData.questionTypes.includes(type.id)
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-300"
                        }`}
                      >
                        {formData.questionTypes.includes(type.id) && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{type.label}</p>
                        <p className="text-sm text-slate-500">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    问题数量
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={formData.questionCount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        questionCount: parseInt(e.target.value) || 15,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    建议 10-30 个问题
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    难度级别
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                    <option value="mixed">混合</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/test-suites"
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || documents.length === 0}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5" />
                  生成评测集
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
