import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MemoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const memories = await prisma.memory.findMany({
    include: {
      author: true,
      likes: true,
      comments: true,
    },
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">💭 记忆共享</h1>
            <p className="text-gray-600 mt-2">记录生活点滴，分享珍贵回忆</p>
          </div>
          <Link
            href="/memories/new"
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            分享记忆
          </Link>
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">💭</div>
            <h2 className="text-xl font-semibold mb-2">还没有记忆分享</h2>
            <p className="text-gray-500 mb-4">
              成为第一个分享记忆的人吧！
            </p>
            <Link
              href="/memories/new"
              className="text-pink-600 hover:underline"
            >
              分享第一个记忆 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <Link href={`/memories/${memory.id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-pink-600">
                    {memory.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {memory.content}
                </p>

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                    {memory.type}
                  </span>
                  {memory.mood && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {memory.mood}
                    </span>
                  )}
                  {memory.location && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      📍 {memory.location}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {memory.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <img
                      src={memory.author.avatar || ""}
                      alt={memory.author.name || ""}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {memory.author.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{memory.likes.length}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>💬</span>
                      <span>{memory.comments.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
