import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });

  return Response.json({ notifications, unreadCount });
}
