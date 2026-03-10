import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewMemoryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">💭 分享记忆</h1>

        <form action="/api/memories" method="POST" className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              标题
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="给这段记忆起个标题..."
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="记录这段珍贵的记忆..."
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">
              类型
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">选择类型...</option>
              <option value="story">故事</option>
              <option value="experience">经历</option>
              <option value="reflection">感悟</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mood" className="block text-sm font-medium mb-2">
                心情（可选）
              </label>
              <input
                type="text"
                id="mood"
                name="mood"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="例如：开心、感动、怀念"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                地点（可选）
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="例如：北京、上海"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="例如：旅行, 美食, 朋友"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              发布记忆
            </button>
            <a
              href="/memories"
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
