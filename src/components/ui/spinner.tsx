import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

interface LoadingProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

function Loading({ text = "Memuat...", className, size = "md" }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-8", className)}>
      <Loader2Icon className={cn("animate-spin text-primary", sizeMap[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export { Spinner, Loading }
