"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import * as React from "react"

type ComboBoxItem = {
  value: string;
  label: string;
  disabled?: boolean;
  rightLabel?: React.ReactNode;
}

type ComboBoxProps = {
  items?: ComboBoxItem[]
  placeholder?: string
  onChange?: (value: string) => void
  defaultValue?: string
  width?: string
  disabled?: boolean
  wrap?: boolean
}

export function ComboBox({
  items = [],
  placeholder = "Select an option...",
  onChange,
  defaultValue = "",
  width = "w-50",
  disabled = false,
  wrap = false,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string>(defaultValue)
  const popoverWidth = width === "w-full" ? "w-[var(--radix-popover-trigger-width)]" : width

  React.useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const selectedItem = items.find((item: ComboBoxItem) => item.value === value)

  const handleSelect = (item: ComboBoxItem) => {
    if (item.disabled) return;

    const newValue = item.value === value ? "" : item.value
    setValue(newValue)
    setOpen(false)
    onChange?.(newValue)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            width,
            "justify-between font-normal text-left",
            wrap ? "h-auto py-2 whitespace-normal" : "truncate"
          )}
        >
          <span className={cn(wrap ? "whitespace-normal text-left break-words" : "truncate")}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={`${popoverWidth} p-0`} align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList className="max-h-[min(320px,var(--radix-popover-content-available-height))]">
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={cn(
                    "flex items-center justify-between",
                    item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex items-center flex-1 truncate">
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.rightLabel && (
                    <div className="ml-2 shrink-0">
                      {item.rightLabel}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
