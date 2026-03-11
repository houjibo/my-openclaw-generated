import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const query = q || "";
  const searchType = type || "all";

  let results: any = {
    knowledge: [],
    skills: [],
    memories: [],
    users: [],
  };

  if (query) {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/search?q=${encodeURIComponent(query)}&type=${searchType}`,
      {
        headers: {
          Cookie: `next-auth.session-token=${process.env.SESSION_TOKEN || ""}`,
        },
      }
    );
    
    if (res.ok) {
      results = await res.json().then((data) => data.results);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">🔍 搜索</h1>

        <form method="GET" className="mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="搜索知识、技能、记忆或用户..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <select
              name="type"
              defaultValue={searchType}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">全部</option>
              <option value="knowledge">知识</option>
              <option value="skill">技能</option>
              <option value="memory">记忆</option>
              <option value="user">用户</option>
            </select>
            <button
              type="submit"
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </form>

        {!query ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">搜索龙虾营</h2>
            <p className="text-gray-500">输入关键词搜索知识、技能、记忆或用户</p>
          </div>
        ) : (
          <div className="space-y-8">
            {results.knowledge?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">📚</span> 知识笔记 ({results.knowledge.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.knowledge.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/knowledge/${item.id}`}
                      className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.summary || item.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.author.name}</span>
                        <span>❤️ {item.likes.length}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.skills?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">🎯</span> 技能分享 ({results.skills.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.skills.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/skills/${item.id}`}
                      className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.author.name}</span>
                        <span>❤️ {item.likes.length}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.memories?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">💭</span> 记忆共享 ({results.memories.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.memories.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/memories/${item.id}`}
                      className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.author.name}</span>
                        <span>❤️ {item.likes.length}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.users?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">👤</span> 用户 ({results.users.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.users.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="flex items-center space-x-3 bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={user.avatar || ""}
                        alt={user.name || ""}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(!results.knowledge?.length &&
              !results.skills?.length &&
              !results.memories?.length &&
              !results.users?.length) && (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold mb-2">没有找到结果</h2>
                <p className="text-gray-500">尝试使用其他关键词搜索</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
