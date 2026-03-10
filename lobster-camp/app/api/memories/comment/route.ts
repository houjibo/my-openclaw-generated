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
  const memoryId = formData.get("memoryId") as string;
  const content = formData.get("content") as string;

  if (!memoryId || !content) {
    return Response.json({ error: "memoryId and content are required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      memoryId,
      authorId: session.user.id,
    },
    include: {
      author: true,
    },
  });

  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
  });

  if (memory && memory.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "comment",
        title: "有人评论了你的记忆",
        content: `有人评论了你的记忆「${memory.title}」: ${content}`,
        userId: memory.authorId,
        actorId: session.user.id,
        targetType: "memory",
        targetId: memoryId,
      },
    });
  }

  revalidatePath(`/memories/${memoryId}`);

  return Response.json({ comment });
}
