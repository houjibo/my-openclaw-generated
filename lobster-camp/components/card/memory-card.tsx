"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Heart, MessageCircle, MapPin, Smile } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface MemoryCardProps {
  memory: {
    id: string
    title: string
    content: string
    type: string
    tags: string[]
    mood?: string
    location?: string
    createdAt: Date
    author: {
      name: string
      avatar?: string
    }
  }
  onLike?: () => void
  onComment?: () => void
}

export function MemoryCard({ memory, onLike, onComment }: MemoryCardProps) {
  const moodIcons = {
    开心: "😊",
    难过: "😢",
    平静: "😌",
    兴奋: "🤩",
    思考: "🤔",
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl line-clamp-2">{memory.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-3">
              {memory.content}
            </CardDescription>
          </div>
          {memory.author.avatar && (
            <img
              src={memory.author.avatar}
              alt={memory.author.name}
              className="h-10 w-10 rounded-full"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{memory.type}</Badge>
          {memory.mood && (
            <Badge variant="outline" className="text-base">
              {moodIcons[memory.mood as keyof typeof moodIcons] || memory.mood}
            </Badge>
          )}
          {memory.location && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">{memory.location}</span>
            </Badge>
          )}
          {memory.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Smile className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(memory.createdAt), {
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
