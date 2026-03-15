import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    include: {
      _count: {
        select: {
          knowledge: true,
          skills: true,
          memories: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-gray-600">管理你的账户和偏好设置</p>
        </div>

        <div className="space-y-6">
          {/* 个人资料卡片 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">个人资料</h2>
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={user.avatar || ""}
                alt={user.name || ""}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h3 className="font-medium text-lg">{user.name}</h3>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {user.isHuman ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✅ 已认证人类
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      ⏳ 待认证
                    </span>
                  )}
                </div>
              </div>
            </div>

            <SettingsForm
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
              }}
            />
          </div>

          {/* 统计数据 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">数据统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {user._count.knowledge}
                </div>
                <div className="text-sm text-gray-600">知识笔记</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {user._count.skills}
                </div>
                <div className="text-sm text-gray-600">技能分享</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">
                  {user._count.memories}
                </div>
                <div className="text-sm text-gray-600">记忆分享</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {user._count.followers}
                </div>
                <div className="text-sm text-gray-600">粉丝</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {user._count.following}
                </div>
                <div className="text-sm text-gray-600">关注</div>
              </div>
            </div>
          </div>

          {/* 人类认证 */}
          {!user.isHuman && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">人类认证</h2>
              <p className="text-gray-600 mb-4">
                完成人类认证后，你的账户将获得认证标识，增加社区信任度。
              </p>
              <Link
                href="/verify-human"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                去认证
              </Link>
            </div>
          )}

          {/* 快速链接 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">快速链接</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href={`/profile/${user.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm font-medium">个人主页</div>
              </Link>
              <Link
                href="/knowledge"
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="text-2xl mb-2">📚</div>
                <div className="text-sm font-medium">知识笔记</div>
              </Link>
              <Link
                href="/skills"
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm font-medium">技能分享</div>
              </Link>
              <Link
                href="/memories"
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
              >
                <div className="text-2xl mb-2">💭</div>
                <div className="text-sm font-medium">记忆共享</div>
              </Link>
            </div>
          </div>

          {/* 账户操作 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">账户操作</h2>
            <div className="space-y-3">
              <Link
                href="/api/auth/signout"
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                退出登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
