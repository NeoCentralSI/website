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
}

export function ComboBox({
  items = [],
  placeholder = "Select an option...",
  onChange,
  defaultValue = "",
  width = "w-50",
  disabled = false,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string>(defaultValue)

  const selectedItem = items.find((item: ComboBoxItem) => item.value === value)

  const handleSelect = (currentValue: string) => {
    const item = items.find(i => i.value === currentValue);
    if (item?.disabled) return;

    const newValue = currentValue === value ? "" : currentValue
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
          className={`${width} justify-between truncate`}
        >
          <span className="truncate">{selectedItem ? selectedItem.label : placeholder}</span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={`${width} p-0`}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={handleSelect}
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
