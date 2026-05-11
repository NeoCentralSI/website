import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  indeterminate,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { indeterminate?: boolean }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={indeterminate ? 'indeterminate' : props.checked}
      className={cn(
        "peer border-gray-300 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:border-primary focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-5 shrink-0 rounded-md border shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        {indeterminate ? (
          <MinusIcon className="size-3.5" />
        ) : (
          <CheckIcon className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
