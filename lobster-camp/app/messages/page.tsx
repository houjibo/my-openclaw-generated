import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const conversations: any = {};
  messages.forEach((msg) => {
    const otherId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === session.user.id ? msg.receiver : msg.sender;
    
    if (!conversations[otherId]) {
      conversations[otherId] = {
        user: otherUser,
        lastMessage: msg,
        unreadCount: 0,
      };
    }
    
    if (msg.receiverId === session.user.id && !msg.isRead) {
      conversations[otherId].unreadCount++;
    }
  });

  const conversationList = Object.values(conversations) as any[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">💬 消息</h1>

        {conversationList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">还没有消息</h2>
            <p className="text-gray-500">开始和其他用户交流吧！</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {conversationList.map((conv: any) => (
              <Link
                key={conv.user.id}
                href={`/messages/${conv.user.id}`}
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <img
                  src={conv.user.avatar || ""}
                  alt={conv.user.name || ""}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{conv.user.name}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage.senderId === session.user.id ? "你: " : ""}
                    {conv.lastMessage.content}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
