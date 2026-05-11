import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ComboBox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CplStudentScore } from '@/services/master-data/cpl.service';

interface CplStudentScoreFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: CplStudentScore | null;
    onCreate: (payload: { studentId: string; score: number; status: string }) => Promise<unknown>;
    onUpdate: (studentId: string, score: number, status: string) => Promise<unknown>;
    isSubmitting: boolean;
    studentOptions: Array<{ value: string; label: string }>;
}

export function CplStudentScoreFormDialog({
    open,
    onOpenChange,
    editData,
    onCreate,
    onUpdate,
    isSubmitting,
    studentOptions,
}: CplStudentScoreFormDialogProps) {
    const isEdit = Boolean(editData);
    const isSiaData = String(editData?.source).toUpperCase() === 'SIA';

    const [studentId, setStudentId] = useState('');
    const [score, setScore] = useState<number | ''>('');
    const [status, setStatus] = useState<string>('finalized');

    useEffect(() => {
        if (editData) {
            setStudentId(editData.studentId);
            setScore(editData.score);
            setStatus(editData.status || 'finalized');
        } else {
            setStudentId('');
            setScore('');
            setStatus('finalized');
        }
    }, [editData, open]);

    const isValid =
        studentId.trim().length > 0 &&
        score !== '' &&
        Number(score) >= 0 &&
        Number(score) <= 100;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid || isSiaData) return;

        if (isEdit && editData) {
            await onUpdate(editData.studentId, Number(score), status);
        } else {
            await onCreate({ studentId: studentId.trim(), score: Number(score), status });
        }

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Ubah Nilai CPL Mahasiswa' : 'Tambah Nilai CPL Mahasiswa'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="studentId">Mahasiswa</Label>
                        {isEdit ? (
                            <Input
                                id="studentName"
                                value={`${editData?.student?.fullName || '-'} (${editData?.student?.identityNumber || '-'})`}
                                disabled
                            />
                        ) : (
                            <ComboBox
                                width="w-full"
                                items={studentOptions}
                                defaultValue={studentId}
                                onChange={setStudentId}
                                placeholder="Cari nama atau NIM mahasiswa"
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="score">Skor</Label>
                        <Input
                            id="score"
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={isSiaData}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus} disabled={isSiaData}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="calculated">Dihitung</SelectItem>
                                <SelectItem value="verified">Diverifikasi</SelectItem>
                                <SelectItem value="finalized">Final</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isSiaData && (
                        <p className="text-xs text-muted-foreground">
                            Data dari SIA bersifat immutable dan tidak dapat diubah manual.
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isValid || isSiaData}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menyimpan...
                                </>
                            ) : isEdit ? (
                                'Simpan'
                            ) : (
                                'Tambah'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
