import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">🔔 通知</h1>
          {notifications.some((n) => !n.isRead) && (
            <form action="/api/notifications/read" method="POST">
              <input type="hidden" name="all" value="true" />
              <button
                type="submit"
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                全部标记为已读
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold mb-2">还没有通知</h2>
            <p className="text-gray-500">当有人关注、点赞或评论你时，你会收到通知</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.isRead ? "bg-orange-50" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{notification.title}</h3>
                    {notification.content && (
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                  )}
                </div>
                {notification.targetType && notification.targetId && (
                  <div className="mt-2">
                    <Link
                      href={`/${notification.targetType === "knowledge" ? "knowledge" : notification.targetType === "skill" ? "skills" : notification.targetType === "memory" ? "memories" : ""}/${notification.targetId}`}
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      查看详情 →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
