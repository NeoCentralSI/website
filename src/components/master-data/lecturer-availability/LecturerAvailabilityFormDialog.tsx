import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { LecturerAvailability, CreateAvailabilityPayload, UpdateAvailabilityPayload } from '@/services/master-data/lecturer-availability.service';

const DAY_OPTIONS = [
    { value: 'monday', label: 'Senin' },
    { value: 'tuesday', label: 'Selasa' },
    { value: 'wednesday', label: 'Rabu' },
    { value: 'thursday', label: 'Kamis' },
    { value: 'friday', label: 'Jumat' },
];

/** Calendar day in local timezone as YYYY-MM-DD (avoids UTC shift from toISOString()). */
function toDateOnlyLocalString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD for DatePicker display at local noon (stable across DST). */
function parseDateOnlyLocal(ymd: string): Date | undefined {
    if (!ymd) return undefined;
    const base = ymd.split('T')[0];
    const [y, m, d] = base.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function formatTimeForInput(dateStr: string): string {
    const date = new Date(dateStr);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDateForInput(dateStr: string): string {
    return dateStr.split('T')[0];
}

interface AvailabilityFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: LecturerAvailability | null;
    onSubmit: ((data: CreateAvailabilityPayload) => Promise<unknown>) | ((id: string, data: UpdateAvailabilityPayload) => Promise<unknown>);
}

export function LecturerAvailabilityFormDialog({
    open,
    onOpenChange,
    editData,
    onSubmit,
}: AvailabilityFormDialogProps) {
    const [day, setDay] = useState('monday');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('12:00');
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = !!editData;

    useEffect(() => {
        if (editData) {
            setDay(editData.day);
            setStartTime(formatTimeForInput(editData.startTime));
            setEndTime(formatTimeForInput(editData.endTime));
            setValidFrom(formatDateForInput(editData.validFrom));
            setValidUntil(formatDateForInput(editData.validUntil));
        } else {
            setDay('monday');
            setStartTime('08:00');
            setEndTime('12:00');
            setValidFrom('');
            setValidUntil('');
        }
    }, [editData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { day, startTime, endTime, validFrom, validUntil };
            if (isEdit && editData) {
                await (onSubmit as (id: string, data: UpdateAvailabilityPayload) => Promise<unknown>)(editData.id, payload);
            } else {
                await (onSubmit as (data: CreateAvailabilityPayload) => Promise<unknown>)(payload);
            }
            onOpenChange(false);
        } catch {
            // Error handled by hook toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = day && startTime && endTime && validFrom && validUntil;

    const minValidFromForEdit = isEdit && editData ? parseDateOnlyLocal(formatDateForInput(editData.validFrom)) : undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Jadwal Ketersediaan' : 'Tambah Jadwal Ketersediaan'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="day">Hari</Label>
                        <Select value={day} onValueChange={setDay}>
                            <SelectTrigger id="day">
                                <SelectValue placeholder="Pilih hari" />
                            </SelectTrigger>
                            <SelectContent>
                                {DAY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Waktu Mulai</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">Waktu Selesai</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="validFrom">Berlaku Dari</Label>
                            <DatePicker
                                value={parseDateOnlyLocal(validFrom)}
                                onChange={(date) => setValidFrom(date ? toDateOnlyLocalString(date) : '')}
                                showPastDates={isEdit}
                                minDate={isEdit ? minValidFromForEdit : new Date()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="validUntil">Berlaku Hingga</Label>
                            <DatePicker
                                value={parseDateOnlyLocal(validUntil)}
                                onChange={(date) => setValidUntil(date ? toDateOnlyLocalString(date) : '')}
                                showPastDates={true}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {isEdit ? 'Menyimpan...' : 'Menambahkan...'}
                                </>
                            ) : (
                                isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
