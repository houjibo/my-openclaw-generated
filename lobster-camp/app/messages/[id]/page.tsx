import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/auth/signin");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">用户不存在</h1>
          <Link href="/messages" className="text-blue-600 hover:underline">
            返回消息列表
          </Link>
        </div>
      </div>
    );
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: id },
        { senderId: id, receiverId: session.user.id },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: {
      senderId: id,
      receiverId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/messages"
            className="text-gray-600 hover:text-gray-800 mb-4 inline-block"
          >
            ← 返回消息列表
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 p-4 border-b">
            <img
              src={otherUser.avatar || ""}
              alt={otherUser.name || ""}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="font-semibold">{otherUser.name}</h2>
              <p className="text-sm text-gray-500">{otherUser.email}</p>
            </div>
          </div>

          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                还没有消息，发送第一条消息吧！
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === session.user.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                      <div className="flex items-end space-x-2">
                        {!isOwn && (
                          <img
                            src={message.sender.avatar || ""}
                            alt={message.sender.name || ""}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        {new Date(message.createdAt).toLocaleString("zh-CN")}
                        {isOwn && message.isRead && " ✓ 已读"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t">
            <form action="/api/messages" method="POST" className="flex space-x-2">
              <input type="hidden" name="receiverId" value={id} />
              <input
                type="text"
                name="content"
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入消息..."
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                发送
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
