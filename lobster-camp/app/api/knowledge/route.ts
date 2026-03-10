import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const summary = formData.get("summary") as string | null;
  const tagsStr = formData.get("tags") as string | null;
  const category = formData.get("category") as string;

  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const knowledge = await prisma.knowledge.create({
    data: {
      title,
      content,
      summary: summary || undefined,
      tags,
      category,
      authorId: session.user.id,
      isPublic: true,
    },
  });

  // 创建动态
  await prisma.post.create({
    data: {
      content: `分享了知识笔记：${title}`,
      type: "share_knowledge",
      knowledgeId: knowledge.id,
      authorId: session.user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  redirect(`/knowledge/${knowledge.id}`);
}
