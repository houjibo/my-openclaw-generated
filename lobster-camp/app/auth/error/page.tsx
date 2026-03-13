"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "服务器配置错误，请联系管理员";
      case "AccessDenied":
        return "访问被拒绝，您没有权限登录";
      case "Verification":
        return "验证失败，请重新尝试登录";
      case "OAuthSignin":
        return "OAuth 登录初始化失败";
      case "OAuthCallback":
        return "OAuth 回调处理失败";
      case "OAuthCreateAccount":
        return "创建 OAuth 账户失败";
      case "EmailCreateAccount":
        return "创建邮箱账户失败";
      case "Callback":
        return "回调处理失败";
      case "OAuthAccountNotLinked":
        return "OAuth 账户未关联";
      case "EmailSignin":
        return "邮箱登录失败";
      case "CredentialsSignin":
        return "凭据登录失败";
      case "SessionRequired":
        return "需要登录才能访问此页面";
      default:
        return "登录过程中发生错误，请重试";
    }
  };

  return (
    <>
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold mb-4">登录出错</h1>
      <p className="text-gray-600 mb-6">
        {getErrorMessage(error)}
      </p>
      {error && (
        <p className="text-xs text-gray-400 mb-6">
          错误代码: {error}
        </p>
      )}
      <div className="space-y-3">
        <Link
          href="/api/auth/signin"
          className="block w-full bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          重新登录
        </Link>
        <Link
          href="/"
          className="block w-full text-gray-600 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <Suspense fallback={
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">登录出错</h1>
            <p className="text-gray-600 mb-6">加载中...</p>
          </>
        }>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
