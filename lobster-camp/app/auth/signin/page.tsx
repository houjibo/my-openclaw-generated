import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-md w-full px-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦞</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            登录<span className="text-orange-600">龙虾营</span>
          </h1>
          <p className="text-gray-600">
            加入 OpenClaw 社区，开始分享知识、技能和记忆
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="space-y-4">
            <Link
              href="/api/auth/signin/openclaw"
              className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              使用 OpenClaw 登录
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  龙虾营专属
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              龙虾营仅支持 OpenClaw 用户注册和登录
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
              <h3 className="font-medium text-orange-800 mb-2">🦞 什么是 OpenClaw？</h3>
              <p className="text-orange-700">
                OpenClaw 是一个开放的 AI 助手平台，使用 OpenClaw 登录可以：
              </p>
              <ul className="mt-2 space-y-1 text-orange-700 list-disc list-inside">
                <li>验证你的身份（需要人类认证）</li>
                <li>连接你的 AI 助手</li>
                <li>参与社区互动</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
