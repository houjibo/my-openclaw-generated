"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Tag,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  testSuiteId: string;
  type: string;
  question: string;
  expectedAnswer: string;
  referenceSections: Array<{
    content: string;
    position: number;
    context?: string;
  }>;
  difficulty: string | null;
  keywords: string[];
  metadata?: unknown;
  createdAt: Date;
}

interface QuestionListProps {
  testSuiteId: string;
  questions: Question[];
}

const QUESTION_TYPES = [
  { id: "fact", label: "事实类" },
  { id: "concept", label: "概念类" },
  { id: "application", label: "应用类" },
  { id: "comparison", label: "对比类" },
  { id: "synthesis", label: "综合类" },
];

function getQuestionTypeLabel(type: string): string {
  const found = QUESTION_TYPES.find((t) => t.id === type);
  return found?.label || type;
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

function QuestionItem({
  question,
  onUpdate,
  onDelete,
}: {
  question: Question;
  onUpdate: (updated: Question) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(question);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/test-suites/${question.testSuiteId}/questions/${question.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: editData.type,
            question: editData.question,
            expectedAnswer: editData.expectedAnswer,
            difficulty: editData.difficulty,
            keywords: editData.keywords,
          }),
        }
      );

      if (!response.ok) throw new Error("保存失败");

      const updated = await response.json();
      onUpdate({ ...question, ...updated });
      setEditing(false);
      toast.success("问题已更新");
    } catch (error) {
      toast.error("保存失败");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个问题吗？")) return;

    try {
      const response = await fetch(
        `/api/test-suites/${question.testSuiteId}/questions/${question.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("删除失败");

      onDelete();
      toast.success("问题已删除");
    } catch (error) {
      toast.error("删除失败");
      console.error(error);
    }
  };

  if (editing) {
    return (
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              问题类型
            </label>
            <select
              value={editData.type}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              难度
            </label>
            <select
              value={editData.difficulty || "medium"}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  difficulty: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              问题
            </label>
            <textarea
              value={editData.question}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, question: e.target.value }))
              }
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              预期答案
            </label>
            <textarea
              value={editData.expectedAnswer}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  expectedAnswer: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditData(question);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getQuestionTypeColor(
                question.type
              )}`}
            >
              {getQuestionTypeLabel(question.type)}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(
                question.difficulty
              )}`}
            >
              {getDifficultyLabel(question.difficulty)}
            </span>
          </div>
          <p className="text-slate-900 font-medium">{question.question}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              预期答案
            </h4>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
              {question.expectedAnswer}
            </div>
          </div>

          {question.keywords && question.keywords.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                关键词
              </h4>
              <div className="flex flex-wrap gap-2">
                {question.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {question.referenceSections && question.referenceSections.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                参考文档片段
              </h4>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 max-h-40 overflow-y-auto">
                {question.referenceSections.map((section, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <p className="italic">&quot;{section.content}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function QuestionList({ testSuiteId, questions }: QuestionListProps) {
  const [questionList, setQuestionList] = useState<Question[]>(questions);

  const handleUpdate = (updated: Question) => {
    setQuestionList((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
  };

  const handleDelete = (id: string) => {
    setQuestionList((prev) => prev.filter((q) => q.id !== id));
  };

  if (questionList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>暂无问题</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {questionList.map((question) => (
        <QuestionItem
          key={question.id}
          question={{ ...question, testSuiteId }}
          onUpdate={handleUpdate}
          onDelete={() => handleDelete(question.id)}
        />
      ))}
    </div>
  );
}
