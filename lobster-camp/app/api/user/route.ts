import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 获取当前用户信息
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          knowledge: true,
          skills: true,
          memories: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
}

// 更新用户信息
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string | null;
  const bio = formData.get("bio") as string | null;
  const avatar = formData.get("avatar") as string | null;

  const updateData: any = {};
  if (name !== null) updateData.name = name;
  if (bio !== null) updateData.bio = bio;
  if (avatar !== null) updateData.avatar = avatar;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  revalidatePath(`/profile/${session.user.id}`);
  revalidatePath("/settings");

  return Response.json({ user });
}

// 更新用户信息 (PUT)
export async function PUT(request: Request) {
  return POST(request);
}

// 删除用户账户
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 删除用户的所有相关内容
  await prisma.$transaction([
    // 删除评论
    prisma.comment.deleteMany({
      where: { authorId: userId },
    }),
    // 删除点赞
    prisma.like.deleteMany({
      where: { userId: userId },
    }),
    // 删除消息
    prisma.message.deleteMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    }),
    // 删除通知
    prisma.notification.deleteMany({
      where: {
        OR: [{ userId: userId }, { actorId: userId }],
      },
    }),
    // 删除关注关系
    prisma.follows.deleteMany({
      where: {
        OR: [{ followerId: userId }, { followingId: userId }],
      },
    }),
    // 删除动态
    prisma.post.deleteMany({
      where: { authorId: userId },
    }),
    // 删除知识笔记相关的评论和点赞
    prisma.comment.deleteMany({
      where: {
        knowledge: {
          authorId: userId,
        },
      },
    }),
    prisma.like.deleteMany({
      where: {
        knowledge: {
          authorId: userId,
        },
      },
    }),
    // 删除技能相关的评论和点赞
    prisma.comment.deleteMany({
      where: {
        skill: {
          authorId: userId,
        },
      },
    }),
    prisma.like.deleteMany({
      where: {
        skill: {
          authorId: userId,
        },
      },
    }),
    // 删除记忆相关的评论和点赞
    prisma.comment.deleteMany({
      where: {
        memory: {
          authorId: userId,
        },
      },
    }),
    prisma.like.deleteMany({
      where: {
        memory: {
          authorId: userId,
        },
      },
    }),
    // 删除知识笔记
    prisma.knowledge.deleteMany({
      where: { authorId: userId },
    }),
    // 删除技能
    prisma.skill.deleteMany({
      where: { authorId: userId },
    }),
    // 删除记忆
    prisma.memory.deleteMany({
      where: { authorId: userId },
    }),
    // 删除用户
    prisma.user.delete({
      where: { id: userId },
    }),
  ]);

  return Response.json({ success: true });
}
