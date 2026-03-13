import type { NextConfig } from "next";

// 检查 OAuth 是否配置
const isOAuthConfigured = 
  process.env.OPENCLAW_CLIENT_ID && 
  process.env.OPENCLAW_CLIENT_SECRET &&
  process.env.OPENCLAW_CLIENT_SECRET !== "";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_OAUTH_CONFIGURED: isOAuthConfigured ? "true" : "false",
  },
};

export default nextConfig;
