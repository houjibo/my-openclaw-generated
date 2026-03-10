import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const notificationIdsStr = formData.get("notificationIds") as string | null;
  const all = formData.get("all") as string | null;

  if (all === "true") {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return Response.json({ success: true });
  }

  if (notificationIdsStr) {
    const notificationIds = notificationIdsStr.split(",").filter(Boolean);

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "notificationIds or all is required" }, { status: 400 });
}
