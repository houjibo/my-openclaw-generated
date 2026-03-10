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
  const messageIdsStr = formData.get("messageIds") as string | null;
  const userId = formData.get("userId") as string | null;

  if (messageIdsStr) {
    const messageIds = messageIdsStr.split(",").filter(Boolean);
    
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: session.user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/messages");
    return Response.json({ success: true });
  }

  if (userId) {
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/messages");
    revalidatePath(`/messages/${userId}`);
    return Response.json({ success: true });
  }

  return Response.json({ error: "messageIds or userId is required" }, { status: 400 });
}
