import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const authorId = searchParams.get("authorId");

  const where: any = { isPublic: true };
  if (type) where.type = type;
  if (authorId) where.authorId = authorId;

  const memories = await prisma.memory.findMany({
    include: {
      author: true,
      likes: true,
      comments: {
        include: {
          author: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ memories });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  const tagsStr = formData.get("tags") as string | null;
  const mood = formData.get("mood") as string | null;
  const location = formData.get("location") as string | null;

  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const memory = await prisma.memory.create({
    data: {
      title,
      content,
      type,
      tags,
      mood: mood || undefined,
      location: location || undefined,
      authorId: session.user.id,
      isPublic: true,
    },
  });

  await prisma.post.create({
    data: {
      content: `分享了记忆：${title}`,
      type: "share_memory",
      memoryId: memory.id,
      authorId: session.user.id,
    },
  });

  return Response.json({ memory });
}
