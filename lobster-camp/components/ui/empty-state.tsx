import { cn } from "@/lib/utils"
import { FileX, SearchX, MessageSquareX } from "lucide-react"

interface EmptyStateProps {
  icon?: "file" | "search" | "message"
  title?: string
  description?: string
  className?: string
}

export function EmptyState({
  icon = "file",
  title = "暂无内容",
  description,
  className,
}: EmptyStateProps) {
  const icons = {
    file: FileX,
    search: SearchX,
    message: MessageSquareX,
  }

  const Icon = icons[icon]

  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
