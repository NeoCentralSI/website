import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { FileText, Calendar, ArrowLeft, Save, Building2, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getAdminAssignmentLetterDetail, updateAdminAssignmentLetter, type AdminAssignmentProposalItem } from "@/services/internship";
import { toTitleCaseName } from "@/lib/text";
import { DatePicker } from "@/components/ui/date-picker";
import { Users, MapPin, User, Settings2 } from "lucide-react";
import { API_CONFIG } from "@/config/api";

interface LetterFormValues {
    documentNumber: string;
    startDateActual: string;
    endDateActual: string;
}

const ManageAssignmentLetter: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [proposal, setProposal] = useState<AdminAssignmentProposalItem | null>(null);

    const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<LetterFormValues>();
    const watchDates = watch(["startDateActual", "endDateActual"]);

    const calculateBusinessDays = (startStr: string, endStr: string) => {
        if (!startStr || !endStr) return 0;
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        if (start > end) return 0;

        let count = 0;
        const curDate = new Date(start.getTime());
        while (curDate <= end) {
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    };

    const businessDays = calculateBusinessDays(watchDates[0], watchDates[1]);

    useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id]);


    const fetchDetail = async () => {
        try {
            setLoading(true);
            const res = await getAdminAssignmentLetterDetail(id!);
            setProposal(res.data);

            const formatDate = (dateStr: string | null) => {
                if (!dateStr) return "";
                return new Date(dateStr).toISOString().split('T')[0];
            };

            reset({
                documentNumber: res.data.letterNumber === "—" ? "" : res.data.letterNumber,
                startDateActual: formatDate(res.data.period?.start || null),
                endDateActual: formatDate(res.data.period?.end || null)
            });
        } catch (error: any) {
            toast.error(error.message || "Gagal memuat detail pengajuan");
            navigate("/admin/kerja-praktik/surat-tugas");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (values: LetterFormValues) => {
        try {
            setSubmitting(true);
            await updateAdminAssignmentLetter(id!, values);
            toast.success("Data berhasil disimpan", {
                description: "Preview dokumen akan diperbarui..."
            });
            // Reload data to refresh preview
            await fetchDetail();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = () => {
        if (!proposal?.letterFile) return;
        const fileUrl = `${API_CONFIG.BASE_URL}/${proposal.letterFile.filePath}`;
        const link = document.createElement("a");
        link.href = fileUrl;

        const fileName = proposal.letterFile.fileName || "Surat_Tugas.pdf";
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-[250px]" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-[300px] mb-2" />
                        <Skeleton className="h-4 w-[200px]" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!proposal) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate("/admin/kerja-praktik/surat-tugas")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight pt-2">Kelola Surat Tugas</h1>
                    <p className="text-muted-foreground text-sm">Update nomor surat dan rentang waktu pelaksanaan magang</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3 text-base">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="h-4 w-4" />
                                Informasi Perusahaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">{proposal.companyName}</h3>
                                <div className="flex items-start gap-2 text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4 mt-1 shrink-0" />
                                    <p className="text-sm">{proposal.companyAddress || "Alamat perusahaan tidak tersedia"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 text-base">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                Anggota Kelompok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {proposal.members.map((m: { id: string; name: string; nim: string; status: string; role: string; isCoordinator: boolean }, idx: number) => {
                                    const isCoordinator = m.isCoordinator;
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCoordinator ? "bg-primary/5 border-primary/20" : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-10 w-10 rounded-full flex items-center justify-center ${isCoordinator ? "bg-primary/10" : "bg-muted"
                                                        }`}
                                                >
                                                    <User
                                                        className={`h-5 w-5 ${isCoordinator ? "text-primary" : "text-muted-foreground"
                                                            }`}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{toTitleCaseName(m.name)}</p>
                                                    <p className="text-xs text-muted-foreground">{m.nim}</p>
                                                </div>
                                            </div>
                                            {isCoordinator && (
                                                <Badge variant="default" className="text-[10px]">
                                                    KOORDINATOR
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Identitas Surat & Periode Pelaksanaan
                            </CardTitle>
                            <CardDescription>Data ini akan digunakan untuk proses generate Dokumen Surat Tugas Kerja Praktik.</CardDescription>
                        </CardHeader>
                        <Separator className="opacity-50" />
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {proposal.isSigned && (
                                    <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-amber-800 animate-in slide-in-from-top duration-300">
                                        <Info className="h-5 w-5 shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-bold">Dokumen Telah Ditandatangani</p>
                                            <p className="opacity-90">Surat tugas ini sudah ditandatangani oleh Kadep, sehingga data tidak dapat diubah kembali untuk menjaga validitas tanda tangan digital.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="documentNumber">No. Surat Tugas</Label>
                                    <Input
                                        id="documentNumber"
                                        placeholder="Contoh: 123/UN27.02.1/PP/2024"
                                        className="font-mono bg-muted/30"
                                        disabled={proposal.isSigned}
                                        {...register("documentNumber", { required: "Nomor surat wajib diisi" })}
                                    />
                                    {errors.documentNumber && (
                                        <p className="text-xs text-destructive">{errors.documentNumber.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDateActual" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Tanggal Mulai Pelaksanaan
                                        </Label>
                                        <Controller
                                            name="startDateActual"
                                            control={control}
                                            rules={{ required: "Tanggal mulai wajib diisi" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value) : undefined}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                                    disabled={proposal.isSigned}
                                                />
                                            )}
                                        />
                                        {errors.startDateActual && (
                                            <p className="text-xs text-destructive">{errors.startDateActual.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDateActual" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Tanggal Selesai Pelaksanaan
                                        </Label>
                                        <Controller
                                            name="endDateActual"
                                            control={control}
                                            rules={{ required: "Tanggal selesai wajib diisi" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value) : undefined}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                                    disabled={proposal.isSigned}
                                                />
                                            )}
                                        />
                                        {errors.endDateActual && (
                                            <p className="text-xs text-destructive">{errors.endDateActual.message}</p>
                                        )}
                                    </div>
                                </div>

                                {watchDates[0] && watchDates[1] && (
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                                <Calendar className="h-4 w-4" />
                                                Durasi Pelaksanaan
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-bold text-lg">{businessDays}</span>
                                                <span className="ml-1 text-muted-foreground">Hari Kerja</span>
                                            </div>
                                        </div>

                                        {businessDays < 30 && (
                                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-amber-800 animate-in shake duration-500">
                                                <Info className="h-5 w-5 shrink-0" />
                                                <div className="text-xs">
                                                    <p className="font-bold">Peringatan: Durasi Kurang</p>
                                                    <p className="opacity-90">Total hari kerja kurang dari 30 hari (Minimal standar KP). Pastikan rentang waktu sudah sesuai dengan kebijakan.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-end gap-3 pt-2">
                                    {!proposal.isSigned ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => navigate('/admin/kerja-praktik/surat-tugas/template')}
                                                disabled={submitting}
                                            >
                                                <Settings2 className="h-4 w-4 mr-2" />
                                                Sesuaikan Template
                                            </Button>
                                            <Button type="submit" className="min-w-[120px]" disabled={submitting}>
                                                {submitting ? (
                                                    <>
                                                        <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        Menyimpan...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Simpan & Generate
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="py-2 px-4 bg-muted border-dashed text-muted-foreground uppercase tracking-widest text-[10px]">
                                            <Check className="h-3 w-3 mr-2 text-green-600" />
                                            Sudah Ditandatangani
                                        </Badge>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {proposal.letterFile && (
                        <Card className="border overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Preview Dokumen
                                    </CardTitle>
                                    <CardDescription>
                                        Dokumen yang telah digenerate sistem.
                                    </CardDescription>
                                </div>
                                <Button size="sm" onClick={handleDownload}>
                                    Download PDF
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 bg-gray-100 min-h-[500px] relative">
                                {proposal.letterFile && (
                                    <iframe
                                        title="Letter Preview"
                                        src={`${API_CONFIG.BASE_URL}/${proposal.letterFile.filePath}`}
                                        className="w-full"
                                        style={{ height: 'calc(100vh - 400px)', minHeight: '600px', border: 'none' }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageAssignmentLetter;
