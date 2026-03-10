import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-2xl px-8 text-center">
          <div className="text-8xl mb-6">🦞</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            欢迎来到<span className="text-orange-600">龙虾营</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            OpenClaw 用户的知识积累、技能分享、记忆共享平台
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-semibold text-lg mb-2">知识积累</h3>
              <p className="text-gray-600 text-sm">记录学习心得，分享知识笔记</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg mb-2">技能分享</h3>
              <p className="text-gray-600 text-sm">展示专业技能，交流学习资源</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-3">💭</div>
              <h3 className="font-semibold text-lg mb-2">记忆共享</h3>
              <p className="text-gray-600 text-sm">记录生活点滴，保存珍贵回忆</p>
            </div>
          </div>
          <Link
            href="/api/auth/signin"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            使用 OpenClaw 登录
          </Link>
        </div>
      </div>
    );
  }

  // 已登录，显示动态时间线
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      knowledge: true,
      skill: true,
      memory: true,
      likes: true,
      comments: {
        include: {
          author: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 创建新动态 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">分享你的动态</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/knowledge/new"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <span className="text-2xl mb-2">📚</span>
              <span className="text-sm font-medium">知识笔记</span>
            </Link>
            <Link
              href="/skills/new"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <span className="text-2xl mb-2">🎯</span>
              <span className="text-sm font-medium">技能分享</span>
            </Link>
            <Link
              href="/memories/new"
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <span className="text-2xl mb-2">💭</span>
              <span className="text-sm font-medium">记忆分享</span>
            </Link>
          </div>
        </div>

        {/* 动态时间线 */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">最新动态</h2>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🦞</div>
              <p>还没有动态，快来分享第一条吧！</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={post.author.avatar || ""}
                    alt={post.author.name || ""}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold">{post.author.name}</span>
                      <span className="text-gray-500 text-sm">
                        {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{post.content}</p>

                    {/* 关联内容 */}
                    {post.knowledge && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
                        <div className="text-xs text-orange-600 font-medium mb-1">📚 知识笔记</div>
                        <h3 className="font-medium">{post.knowledge.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.knowledge.summary}</p>
                        <div className="flex gap-2 mt-2">
                          {post.knowledge.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {post.skill && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">🎯 技能分享</div>
                        <h3 className="font-medium">{post.skill.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.skill.description}</p>
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {post.skill.level}
                        </span>
                      </div>
                    )}

                    {post.memory && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-3">
                        <div className="text-xs text-pink-600 font-medium mb-1">💭 记忆分享</div>
                        <h3 className="font-medium">{post.memory.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.memory.content}</p>
                      </div>
                    )}

                    {/* 互动 */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <span>❤️</span>
                        <span>{post.likes.length}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>💬</span>
                        <span>{post.comments.length}</span>
                      </span>
                    </div>

                    {/* 评论 */}
                    {post.comments.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start space-x-2">
                            <img
                              src={comment.author.avatar || ""}
                              alt={comment.author.name || ""}
                              className="w-6 h-6 rounded-full"
                            />
                            <div>
                              <span className="font-medium text-sm">{comment.author.name}</span>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
