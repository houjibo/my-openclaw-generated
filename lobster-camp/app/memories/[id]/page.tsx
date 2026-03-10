import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/auth/signin");
  }

  const memory = await prisma.memory.findUnique({
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

  if (!memory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">记忆不存在</h1>
          <Link href="/memories" className="text-pink-600 hover:underline">
            返回记忆列表
          </Link>
        </div>
      </div>
    );
  }

  const hasLiked = memory.likes.some(
    (like) => like.userId === session.user?.id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-4">{memory.title}</h1>

          <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
            <Link href={`/profile/${memory.authorId}`}>
              <img
                src={memory.author.avatar || ""}
                alt={memory.author.name || ""}
                className="w-10 h-10 rounded-full"
              />
            </Link>
            <div className="flex-1">
              <Link
                href={`/profile/${memory.authorId}`}
                className="font-medium hover:text-pink-600"
              >
                {memory.author.name}
              </Link>
              <div className="text-sm text-gray-500">
                {new Date(memory.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded">
                {memory.type}
              </span>
              {memory.mood && (
                <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded">
                  {memory.mood}
                </span>
              )}
            </div>
          </div>

          {memory.location && (
            <div className="mb-4 text-sm text-gray-600">
              📍 {memory.location}
            </div>
          )}

          {memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm bg-pink-50 text-pink-600 px-3 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose max-w-none mb-8">
            <p className="whitespace-pre-wrap text-gray-700">
              {memory.content}
            </p>
          </div>

          <div className="flex items-center space-x-4 pt-6 border-t">
            <form action="/api/memories/like" method="POST" className="flex items-center space-x-4">
              <input type="hidden" name="memoryId" value={memory.id} />
              <button
                type="submit"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  hasLiked
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>❤️</span>
                <span>{memory.likes.length}</span>
              </button>
            </form>

            <div className="flex items-center space-x-2 px-4 py-2 text-gray-600">
              <span>💬</span>
              <span>{memory.comments.length}</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-6">评论</h2>

            <form action="/api/memories/comment" method="POST" className="mb-8">
              <input type="hidden" name="memoryId" value={memory.id} />
              <div className="flex space-x-4">
                <img
                  src={session.user?.image || ""}
                  alt={session.user?.name || ""}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    name="content"
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="写下你的评论..."
                  />
                  <button
                    type="submit"
                    className="mt-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    发表评论
                  </button>
                </div>
              </div>
            </form>

            {memory.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">还没有评论</p>
            ) : (
              <div className="space-y-6">
                {memory.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <Link href={`/profile/${comment.authorId}`}>
                      <img
                        src={comment.author.avatar || ""}
                        alt={comment.author.name || ""}
                        className="w-10 h-10 rounded-full"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link
                          href={`/profile/${comment.authorId}`}
                          className="font-medium hover:text-pink-600"
                        >
                          {comment.author.name}
                        </Link>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "zh-CN"
                          )}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
