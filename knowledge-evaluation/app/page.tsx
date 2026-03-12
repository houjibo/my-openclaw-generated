import Link from "next/link";
import { FileText, BarChart3, TestTube, Sparkles, Database } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: FileText,
      title: "多格式文档解析",
      description: "支持 DOCX, PDF, PPTX, TXT, MD 等多种文档格式的解析和内容提取",
      href: "/documents",
    },
    {
      icon: BarChart3,
      title: "三维质量评估",
      description: "从内在质量、结构语义、消费效果三个维度全面评估文档质量",
      href: "/evaluations",
    },
    {
      icon: TestTube,
      title: "评测集生成",
      description: "基于文档内容自动生成评测集，支持多种问题类型",
      href: "/test-suites",
    },
    {
      icon: Sparkles,
      title: "文档优化改写",
      description: "基于评估结果提供优化建议，自动改写文档提高评分",
      href: "/optimizations",
    },
    {
      icon: Database,
      title: "向量化评测",
      description: "对文档进行向量化，使用评测集测试向量化效果",
      href: "/vectorizations",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Knowledge Evaluation
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            面向 AI 消费的知识评价和评测系统
          </p>
          <p className="text-base text-slate-500 mt-2 max-w-3xl mx-auto">
            支持多格式文档解析、质量评估、优化改写和向量化评测
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/documents"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            开始使用
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">17+</div>
            <div className="text-sm text-slate-600">评估指标</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">6+</div>
            <div className="text-sm text-slate-600">支持格式</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
            <div className="text-sm text-slate-600">评估维度</div>
          </div>
        </div>
      </div>
    </div>
  );
}
