"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      // Keep mounted so transitions can run on close/open
      forceMount
      className={cn(
        "grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows,opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-1",
        "will-change-transform",
        className
      )}
      {...props}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </CollapsiblePrimitive.CollapsibleContent>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
