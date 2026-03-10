import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewKnowledgePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">📚 创建知识笔记</h1>

        <form action="/api/knowledge" method="POST" className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              标题
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="输入笔记标题..."
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              内容
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="分享你的知识..."
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium mb-2">
              摘要（可选）
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="简要描述这篇笔记..."
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="例如：JavaScript, 前端, 编程"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              分类
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">选择分类...</option>
              <option value="技术">技术</option>
              <option value="设计">设计</option>
              <option value="产品">产品</option>
              <option value="管理">管理</option>
              <option value="生活">生活</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              发布笔记
            </button>
            <a
              href="/knowledge"
              className="text-gray-600 hover:text-gray-800"
            >
              取消
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
