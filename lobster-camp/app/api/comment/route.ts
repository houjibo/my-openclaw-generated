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
  const type = formData.get("type") as string;
  const targetId = formData.get("targetId") as string;
  const content = formData.get("content") as string;

  if (!type || !targetId || !content) {
    return Response.json({ error: "type, targetId and content are required" }, { status: 400 });
  }

  const validTypes = ["knowledge", "skill", "memory", "post"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  const createData: any = {
    content,
    authorId: session.user.id,
  };
  createData[`${type}Id`] = targetId;

  const comment = await prisma.comment.create({
    data: createData,
    include: {
      author: true,
    },
  });

  const target = await (prisma as any)[type].findUnique({
    where: { id: targetId },
  });

  if (target && target.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "comment",
        title: `有人评论了你的${type === "knowledge" ? "知识" : type === "skill" ? "技能" : type === "memory" ? "记忆" : "动态"}`,
        content: `有人评论了你的${type === "knowledge" ? "知识笔记" : type === "skill" ? "技能分享" : type === "memory" ? "记忆" : "动态"}: ${content}`,
        userId: target.authorId,
        actorId: session.user.id,
        targetType: type,
        targetId,
      },
    });
  }

  const basePath = type === "knowledge" ? "knowledge" : type === "skill" ? "skills" : type === "memory" ? "memories" : "";
  if (basePath) {
    revalidatePath(`/${basePath}/${targetId}`);
  }

  return Response.json({ comment });
}
