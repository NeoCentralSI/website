import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { FileText, Calendar, ArrowLeft, Save, Users, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getSekdepSupervisorLetterDetail, updateSekdepSupervisorLetter, type SekdepSupervisorLetterDetail } from "@/services/internship.service";
import { toTitleCaseName } from "@/lib/text";
import { DatePicker } from "@/components/ui/date-picker";
import { API_CONFIG } from "@/config/api";

interface LetterFormValues {
    documentNumber: string;
    startDate: string;
    endDate: string;
    internshipIds: string[];
}

export default function LecturerWorkloadManageLetter() {
    const { supervisorId } = useParams<{ supervisorId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [detail, setDetail] = useState<SekdepSupervisorLetterDetail | null>(null);

    const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<LetterFormValues>({
        defaultValues: {
            internshipIds: []
        }
    });

    const watchDates = watch(["startDate", "endDate"]);
    const watchInternshipIds = watch("internshipIds") || [];

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
        if (supervisorId) {
            fetchDetail();
        }
    }, [supervisorId]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const res = await getSekdepSupervisorLetterDetail(supervisorId!);
            setDetail(res.data);

            const formatDate = (dateStr: string | null) => {
                if (!dateStr) return "";
                return new Date(dateStr).toISOString().split('T')[0];
            };

            // Pre-fill form based on first selected item if exists (can be improved)
            // Just defaults for now, let's select all active students
            reset({
                documentNumber: "",
                startDate: "",
                endDate: "",
                internshipIds: res.data.assignedStudents.map((s: any) => s.internshipId)
            });

            // Try to prefill dates if available on any student
            const studentWithDates = res.data.assignedStudents.find(s => s.documents.supLetterStartDate);
            if (studentWithDates) {
                setValue('startDate', formatDate(studentWithDates.documents.supLetterStartDate));
                setValue('endDate', formatDate(studentWithDates.documents.supLetterEndDate));
            }
        } catch (error: any) {
            toast.error(error.message || "Gagal memuat detail bimbingan");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (values: LetterFormValues) => {
        if (values.internshipIds.length === 0) {
            toast.error("Silakan pilih minimal satu mahasiswa");
            return;
        }

        try {
            setSubmitting(true);
            await updateSekdepSupervisorLetter(supervisorId!, values);
            toast.success("Dokumen berhasil di-generate and disimpan", {
                description: "Preview akan diperbarui."
            });
            await fetchDetail();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (!detail) return;
        if (checked) {
            setValue("internshipIds", detail.assignedStudents.map(s => s.internshipId));
        } else {
            setValue("internshipIds", []);
        }
    };

    // Find the current active document to preview
    // Simplification: we show the document of the first currently selected student that has a document
    const previewDoc = useMemo(() => {
        if (!detail) return null;
        for (const id of watchInternshipIds) {
            const student = detail.assignedStudents.find((s: any) => s.internshipId === id);
            if (student && student.documents.supLetterFile) {
                return student.documents.supLetterFile;
            }
        }
        return null;
    }, [detail, watchInternshipIds]);

    const handleDownload = () => {
        if (!previewDoc) return;
        const fileUrl = `${API_CONFIG.BASE_URL}/${previewDoc.filePath}`;
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = previewDoc.fileName || "Surat_Tugas_Pembimbing.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-[300px]" />
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!detail) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight pt-2">Kelola Surat Tugas Pembimbing</h1>
                    <p className="text-muted-foreground text-sm">
                        {detail.lecturerName} ({detail.lecturerNip})
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3 text-base">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="h-4 w-4" />
                                    Pilih Mahasiswa Bimbingan
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="selectAll"
                                        checked={watchInternshipIds.length === detail.assignedStudents.length && detail.assignedStudents.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="selectAll" className="text-xs cursor-pointer">Pilih Semua</Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {detail.assignedStudents.map((s: any, idx: number) => {
                                    const isSelected = watchInternshipIds.includes(s.internshipId);
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-start gap-3 p-3 border rounded-lg transition-colors cursor-pointer hover:bg-slate-50 ${isSelected ? "bg-primary/5 border-primary/20" : ""
                                                }`}
                                            onClick={() => {
                                                const newIds = isSelected
                                                    ? watchInternshipIds.filter(id => id !== s.internshipId)
                                                    : [...watchInternshipIds, s.internshipId];
                                                setValue("internshipIds", newIds, { shouldValidate: true });
                                            }}
                                        >
                                            <div className="mt-1 shrink-0">
                                                <Checkbox checked={isSelected} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{toTitleCaseName(s.name)}</p>
                                                <div className="flex items-center text-xs text-muted-foreground gap-2 mt-0.5">
                                                    <span>{s.nim}</span>
                                                    <span>&bull;</span>
                                                    <span className="truncate">{s.companyName}</span>
                                                </div>
                                                {s.documents.supLetterDocNumber && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                                            ST Pembimbing: {s.documents.supLetterDocNumber}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {detail.assignedStudents.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Tidak ada mahasiswa bimbingan aktif.</p>
                                )}
                            </div>
                            {errors.internshipIds && (
                                <p className="text-xs text-destructive mt-3 text-center">Silakan pilih minimal satu mahasiswa</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Identitas Surat & Periode Bimbingan
                            </CardTitle>
                            <CardDescription>
                                Masukkan nomor surat dan pilih mahasiswa di panel kiri untuk di-generate secara massal.
                            </CardDescription>
                        </CardHeader>
                        <Separator className="opacity-50" />
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="documentNumber">No. Surat Tugas Pembimbing</Label>
                                    <Input
                                        id="documentNumber"
                                        placeholder="Contoh: 123/UN.ST/Pembimbing/2024"
                                        className="font-mono bg-muted/30"
                                        {...register("documentNumber", { required: "Nomor surat wajib diisi" })}
                                    />
                                    {errors.documentNumber && (
                                        <p className="text-xs text-destructive">{errors.documentNumber.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Tanggal Mulai Bimbingan
                                        </Label>
                                        <Controller
                                            name="startDate"
                                            control={control}
                                            rules={{ required: "Tanggal mulai wajib diisi" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value) : undefined}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                                />
                                            )}
                                        />
                                        {errors.startDate && (
                                            <p className="text-xs text-destructive">{errors.startDate.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Tanggal Selesai Bimbingan
                                        </Label>
                                        <Controller
                                            name="endDate"
                                            control={control}
                                            rules={{ required: "Tanggal selesai wajib diisi" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value) : undefined}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                                                />
                                            )}
                                        />
                                        {errors.endDate && (
                                            <p className="text-xs text-destructive">{errors.endDate.message}</p>
                                        )}
                                    </div>
                                </div>

                                {watchDates[0] && watchDates[1] && (
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                            <Calendar className="h-4 w-4" />
                                            Estimasi Durasi
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-bold text-lg">{businessDays}</span>
                                            <span className="ml-1 text-muted-foreground">Hari Kerja</span>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => navigate('/kelola/kerja-praktik/dosen/template/surat-tugas')}
                                        disabled={submitting}
                                    >
                                        <Settings2 className="h-4 w-4 mr-2" />
                                        Kelola Template
                                    </Button>
                                    <Button type="submit" className="min-w-[120px]" disabled={submitting || watchInternshipIds.length === 0}>
                                        {submitting ? (
                                            <>
                                                <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Simpan & Generate {watchInternshipIds.length > 0 ? `(${watchInternshipIds.length})` : ''}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {previewDoc && (
                        <Card className="border overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Preview Dokumen ST Terakhir
                                    </CardTitle>
                                    <CardDescription>
                                        Surat tugas yang telah di-generate untuk opsi yang dipilih saat ini.
                                    </CardDescription>
                                </div>
                                <Button size="sm" onClick={handleDownload} variant="outline">
                                    Download PDF
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 bg-gray-100 min-h-[500px] relative">
                                <iframe
                                    title="Letter Preview"
                                    src={`${API_CONFIG.BASE_URL}/${previewDoc.filePath}`}
                                    className="w-full"
                                    style={{ height: 'calc(100vh - 400px)', minHeight: '600px', border: 'none' }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
