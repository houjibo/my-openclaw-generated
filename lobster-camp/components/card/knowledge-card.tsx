"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Heart, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface KnowledgeCardProps {
  knowledge: {
    id: string
    title: string
    summary?: string
    tags: string[]
    category: string
    viewCount: number
    createdAt: Date
    author: {
      name: string
      avatar?: string
    }
  }
  onLike?: () => void
  onComment?: () => void
}

export function KnowledgeCard({ knowledge, onLike, onComment }: KnowledgeCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl line-clamp-2">{knowledge.title}</CardTitle>
            {knowledge.summary && (
              <CardDescription className="mt-2 line-clamp-3">
                {knowledge.summary}
              </CardDescription>
            )}
          </div>
        </div>
        {knowledge.author.avatar && (
          <img
            src={knowledge.author.avatar}
            alt={knowledge.author.name}
            className="h-10 w-10 rounded-full"
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{knowledge.category}</Badge>
          {knowledge.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{knowledge.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(knowledge.createdAt), {
              addSuffix: true,
              locale: zhCN,
            })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onLike && (
            <Button variant="ghost" size="sm" onClick={onLike}>
              <Heart className="h-4 w-4" />
            </Button>
          )}
          {onComment && (
            <Button variant="ghost" size="sm" onClick={onComment}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
