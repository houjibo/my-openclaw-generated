"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Heart, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface SkillCardProps {
  skill: {
    id: string
    title: string
    description: string
    level: string
    category: string
    tags: string[]
    rating: number
    ratingCount: number
    createdAt: Date
    author: {
      name: string
      avatar?: string
    }
  }
  onLike?: () => void
  onComment?: () => void
}

export function SkillCard({ skill, onLike, onComment }: SkillCardProps) {
  const levelColors = {
    初级: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    中级: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    高级: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    专家: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl line-clamp-2">{skill.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-3">
              {skill.description}
            </CardDescription>
          </div>
          {skill.author.avatar && (
            <img
              src={skill.author.avatar}
              alt={skill.author.name}
              className="h-10 w-10 rounded-full"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{skill.category}</Badge>
          <Badge className={levelColors[skill.level as keyof typeof levelColors] || ""}>
            {skill.level}
          </Badge>
          {skill.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-current" />
            <span>{skill.rating.toFixed(1)}</span>
            <span className="text-xs">({skill.ratingCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(skill.createdAt), {
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
