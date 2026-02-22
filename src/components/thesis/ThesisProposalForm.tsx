import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTopics } from "@/services/topic.service";
import { proposeThesisAPI } from "@/services/studentGuidance.service";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";

const formSchema = z.object({
    title: z.string().min(10, "Judul minimal 10 karakter"),
    topicId: z.string().min(1, "Topik harus dipilih"),
});

export function ThesisProposalForm() {
    const queryClient = useQueryClient();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const { data: topics, isLoading: isLoadingTopics } = useQuery({
        queryKey: ["topics"],
        queryFn: getTopics,
    });

    const mutation = useMutation({
        mutationFn: proposeThesisAPI,
        onSuccess: () => {
            toast.success("Judul berhasil diajukan");
            queryClient.invalidateQueries({ queryKey: ["my-thesis-detail"] });
            queryClient.invalidateQueries({ queryKey: ["student-thesis-history"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        mutation.mutate(data);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-primary">Pengajuan Judul Tugas Akhir Baru</CardTitle>
                <CardDescription>
                    Silakan ajukan judul baru untuk memulai kembali proses pengerjaan Tugas Akhir.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Informasi Penting</AlertTitle>
                    <AlertDescription>
                        Dosen Pembimbing akan <strong>disalin secara otomatis</strong> dari Tugas Akhir Anda sebelumnya. Anda tidak perlu memilih pembimbing lagi.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Tugas Akhir</Label>
                        <Input
                            id="title"
                            placeholder="Masukkan judul tugas akhir..."
                            {...register("title")}
                        />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topic">Topik</Label>
                        <Select onValueChange={(val) => setValue("topicId", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih topik" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingTopics ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Memuat topik...</div>
                                ) : (
                                    Array.isArray(topics) && topics.map((topic: any) => (
                                        <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.topicId && <p className="text-sm text-destructive">{errors.topicId.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ajukan Judul
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
