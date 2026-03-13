"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("test@example.com");
  const [name, setName] = useState("测试用户");
  const [isLoading, setIsLoading] = useState(false);

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (session) {
      window.location.href = callbackUrl;
    }
  }, [session, callbackUrl]);

  const handleOpenClawLogin = () => {
    setIsLoading(true);
    signIn("openclaw", { callbackUrl });
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn("credentials", {
      email,
      name,
      callbackUrl,
    });
  };

  // 检查 OAuth 是否配置
  const isOAuthConfigured = process.env.NEXT_PUBLIC_OAUTH_CONFIGURED === "true";
  const isDev = process.env.NODE_ENV === "development";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">🦞 加载中...</div>
      </div>
    );
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            登录失败: {error === "Configuration" ? "服务器配置错误" : 
                      error === "AccessDenied" ? "访问被拒绝" : 
                      error === "OAuthSignin" ? "OAuth 登录初始化失败 (请检查 OpenClaw Gateway 是否在运行)" : 
                      "未知错误，请重试"}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="space-y-4">
            {/* OpenClaw OAuth 登录 */}
            <button
              onClick={handleOpenClawLogin}
              disabled={isLoading}
              className="block w-full bg-orange-600 text-white text-center py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "登录中..." : "使用 OpenClaw 登录"}
            </button>

            {/* 开发模式提示 */}
            {(!isOAuthConfigured && isDev) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ OAuth 未配置或 OpenClaw Gateway 未运行，使用下方开发登录
                </p>
              </div>
            )}

            {/* 开发模式备用登录 */}
            {isDev && (
              <form onSubmit={handleDevLogin} className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-3 text-center">开发模式快速登录</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="邮箱"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="昵称"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="block w-full bg-gray-800 text-white text-center py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:bg-gray-400"
                  >
                    {isLoading ? "登录中..." : "开发模式登录"}
                  </button>
                </div>
              </form>
            )}

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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">🦞 加载中...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
