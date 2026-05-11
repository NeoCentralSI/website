import { useState, useCallback, useEffect } from "react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  defaultTime?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal & waktu",
  className,
  disabled,
  defaultTime = "23:59",
}: DateTimePickerProps) {
  const [timeValue, setTimeValue] = useState(() => {
    if (value) {
      const h = String(value.getHours()).padStart(2, "0")
      const m = String(value.getMinutes()).padStart(2, "0")
      return `${h}:${m}`
    }
    return defaultTime
  })

  useEffect(() => {
    if (value) {
      const h = String(value.getHours()).padStart(2, "0")
      const m = String(value.getMinutes()).padStart(2, "0")
      setTimeValue(`${h}:${m}`)
    }
  }, [value])

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange?.(undefined)
        return
      }
      const [hours, minutes] = timeValue.split(":").map(Number)
      date.setHours(hours || 23, minutes ?? 59, 0, 0)
      onChange?.(new Date(date))
    },
    [onChange, timeValue],
  )

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value
      setTimeValue(newTime)
      if (value && newTime) {
        const [hours, minutes] = newTime.split(":").map(Number)
        const updated = new Date(value)
        updated.setHours(hours || 0, minutes || 0, 0, 0)
        onChange?.(updated)
      }
    },
    [onChange, value],
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value
            ? format(value, "d MMM yyyy, HH:mm", { locale: localeId })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="h-8 w-28 text-sm"
          />
          <span className="text-xs text-muted-foreground">WIB</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
