import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StudentCplScore } from "@/services/master-data/student-cpl-score.service";

interface StudentCplScoreFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: StudentCplScore | null;
    onCreate: (payload: { studentId: string; cplId: string; score: number }) => Promise<unknown>;
    onUpdate: (studentId: string, cplId: string, payload: { score: number }) => Promise<unknown>;
    isSubmitting: boolean;
    studentOptions: Array<{ id: string; label: string }>;
    cplOptions: Array<{ id: string; label: string }>;
}

export function StudentCplScoreFormDialog({
    open,
    onOpenChange,
    editData,
    onCreate,
    onUpdate,
    isSubmitting,
    studentOptions,
    cplOptions,
}: StudentCplScoreFormDialogProps) {
    const isEdit = Boolean(editData);
    const isSiaData = String(editData?.source).toUpperCase() === "SIA";

    const [studentId, setStudentId] = useState("");
    const [cplId, setCplId] = useState("");
    const [score, setScore] = useState<number | "">("");

    useEffect(() => {
        if (editData) {
            setStudentId(editData.studentId);
            setCplId(editData.cplId);
            setScore(editData.score);
        } else {
            setStudentId("");
            setCplId("");
            setScore("");
        }
    }, [editData, open]);

    const isValid =
        studentId.trim().length > 0 &&
        cplId.trim().length > 0 &&
        score !== "" &&
        Number(score) >= 0 &&
        Number(score) <= 100;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isValid || isSiaData) return;

        if (isEdit && editData) {
            await onUpdate(editData.studentId, editData.cplId, { score: Number(score) });
        } else {
            await onCreate({ studentId: studentId.trim(), cplId: cplId.trim(), score: Number(score) });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Ubah Nilai CPL Manual" : "Tambah Nilai CPL Manual"}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="studentId">Mahasiswa</Label>
                        <Select
                            value={studentId}
                            onValueChange={setStudentId}
                            disabled={isEdit}
                        >
                            <SelectTrigger id="studentId">
                                <SelectValue placeholder="Pilih mahasiswa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {studentOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cplId">CPL</Label>
                        <Select
                            value={cplId}
                            onValueChange={setCplId}
                            disabled={isEdit}
                        >
                            <SelectTrigger id="cplId">
                                <SelectValue placeholder="Pilih CPL..." />
                            </SelectTrigger>
                            <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                                {cplOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id} className="max-w-full whitespace-normal">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="score">Skor</Label>
                        <Input
                            id="score"
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={isSiaData}
                            required
                        />
                    </div>

                    {isSiaData && (
                        <p className="text-xs text-muted-foreground">
                            Data dengan source SIA bersifat immutable dan tidak dapat diubah.
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
                                "Simpan"
                            ) : (
                                "Tambah"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
