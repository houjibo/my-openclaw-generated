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
  const q = searchParams.get("q");
  const type = searchParams.get("type");

  if (!q || q.trim().length === 0) {
    return Response.json({ results: [] });
  }

  const searchTerm = q.trim().toLowerCase();
  const results: any = {};

  if (!type || type === "all" || type === "knowledge") {
    results.knowledge = await prisma.knowledge.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
        ],
      },
      include: {
        author: true,
        likes: true,
      },
      take: 10,
    });
  }

  if (!type || type === "all" || type === "skill") {
    results.skills = await prisma.skill.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
        ],
      },
      include: {
        author: true,
        likes: true,
      },
      take: 10,
    });
  }

  if (!type || type === "all" || type === "memory") {
    results.memories = await prisma.memory.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
        ],
      },
      include: {
        author: true,
        likes: true,
      },
      take: 10,
    });
  }

  if (!type || type === "all" || type === "user") {
    results.users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 10,
    });
  }

  return Response.json({ results });
}
