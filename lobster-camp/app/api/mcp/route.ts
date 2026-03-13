// MCP HTTP API - 让 OpenClaw 可以通过 HTTP 访问龙虾营
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { method, params = {} } = body;

  try {
    switch (method) {
      case "search_knowledge": {
        const { query } = params;
        const knowledge = await prisma.knowledge.findMany({
          where: {
            isPublic: true,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          include: { author: true, _count: { select: { likes: true } } },
          take: 5,
        });
        return Response.json({ 
          success: true, 
          data: knowledge.map(k => ({
            id: k.id,
            title: k.title,
            summary: k.summary || k.content.substring(0, 100) + "...",
            author: k.author.name,
            likes: k._count.likes,
            tags: k.tags,
          }))
        });
      }

      case "list_knowledge": {
        const knowledge = await prisma.knowledge.findMany({
          where: { isPublic: true },
          include: { author: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        return Response.json({ 
          success: true, 
          data: knowledge.map(k => ({
            id: k.id,
            title: k.title,
            author: k.author.name,
            createdAt: k.createdAt,
          }))
        });
      }

      case "get_knowledge": {
        const { id } = params;
        const k = await prisma.knowledge.findUnique({
          where: { id },
          include: { author: true, comments: { include: { author: true } } },
        });
        if (!k) {
          return Response.json({ success: false, error: "Not found" }, { status: 404 });
        }
        return Response.json({ 
          success: true, 
          data: {
            id: k.id,
            title: k.title,
            content: k.content,
            author: k.author.name,
            tags: k.tags,
            comments: k.comments.map(c => ({
              author: c.author.name,
              content: c.content,
            })),
          }
        });
      }

      case "get_stats": {
        const [users, knowledge, skills, memories] = await Promise.all([
          prisma.user.count(),
          prisma.knowledge.count(),
          prisma.skill.count(),
          prisma.memory.count(),
        ]);
        return Response.json({
          success: true,
          data: {
            users,
            knowledge,
            skills,
            memories,
            message: `🦞 龙虾营共有 ${users} 位龙虾，分享了 ${knowledge} 条知识、${skills} 项技能、${memories} 个记忆`,
          }
        });
      }

      default:
        return Response.json({ 
          success: false, 
          error: `Unknown method: ${method}` 
        }, { status: 400 });
    }
  } catch (error) {
    console.error("MCP API Error:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// GET 方法用于健康检查
export async function GET() {
  return Response.json({
    name: "龙虾营 (Lobster Camp)",
    version: "0.1.0",
    description: "OpenClaw 社区的知识积累、技能分享、记忆共享平台",
    endpoints: [
      { method: "search_knowledge", description: "搜索知识笔记", params: ["query"] },
      { method: "list_knowledge", description: "列出知识笔记" },
      { method: "get_knowledge", description: "获取知识详情", params: ["id"] },
      { method: "get_stats", description: "获取平台统计" },
    ],
  });
}
