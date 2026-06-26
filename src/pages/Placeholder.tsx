import { Construction } from "lucide-react"

type PlaceholderProps = {
  title: string
  description?: string
}

/**
 * Generic "Coming Soon" page for routes that are intentionally not yet
 * implemented. Used so menu items don't 404, while making the unfinished
 * status visually obvious to users (no blank screen surprise).
 */
export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Construction className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {description ?? "Halaman ini belum tersedia. Fitur sedang dalam pengembangan."}
        </p>
      </div>
    </div>
  )
}

