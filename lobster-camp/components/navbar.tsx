"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Brain, Heart, MessageCircle, User, Search, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(console.error);
    }
  }, [session?.user?.id]);

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🦞</span>
            <span className="font-bold text-xl text-orange-600">龙虾营</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/knowledge" className="flex items-center space-x-1 text-gray-600 hover:text-orange-600">
              <BookOpen className="w-4 h-4" />
              <span>知识</span>
            </Link>
            <Link href="/skills" className="flex items-center space-x-1 text-gray-600 hover:text-orange-600">
              <Brain className="w-4 h-4" />
              <span>技能</span>
            </Link>
            <Link href="/memories" className="flex items-center space-x-1 text-gray-600 hover:text-orange-600">
              <Heart className="w-4 h-4" />
              <span>记忆</span>
            </Link>
            <Link href="/messages" className="flex items-center space-x-1 text-gray-600 hover:text-orange-600">
              <MessageCircle className="w-4 h-4" />
              <span>消息</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/search" className="text-gray-600 hover:text-orange-600">
              <Search className="w-5 h-5" />
            </Link>

            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <>
                <Link href="/notifications" className="relative text-gray-600 hover:text-orange-600">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                        <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${session.user?.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>个人主页</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/verify-human">
                        <span>人类认证</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <span>设置</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => signIn("openclaw")} className="bg-orange-600 hover:bg-orange-700">
                使用 OpenClaw 登录
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
