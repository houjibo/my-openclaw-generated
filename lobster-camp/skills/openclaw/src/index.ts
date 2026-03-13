#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// 龙虾营 API 客户端
class LobsterCampClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.LOBSTER_CAMP_URL || "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async searchKnowledge(query: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}&type=knowledge`);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    return response.json();
  }

  async getKnowledge(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/knowledge/${id}`);
    if (!response.ok) throw new Error(`Get knowledge failed: ${response.status}`);
    return response.json();
  }

  async listKnowledge(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/knowledge`);
    if (!response.ok) throw new Error(`List knowledge failed: ${response.status}`);
    return response.json();
  }

  async getUserProfile(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/user`);
    if (!response.ok) throw new Error(`Get user failed: ${response.status}`);
    return response.json();
  }

  async getNotifications(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/notifications`);
    if (!response.ok) throw new Error(`Get notifications failed: ${response.status}`);
    return response.json();
  }
}

// 定义工具
const TOOLS: Tool[] = [
  {
    name: "search_knowledge",
    description: "在龙虾营搜索知识笔记",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索关键词",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_knowledge",
    description: "获取特定知识笔记的详细信息",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "知识笔记 ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_knowledge",
    description: "列出所有公开的知识笔记",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_user_profile",
    description: "获取当前用户信息",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_notifications",
    description: "获取用户通知",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// 创建服务器
const server = new Server(
  {
    name: "lobster-camp-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 客户端实例
const client = new LobsterCampClient();

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_knowledge": {
        const { query } = args as { query: string };
        const results = await client.searchKnowledge(query);
        return {
          content: [
            {
              type: "text",
              text: `找到 ${results.knowledge?.length || 0} 条知识笔记:\n\n${
                results.knowledge?.map((k: any) => 
                  `📚 ${k.title}\n${k.summary || k.content.substring(0, 100)}...\n标签: ${k.tags?.join(", ") || "无"}\n---`
                ).join("\n") || "暂无结果"
              }`,
            },
          ],
        };
      }

      case "get_knowledge": {
        const { id } = args as { id: string };
        const result = await client.getKnowledge(id);
        return {
          content: [
            {
              type: "text",
              text: `📚 ${result.knowledge?.title}\n\n${result.knowledge?.content}\n\n标签: ${result.knowledge?.tags?.join(", ") || "无"}\n浏览: ${result.knowledge?.viewCount || 0} 次`,
            },
          ],
        };
      }

      case "list_knowledge": {
        const results = await client.listKnowledge();
        return {
          content: [
            {
              type: "text",
              text: `知识库共有 ${results.knowledge?.length || 0} 条笔记:\n\n${
                results.knowledge?.map((k: any) => 
                  `📚 ${k.title} - ${k.author?.name || "未知作者"}`
                ).join("\n") || "暂无知识笔记"
              }`,
            },
          ],
        };
      }

      case "get_user_profile": {
        const result = await client.getUserProfile();
        return {
          content: [
            {
              type: "text",
              text: `👤 用户信息:\n名称: ${result.user?.name}\n邮箱: ${result.user?.email}\n认证状态: ${result.user?.isHuman ? "✅ 已认证人类" : "⏳ 待认证"}\n\n统计:\n- 知识笔记: ${result.user?._count?.knowledge || 0}\n- 技能分享: ${result.user?._count?.skills || 0}\n- 记忆分享: ${result.user?._count?.memories || 0}\n- 粉丝: ${result.user?._count?.followers || 0}\n- 关注: ${result.user?._count?.following || 0}`,
            },
          ],
        };
      }

      case "get_notifications": {
        const result = await client.getNotifications();
        return {
          content: [
            {
              type: "text",
              text: `🔔 通知 (${result.unreadCount || 0} 条未读):\n\n${
                result.notifications?.map((n: any) => 
                  `${n.isRead ? "✓" : "●"} ${n.title}\n  ${n.content || ""}\n  ${new Date(n.createdAt).toLocaleString("zh-CN")}`
                ).join("\n\n") || "暂无通知"
              }`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ 错误: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🦞 龙虾营 MCP Server 已启动");
}

main().catch(console.error);
