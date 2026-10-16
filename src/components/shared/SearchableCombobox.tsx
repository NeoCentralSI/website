import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  /** Shown in the list and, when selected, on the trigger. */
  label: string;
  /** Extra text the search matches (e.g. NIM, NIP). The label is always matched. */
  keywords?: string[];
  /** Short muted text at the right of the option (e.g. a lecturer's supervision load). */
  detail?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  /** Accessible name of the trigger. */
  ariaLabel: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Trigger text when `value` is not among `options` (e.g. options still loading). */
  fallbackLabel?: string;
  className?: string;
}

/** Every typed word must appear in the option's label or keywords (no fuzzy matching). */
function matchesEveryWord(_value: string, search: string, keywords?: string[]): number {
  const haystack = (keywords ?? []).join(" ").toLowerCase();
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => haystack.includes(word)) ? 1 : 0;
}

/**
 * Select with a search box (`Popover` + `Command`, the pattern of the topic picker in
 * `TemplateManagementPanel`). The list scrolls inside at most 280 px; the popover opens to the
 * side that fits the screen (Radix flips it) and is modal so that it also scrolls inside a
 * dialog.
 */
export function SearchableCombobox({
  options,
  value,
  onChange,
  ariaLabel,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Tidak ditemukan.",
  disabled,
  fallbackLabel,
  className,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const triggerText = selected?.label ?? fallbackLabel;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn("w-full min-w-0 justify-between font-normal", !triggerText && "text-muted-foreground", className)}
        >
          <span className="min-w-0 truncate">{triggerText ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command filter={matchesEveryWord}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label, ...(option.keywords ?? [])]}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check className={cn("h-4 w-4 shrink-0", option.value === value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.detail && <span className="shrink-0 text-xs text-muted-foreground">{option.detail}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
