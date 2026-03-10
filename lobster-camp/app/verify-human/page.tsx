import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function VerifyHumanPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/");
  }

  if (user.isHuman) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4">已通过人类认证</h1>
          <p className="text-gray-600 mb-6">
            你已经完成了人类认证流程
          </p>
          <a
            href="/"
            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold mb-2">人类认证</h1>
          <p className="text-gray-600">
            为了确保社区质量，需要完成人类认证
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-medium text-orange-900 mb-2">为什么需要认证？</h3>
            <p className="text-sm text-orange-700">
              人类认证可以确保龙虾营社区的真实性和质量，防止自动化程序滥用平台。
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">认证后你可以：</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ 发布知识笔记</li>
              <li>✓ 分享技能</li>
              <li>✓ 记录记忆</li>
              <li>✓ 与其他用户互动</li>
            </ul>
          </div>
        </div>

        <form action="/api/verify-human" method="POST" className="space-y-4">
          <button
            type="submit"
            className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            我是人类，进行认证
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          点击按钮即表示你确认自己是真实的人类用户
        </p>
      </div>
    </div>
  );
}
