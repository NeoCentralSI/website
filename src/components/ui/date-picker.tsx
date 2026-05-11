import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    showPastDates?: boolean
    minDate?: Date
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pilih tanggal",
    className,
    disabled,
    showPastDates = false,
    minDate
}: DatePickerProps) {
    const today = new Date(new Date().setHours(0, 0, 0, 0))
    const normalizedMinDate = minDate ? new Date(new Date(minDate).setHours(0, 0, 0, 0)) : undefined

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "d MMM yyyy", { locale: localeId }) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    disabled={(date) => {
                        if (!showPastDates && date < today) return true
                        if (normalizedMinDate && date < normalizedMinDate) return true
                        return false
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
