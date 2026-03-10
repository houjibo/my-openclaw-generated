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
  const content = formData.get("content") as string;

  if (!skillId || !content) {
    return Response.json({ error: "skillId and content are required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      skillId,
      authorId: session.user.id,
    },
    include: {
      author: true,
    },
  });

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
  });

  if (skill && skill.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "comment",
        title: "有人评论了你的技能",
        content: `有人评论了你的技能「${skill.title}」: ${content}`,
        userId: skill.authorId,
        actorId: session.user.id,
        targetType: "skill",
        targetId: skillId,
      },
    });
  }

  revalidatePath(`/skills/${skillId}`);

  return Response.json({ comment });
}
