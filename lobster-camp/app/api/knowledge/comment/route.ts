import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const knowledgeId = formData.get("knowledgeId") as string;
  const content = formData.get("content") as string;

  if (!knowledgeId || !content) {
    return Response.json({ error: "knowledgeId and content are required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      knowledgeId,
      authorId: session.user.id,
    },
    include: {
      author: true,
    },
  });

  const knowledge = await prisma.knowledge.findUnique({
    where: { id: knowledgeId },
  });

  if (knowledge && knowledge.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "comment",
        title: "有人评论了你的知识笔记",
        content: `有人评论了你的知识笔记「${knowledge.title}」: ${content}`,
        userId: knowledge.authorId,
        actorId: session.user.id,
        targetType: "knowledge",
        targetId: knowledgeId,
      },
    });
  }

  revalidatePath(`/knowledge/${knowledgeId}`);

  return Response.json({ comment });
}
