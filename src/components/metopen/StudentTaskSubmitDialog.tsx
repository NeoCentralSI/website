import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { metopenService } from "@/services/metopen.service";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import type { MetopenTask } from "@/types/metopen.types";

interface StudentTaskSubmitDialogProps {
    task: MetopenTask;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function StudentTaskSubmitDialog({ task, children, open: controlledOpen, onOpenChange: setControlledOpen }: StudentTaskSubmitDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (setControlledOpen) setControlledOpen(val);
        else setInternalOpen(val);
    };

    const [notes, setNotes] = useState(task.studentNotes || "");
    const [files, setFiles] = useState<File[]>([]);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            await metopenService.submitTask(task.id, {
                notes: notes,
                files: files.length > 0 ? files : undefined,
            });
        },
        onSuccess: () => {
            toast.success("Tugas berhasil dikumpulkan");
            queryClient.invalidateQueries({ queryKey: ["metopen-my-tasks"] });
            queryClient.invalidateQueries({ queryKey: ["metopen-my-gate-status"] });
            setOpen(false);
            setFiles([]);
        },
        onError: (error: any) => {
            toast.error(error.message || "Gagal mengumpulkan tugas");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes && files.length === 0) {
            toast.error("Harap isi catatan atau unggah file dokumen laporan.");
            return;
        }
        mutation.mutate();
    };

    const addFiles = (newFiles: File[]) => {
        setFiles((prev) => {
            const combined = [...prev, ...newFiles].slice(0, 10);
            if (combined.length > 10) toast.error("Maksimal 10 dokumen per pengumpulan");
            return combined.slice(0, 10);
        });
    };

    const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Kumpulkan: {task.title}</DialogTitle>
                        <DialogDescription>
                            Silakan unggah dokumen penyelesaian tugas dan/atau tambahkan catatan untuk dosen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Dokumen Laporan</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="file"
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        const selected = e.target.files;
                                        if (selected?.length) {
                                            const valid: File[] = [];
                                            for (const f of Array.from(selected)) {
                                                if (f.size > 5 * 1024 * 1024) {
                                                    toast.error(`File "${f.name}" melebihi 5MB`);
                                                    continue;
                                                }
                                                valid.push(f);
                                            }
                                            if (valid.length) addFiles(valid);
                                        }
                                        e.target.value = "";
                                    }}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-dashed"
                                    onClick={() => document.getElementById("file")?.click()}
                                    disabled={files.length >= 10}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {files.length >= 10 ? "Maksimal 10 dokumen" : "Pilih File (maks. 10)"}
                                </Button>
                                {files.length > 0 && (
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {files.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                                <span className="truncate flex-1">{f.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 shrink-0 text-red-500"
                                                    onClick={() => removeFile(i)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Opsional. Maksimal 10 dokumen, masing-masing 5MB</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan Mahasiswa</Label>
                            <Textarea
                                id="notes"
                                placeholder="Tuliskan laporan progres atau keterangan tambahan..."
                                className="resize-none"
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {task.description && (
                            <div className="p-3 bg-muted/50 rounded-md mt-2">
                                <span className="text-xs font-semibold">Instruksi Tugas:</span>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{task.description}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={mutation.isPending}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Mengirim..." : "Kumpulkan Tugas"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
