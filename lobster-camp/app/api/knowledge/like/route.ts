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

  if (!knowledgeId) {
    return Response.json({ error: "knowledgeId is required" }, { status: 400 });
  }

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: session.user.id,
      knowledgeId,
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    await prisma.like.create({
      data: {
        userId: session.user.id,
        knowledgeId,
      },
    });

    const knowledge = await prisma.knowledge.findUnique({
      where: { id: knowledgeId },
      include: { author: true },
    });

    if (knowledge && knowledge.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "like",
          title: "有人赞了你的知识笔记",
          content: `有人赞了你的知识笔记「${knowledge.title}」`,
          userId: knowledge.authorId,
          actorId: session.user.id,
          targetType: "knowledge",
          targetId: knowledgeId,
        },
      });
    }
  }

  revalidatePath(`/knowledge/${knowledgeId}`);
  revalidatePath("/knowledge");
  revalidatePath("/");

  return Response.json({ success: true });
}
