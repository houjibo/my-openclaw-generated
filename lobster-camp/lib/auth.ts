import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";

// 检查 OAuth 是否配置完整
const isOAuthConfigured = 
  process.env.OPENCLAW_CLIENT_ID && 
  process.env.OPENCLAW_CLIENT_SECRET &&
  process.env.NEXTAUTH_SECRET &&
  process.env.OPENCLAW_CLIENT_SECRET !== "";

const isDev = process.env.NODE_ENV === "development";

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
    // 开发模式下启用 Credentials 提供者
    ...(isDev ? [
      CredentialsProvider({
        name: "Development",
        credentials: {
          email: { label: "Email", type: "email" },
          name: { label: "Name", type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.email) {
            console.log("[Dev Auth] No email provided");
            return null;
          }
          
          console.log("[Dev Auth] Authorizing:", credentials.email);
          
          try {
            // 查找或创建用户
            let user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });

            if (!user) {
              console.log("[Dev Auth] Creating new user");
              user = await prisma.user.create({
                data: {
                  email: credentials.email,
                  name: credentials.name || "Test User",
                  openclawId: `dev-${Date.now()}`,
                  isHuman: true,
                },
              });
            }

            console.log("[Dev Auth] User authorized:", user.id);
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatar,
              openclawId: user.openclawId,
              isHuman: user.isHuman,
            };
          } catch (error) {
            console.error("[Dev Auth] Error:", error);
            return null;
          }
        },
      }),
    ] : []),
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
      // 开发模式下允许 credentials 登录
      if (account?.type === "credentials" && isDev) {
        return true;
      }
      // 只允许 OpenClaw 登录
      if (account?.provider === "openclaw") {
        return true;
      }
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
  debug: isDev,
};
