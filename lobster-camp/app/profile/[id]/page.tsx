import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          knowledge: true,
          skills: true,
          memories: true,
        },
      },
      knowledge: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      skills: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      memories: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦞</div>
          <h1 className="text-2xl font-bold mb-2">用户不存在</h1>
          <Link href="/" className="text-orange-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = session.user?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 个人信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-6">
            <img
              src={user.avatar || ""}
              alt={user.name || ""}
              className="w-24 h-24 rounded-full"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
              {user.bio && (
                <p className="text-gray-600 mb-4">{user.bio}</p>
              )}
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span className="font-semibold">{user._count.followers}</span>
                  <span className="text-gray-500">关注者</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="font-semibold">{user._count.following}</span>
                  <span className="text-gray-500">正在关注</span>
                </span>
                {user.isHuman && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    ✓ 已认证人类
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {user._count.knowledge}
            </div>
            <div className="text-sm text-gray-500">知识笔记</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {user._count.skills}
            </div>
            <div className="text-sm text-gray-500">技能</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">
              {user._count.memories}
            </div>
            <div className="text-sm text-gray-500">记忆</div>
          </div>
        </div>

        {/* 内容标签页 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              <button className="py-4 text-orange-600 border-b-2 border-orange-600 font-medium">
                知识笔记 ({user._count.knowledge})
              </button>
              <button className="py-4 text-gray-500 hover:text-gray-700">
                技能 ({user._count.skills})
              </button>
              <button className="py-4 text-gray-500 hover:text-gray-700">
                记忆 ({user._count.memories})
              </button>
            </div>
          </div>

          <div className="p-6">
            {user.knowledge.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>还没有发布任何知识笔记</p>
              </div>
            ) : (
              <div className="space-y-4">
                {user.knowledge.map((knowledge) => (
                  <div
                    key={knowledge.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <Link href={`/knowledge/${knowledge.id}`}>
                      <h3 className="font-semibold text-lg mb-2 hover:text-orange-600">
                        {knowledge.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {knowledge.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {knowledge.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(knowledge.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
