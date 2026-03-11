import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive"
  className?: string
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
