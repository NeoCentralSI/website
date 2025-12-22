import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Common time slots for guidance sessions
const TIME_PRESETS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00",
];

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

  // Format label in Indonesian style
  const label = React.useMemo(() => {
    if (!date || !time) return placeholder;
    try {
      const [hh, mm] = time.split(":");
      const preview = new Date(date);
      preview.setHours(Number(hh), Number(mm), 0, 0);
      
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      
      const dayName = days[preview.getDay()];
      const day = preview.getDate();
      const month = months[preview.getMonth()];
      const year = preview.getFullYear();
      const timeStr = `${hh}:${mm}`;
      
      return `${dayName}, ${day} ${month} ${year} • ${timeStr} WIB`;
    } catch {
      return placeholder;
    }
  }, [date, time, placeholder]);

  // Check if a time preset is valid (not in the past)
  const isTimeValid = (t: string): boolean => {
    if (!date || !min) return true;
    const [hh, mm] = t.split(":").map((v) => parseInt(v || "0", 10));
    const testDate = new Date(date);
    testDate.setHours(hh, mm, 0, 0);
    return testDate >= min;
  };

  // Calculate min date for calendar
  const minDate = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()) : undefined;

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
      <PopoverContent className="p-0 w-auto" align="start">
        <div className="flex">
          {/* Calendar */}
          <div className="p-3 border-r">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              onSelect={(d) => { 
                setDate(d || null); 
                // Auto-select 09:00 if no time selected
                if (d && !time) {
                  const defaultTime = "09:00";
                  setTime(defaultTime);
                  commit(d, defaultTime);
                } else {
                  commit(d || null, time); 
                }
              }}
              disabled={(d) => minDate ? d < minDate : false}
              initialFocus
            />
          </div>
          
          {/* Time Selection */}
          <div className="p-3 w-36">
            <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              Waktu
            </div>
            
            {/* Time presets */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {TIME_PRESETS.map((t) => {
                const isValid = isTimeValid(t);
                const isSelected = time === t;
                return (
                  <Button
                    key={t}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs h-8",
                      !isValid && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!isValid}
                    onClick={() => { 
                      setTime(t); 
                      commit(date, t); 
                    }}
                  >
                    {t}
                  </Button>
                );
              })}
            </div>
            
            {/* Custom time input */}
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Waktu lain:</div>
              <input
                type="time"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={time}
                onChange={(e) => { 
                  setTime(e.target.value); 
                  commit(date, e.target.value); 
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Confirm button */}
        {date && time && (
          <div className="p-3 pt-0 border-t mt-0">
            <Button
              type="button"
              className="w-full"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Pilih
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
