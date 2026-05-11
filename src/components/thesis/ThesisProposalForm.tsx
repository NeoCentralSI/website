import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Send, FileText } from "lucide-react";
import { proposeThesis } from "@/services/studentGuidance.service";
import { toast } from "sonner";

export function ThesisProposalForm() {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");

    const mutation = useMutation({
        mutationFn: () => proposeThesis({ title }),
        onSuccess: (data) => {
            toast.success(data.thesis.message || "Proposal berhasil diajukan");
            queryClient.invalidateQueries({ queryKey: ["my-thesis-detail"] });
            queryClient.invalidateQueries({ queryKey: ["student-supervisors"] });
            queryClient.invalidateQueries({ queryKey: ["student-thesis-history"] });
            setTitle("");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Gagal mengajukan proposal");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Judul tugas akhir wajib diisi");
            return;
        }
        mutation.mutate();
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Ajukan Judul Baru</CardTitle>
                        <CardDescription>
                            Ajukan judul tugas akhir baru. Dosen pembimbing akan disalin dari penugasan sebelumnya.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="thesis-title" className="text-sm font-medium mb-1.5 block">
                            Judul Tugas Akhir
                        </label>
                        <Input
                            id="thesis-title"
                            placeholder="Masukkan judul tugas akhir baru..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={mutation.isPending}
                        />
                    </div>
                    <Button type="submit" disabled={!title.trim() || mutation.isPending}>
                        {mutation.isPending ? (
                            <>
                                <Spinner className="mr-2" /> Mengajukan...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" /> Ajukan Proposal
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
