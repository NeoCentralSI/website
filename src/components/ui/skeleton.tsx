import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-md", className)}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-gray-50/80 to-transparent dark:via-gray-600/50" />
    </div>
  )
}

export { Skeleton }
