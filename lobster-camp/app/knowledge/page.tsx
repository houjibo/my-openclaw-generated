import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function KnowledgePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const knowledge = await prisma.knowledge.findMany({
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
            <h1 className="text-3xl font-bold">📚 知识笔记</h1>
            <p className="text-gray-600 mt-2">探索社区成员分享的知识</p>
          </div>
          <Link
            href="/knowledge/new"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            创建笔记
          </Link>
        </div>

        {knowledge.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">还没有知识笔记</h2>
            <p className="text-gray-500 mb-4">
              成为第一个分享知识的人吧！
            </p>
            <Link
              href="/knowledge/new"
              className="text-orange-600 hover:underline"
            >
              创建第一篇笔记 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {knowledge.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <Link href={`/knowledge/${item.id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-orange-600">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {item.summary || item.content}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <img
                      src={item.author.avatar || ""}
                      alt={item.author.name || ""}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {item.author.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{item.likes.length}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>💬</span>
                      <span>{item.comments.length}</span>
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
