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
  const userId = formData.get("userId") as string;

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return Response.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existingFollow = await prisma.follows.findFirst({
    where: {
      followerId: session.user.id,
      followingId: userId,
    },
  });

  if (existingFollow) {
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });
  } else {
    await prisma.follows.create({
      data: {
        followerId: session.user.id,
        followingId: userId,
      },
    });

    await prisma.notification.create({
      data: {
        type: "follow",
        title: "有人关注了你",
        content: "有人关注了你",
        userId: userId,
        actorId: session.user.id,
      },
    });
  }

  revalidatePath(`/profile/${userId}`);
  revalidatePath(`/profile/${session.user.id}`);

  return Response.json({ success: true, following: !existingFollow });
}
