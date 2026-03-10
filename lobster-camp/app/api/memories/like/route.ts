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

  if (!memoryId) {
    return Response.json({ error: "memoryId is required" }, { status: 400 });
  }

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: session.user.id,
      memoryId,
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
        memoryId,
      },
    });

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: { author: true },
    });

    if (memory && memory.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "like",
          title: "有人赞了你的记忆",
          content: `有人赞了你的记忆「${memory.title}」`,
          userId: memory.authorId,
          actorId: session.user.id,
          targetType: "memory",
          targetId: memoryId,
        },
      });
    }
  }

  revalidatePath(`/memories/${memoryId}`);
  revalidatePath("/memories");
  revalidatePath("/");

  return Response.json({ success: true });
}
