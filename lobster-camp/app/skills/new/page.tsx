import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewSkillPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">🎯 分享技能</h1>

        <form action="/api/skills" method="POST" className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              技能名称
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：React 开发"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              技能描述
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="详细描述这项技能..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="level" className="block text-sm font-medium mb-2">
                技能等级
              </label>
              <select
                id="level"
                name="level"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">选择等级...</option>
                <option value="beginner">初学者</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
                <option value="expert">专家</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                技能分类
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">选择分类...</option>
                <option value="编程">编程</option>
                <option value="设计">设计</option>
                <option value="产品">产品</option>
                <option value="管理">管理</option>
                <option value="营销">营销</option>
                <option value="语言">语言</option>
                <option value="音乐">音乐</option>
                <option value="运动">运动</option>
                <option value="其他">其他</option>
              </select>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：JavaScript, 前端, Web开发"
            />
          </div>

          <div>
            <label htmlFor="resources" className="block text-sm font-medium mb-2">
              学习资源（JSON 格式，可选）
            </label>
            <textarea
              id="resources"
              name="resources"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder={`[
  {"title": "官方文档", "url": "https://example.com", "type": "article"},
  {"title": "视频教程", "url": "https://example.com", "type": "video"}
]`}
            />
            <p className="text-xs text-gray-500 mt-1">
              可选：添加相关的学习资源，支持 article、video、book、course 类型
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              发布技能
            </button>
            <a
              href="/skills"
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
