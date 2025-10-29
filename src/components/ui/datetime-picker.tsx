import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateTimePickerProps = {
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: Date; // optional minimum date/time
};

export function DateTimePicker({ value, onChange, placeholder = "Pilih tanggal & waktu", disabled, className, min }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | null>(value || null);
  const [time, setTime] = React.useState<string>(() => {
    if (!value) return "";
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  });

  React.useEffect(() => {
    if (!value) return;
    setDate(value);
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    setTime(`${hh}:${mm}`);
  }, [value?.getTime?.()]);

  const commit = (d: Date | null, t: string) => {
    if (!d || !t) {
      onChange?.(null);
      return;
    }
    const [hh, mm] = t.split(":").map((v) => parseInt(v || "0", 10));
    const next = new Date(d);
    next.setHours(hh || 0, mm || 0, 0, 0);
    if (min && next < min) return; // ignore invalid
    onChange?.(next);
  };

  const label = React.useMemo(() => {
    if (!date || !time) return placeholder;
    try {
      const [hh, mm] = time.split(":");
      const preview = new Date(date);
      preview.setHours(Number(hh), Number(mm), 0, 0);
      return preview.toLocaleString();
    } catch {
      return placeholder;
    }
  }, [date, time, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("justify-start text-left font-normal w-full", !date || !time ? "text-muted-foreground" : "", className)}
        >
          <CalendarIcon className="mr-2 size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-3 w-auto" align="start">
        <div className="flex flex-col gap-3">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={(d) => { setDate(d || null); commit(d || null, time); }}
            initialFocus
          />
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 text-muted-foreground" />
            <input
              type="time"
              className="h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={time}
              onChange={(e) => { setTime(e.target.value); commit(date, e.target.value); }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
