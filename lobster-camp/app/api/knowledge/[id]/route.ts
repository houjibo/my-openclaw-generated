import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 获取知识笔记详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const knowledge = await prisma.knowledge.findUnique({
    where: { id },
    include: {
      author: true,
      likes: true,
      comments: {
        include: {
          author: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!knowledge) {
    return Response.json({ error: "Knowledge not found" }, { status: 404 });
  }

  // 检查访问权限
  if (!knowledge.isPublic && knowledge.authorId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ knowledge });
}

// 更新知识笔记
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const knowledge = await prisma.knowledge.findUnique({
    where: { id },
  });

  if (!knowledge) {
    return Response.json({ error: "Knowledge not found" }, { status: 404 });
  }

  // 只能更新自己的知识笔记
  if (knowledge.authorId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const summary = formData.get("summary") as string | null;
  const tagsStr = formData.get("tags") as string | null;
  const category = formData.get("category") as string;
  const isPublic = formData.get("isPublic") as string;

  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const updatedKnowledge = await prisma.knowledge.update({
    where: { id },
    data: {
      title: title || undefined,
      content: content || undefined,
      summary: summary || undefined,
      tags,
      category: category || undefined,
      isPublic: isPublic ? isPublic === "true" : undefined,
    },
  });

  revalidatePath(`/knowledge/${id}`);
  revalidatePath("/knowledge");

  return Response.json({ knowledge: updatedKnowledge });
}

// 删除知识笔记
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const knowledge = await prisma.knowledge.findUnique({
    where: { id },
  });

  if (!knowledge) {
    return Response.json({ error: "Knowledge not found" }, { status: 404 });
  }

  // 只能删除自己的知识笔记
  if (knowledge.authorId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 删除关联的评论和点赞
  await prisma.comment.deleteMany({
    where: { knowledgeId: id },
  });

  await prisma.like.deleteMany({
    where: { knowledgeId: id },
  });

  // 删除关联的动态
  await prisma.post.deleteMany({
    where: { knowledgeId: id },
  });

  // 删除知识笔记
  await prisma.knowledge.delete({
    where: { id },
  });

  revalidatePath("/knowledge");
  revalidatePath("/");

  return Response.json({ success: true });
}
