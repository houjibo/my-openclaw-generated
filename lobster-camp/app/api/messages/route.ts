import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
    take: 100,
  });

  const conversations: any = {};
  messages.forEach((msg) => {
    const otherId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const otherUser = msg.senderId === session.user.id ? msg.receiver : msg.sender;
    
    if (!conversations[otherId]) {
      conversations[otherId] = {
        user: otherUser,
        messages: [],
        unreadCount: 0,
      };
    }
    
    conversations[otherId].messages.push(msg);
    
    if (msg.receiverId === session.user.id && !msg.isRead) {
      conversations[otherId].unreadCount++;
    }
  });

  return Response.json({ conversations: Object.values(conversations) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const receiverId = formData.get("receiverId") as string;
  const content = formData.get("content") as string;

  if (!receiverId || !content) {
    return Response.json({ error: "receiverId and content are required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId: session.user.id,
      receiverId,
    },
    include: {
      sender: true,
      receiver: true,
    },
  });

  await prisma.notification.create({
    data: {
      type: "message",
      title: "收到新消息",
      content: `${message.sender.name} 给你发了一条消息`,
      userId: receiverId,
      actorId: session.user.id,
    },
  });

  return Response.json({ message });
}
