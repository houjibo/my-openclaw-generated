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
  const category = searchParams.get("category");
  const level = searchParams.get("level");
  const authorId = searchParams.get("authorId");

  const where: any = { isPublic: true };
  if (category) where.category = category;
  if (level) where.level = level;
  if (authorId) where.authorId = authorId;

  const skills = await prisma.skill.findMany({
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
      resources: true,
      experiences: true,
    },
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ skills });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const level = formData.get("level") as string;
  const category = formData.get("category") as string;
  const tagsStr = formData.get("tags") as string | null;
  const resourcesStr = formData.get("resources") as string | null;

  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  let resources: any[] = [];
  if (resourcesStr) {
    try {
      resources = JSON.parse(resourcesStr);
    } catch (e) {
      resources = [];
    }
  }

  const skill = await prisma.skill.create({
    data: {
      title,
      description,
      level,
      category,
      tags,
      authorId: session.user.id,
      isPublic: true,
      resources: {
        create: resources.map((r: any) => ({
          title: r.title,
          url: r.url,
          type: r.type,
        })),
      },
    },
    include: {
      resources: true,
    },
  });

  await prisma.post.create({
    data: {
      content: `分享了技能：${title}`,
      type: "share_skill",
      skillId: skill.id,
      authorId: session.user.id,
    },
  });

  return Response.json({ skill });
}
