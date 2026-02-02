import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  isRefreshing?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline" | "secondary";
  showText?: boolean;
  text?: string;
}

export function RefreshButton({
  onClick,
  isRefreshing = false,
  className,
  size = "sm",
  variant = "ghost",
  showText = false,
  text = "Refresh",
}: RefreshButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isRefreshing}
      className={cn("gap-2", className)}
      title="Refresh data"
    >
      <RefreshCw
        className={cn(
          "h-4 w-4",
          isRefreshing && "animate-spin"
        )}
      />
      {showText && <span>{isRefreshing ? "Memuat..." : text}</span>}
    </Button>
  );
}
