import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    {
      id: "openclaw",
      name: "OpenClaw",
      type: "oauth",
      wellKnown: process.env.OPENCLAW_OAUTH_WELLKNOWN || "http://localhost:18789/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile email" } },
      clientId: process.env.OPENCLAW_CLIENT_ID || "longxiaoying",
      clientSecret: process.env.OPENCLAW_CLIENT_SECRET || "",
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          openclawId: profile.sub,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        (session.user as any).openclawId = (user as any).openclawId;
        (session.user as any).isHuman = (user as any).isHuman;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // 检查是否是 OpenClaw 用户
      if (account?.provider === "openclaw") {
        // 可以在这里添加额外的验证逻辑
        return true;
      }
      // 只允许 OpenClaw 登录
      return false;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
};
