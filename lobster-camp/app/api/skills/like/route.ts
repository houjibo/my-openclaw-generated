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
  const skillId = formData.get("skillId") as string;

  if (!skillId) {
    return Response.json({ error: "skillId is required" }, { status: 400 });
  }

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: session.user.id,
      skillId,
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
        skillId,
      },
    });

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: { author: true },
    });

    if (skill && skill.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "like",
          title: "有人赞了你的技能",
          content: `有人赞了你的技能「${skill.title}」`,
          userId: skill.authorId,
          actorId: session.user.id,
          targetType: "skill",
          targetId: skillId,
        },
      });
    }
  }

  revalidatePath(`/skills/${skillId}`);
  revalidatePath("/skills");
  revalidatePath("/");

  return Response.json({ success: true });
}
