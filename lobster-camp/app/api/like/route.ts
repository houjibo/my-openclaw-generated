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

  if (!type || !targetId) {
    return Response.json({ error: "type and targetId are required" }, { status: 400 });
  }

  const validTypes = ["knowledge", "skill", "memory", "post"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  const whereClause: any = {
    userId: session.user.id,
  };
  whereClause[`${type}Id`] = targetId;

  const existingLike = await prisma.like.findFirst({
    where: whereClause,
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    const createData: any = {
      userId: session.user.id,
    };
    createData[`${type}Id`] = targetId;

    await prisma.like.create({
      data: createData,
    });

    const target = await (prisma as any)[type].findUnique({
      where: { id: targetId },
      include: { author: true },
    });

    if (target && target.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "like",
          title: `有人赞了你的${type === "knowledge" ? "知识" : type === "skill" ? "技能" : type === "memory" ? "记忆" : "动态"}`,
          content: `有人赞了你的${type === "knowledge" ? "知识笔记" : type === "skill" ? "技能分享" : type === "memory" ? "记忆" : "动态"}「${target.title || target.content?.substring(0, 20)}」`,
          userId: target.authorId,
          actorId: session.user.id,
          targetType: type,
          targetId,
        },
      });
    }
  }

  const basePath = type === "knowledge" ? "knowledge" : type === "skill" ? "skills" : type === "memory" ? "memories" : "";
  if (basePath) {
    revalidatePath(`/${basePath}/${targetId}`);
    revalidatePath(`/${basePath}`);
  }
  revalidatePath("/");

  return Response.json({ success: true, liked: !existingLike });
}
