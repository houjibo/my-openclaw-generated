import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SkillsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const skills = await prisma.skill.findMany({
    include: {
      author: true,
      likes: true,
      comments: true,
      resources: true,
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
            <h1 className="text-3xl font-bold">🎯 技能分享</h1>
            <p className="text-gray-600 mt-2">探索社区成员分享的技能</p>
          </div>
          <Link
            href="/skills/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            分享技能
          </Link>
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold mb-2">还没有技能分享</h2>
            <p className="text-gray-500 mb-4">
              成为第一个分享技能的人吧！
            </p>
            <Link
              href="/skills/new"
              className="text-blue-600 hover:underline"
            >
              分享第一个技能 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <Link href={`/skills/${skill.id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-blue-600">
                    {skill.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {skill.description}
                </p>

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {skill.level}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {skill.category}
                  </span>
                  {skill.resources.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {skill.resources.length} 个资源
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {skill.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <img
                      src={skill.author.avatar || ""}
                      alt={skill.author.name || ""}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {skill.author.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{skill.likes.length}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>💬</span>
                      <span>{skill.comments.length}</span>
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
