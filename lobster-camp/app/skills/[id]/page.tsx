import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/auth/signin");
  }

  const skill = await prisma.skill.findUnique({
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
      resources: true,
      experiences: true,
    },
  });

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">技能不存在</h1>
          <Link href="/skills" className="text-blue-600 hover:underline">
            返回技能列表
          </Link>
        </div>
      </div>
    );
  }

  const hasLiked = skill.likes.some(
    (like) => like.userId === session.user?.id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-4">{skill.title}</h1>

          <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
            <Link href={`/profile/${skill.authorId}`}>
              <img
                src={skill.author.avatar || ""}
                alt={skill.author.name || ""}
                className="w-10 h-10 rounded-full"
              />
            </Link>
            <div className="flex-1">
              <Link
                href={`/profile/${skill.authorId}`}
                className="font-medium hover:text-blue-600"
              >
                {skill.author.name}
              </Link>
              <div className="text-sm text-gray-500">
                {new Date(skill.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">
                {skill.level}
              </span>
              <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded">
                {skill.category}
              </span>
            </div>
          </div>

          {skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose max-w-none mb-8">
            <p className="whitespace-pre-wrap text-gray-700">
              {skill.description}
            </p>
          </div>

          {skill.resources.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">📚 学习资源</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skill.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">
                        {resource.type === "video" && "🎬"}
                        {resource.type === "article" && "📄"}
                        {resource.type === "book" && "📕"}
                        {resource.type === "course" && "🎓"}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {resource.type}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {skill.experiences.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">💡 经验分享</h2>
              <div className="space-y-4">
                {skill.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{exp.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4 pt-6 border-t">
            <form action="/api/skills/like" method="POST" className="flex items-center space-x-4">
              <input type="hidden" name="skillId" value={skill.id} />
              <button
                type="submit"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  hasLiked
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>❤️</span>
                <span>{skill.likes.length}</span>
              </button>
            </form>

            <div className="flex items-center space-x-2 px-4 py-2 text-gray-600">
              <span>💬</span>
              <span>{skill.comments.length}</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-6">评论</h2>

            <form action="/api/skills/comment" method="POST" className="mb-8">
              <input type="hidden" name="skillId" value={skill.id} />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="写下你的评论..."
                  />
                  <button
                    type="submit"
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    发表评论
                  </button>
                </div>
              </div>
            </form>

            {skill.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">还没有评论</p>
            ) : (
              <div className="space-y-6">
                {skill.comments.map((comment) => (
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
                          className="font-medium hover:text-blue-600"
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
