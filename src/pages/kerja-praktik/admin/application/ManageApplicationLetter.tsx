import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileText, Calendar, ArrowLeft, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getAdminProposalLetterDetail, updateAdminProposalLetter, type AdminApprovedProposalItem } from "@/services/internship.service";
import { toTitleCaseName } from "@/lib/text";
import { Users, MapPin, User } from "lucide-react";

interface LetterFormValues {
    documentNumber: string;
    startDatePlanned: string;
    endDatePlanned: string;
}

const ManageApplicationLetter: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [proposal, setProposal] = useState<AdminApprovedProposalItem | null>(null);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LetterFormValues>();
    const watchDates = watch(["startDatePlanned", "endDatePlanned"]);

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
            const res = await getAdminProposalLetterDetail(id!);
            setProposal(res.data);

            // Format dates for input type="date" (YYYY-MM-DD)
            const formatDate = (dateStr: string | null) => {
                if (!dateStr) return "";
                return new Date(dateStr).toISOString().split('T')[0];
            };

            reset({
                documentNumber: res.data.letterNumber || "",
                startDatePlanned: formatDate(res.data.period?.start || null),
                endDatePlanned: formatDate(res.data.period?.end || null)
            });
        } catch (error: any) {
            toast.error(error.message || "Gagal memuat detail pengajuan");
            navigate("/admin/kerja-praktik/surat-pengantar");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (values: LetterFormValues) => {
        try {
            setSubmitting(true);
            await updateAdminProposalLetter(id!, values);
            toast.success("Data berhasil disimpan");
            navigate("/admin/kerja-praktik/surat-pengantar");
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kelola Surat Pengantar</h1>
                    <p className="text-muted-foreground text-sm">Update nomor surat dan rentang waktu magang</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Information Sidebar */}
                <div className="space-y-6">
                    {/* Informasi Perusahaan */}
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
                                {/* AdminApprovedProposalItem doesn't have companyAddress, but we use the same icon/layout for consistency */}
                                <div className="flex items-start gap-2 text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4 mt-1 shrink-0" />
                                    <p className="text-sm">{proposal.companyAddress || "Alamat perusahaan tidak tersedia"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Anggota Kelompok */}
                    <Card>
                        <CardHeader className="pb-3 text-base">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                Anggota Kelompok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {proposal.members.map((m, idx) => {
                                    const isCoordinator = m.nim === proposal.coordinatorNim;
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

                {/* Edit Form */}
                <div className="lg:col-span-2">
                    <Card className="border-primary/10 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Identitas Surat & Periode
                            </CardTitle>
                            <CardDescription>Data ini akan digunakan untuk proses generate Dokumen Surat Pengantar.</CardDescription>
                        </CardHeader>
                        <Separator className="opacity-50" />
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="documentNumber">No. Surat Pengantar</Label>
                                    <Input
                                        id="documentNumber"
                                        placeholder="Contoh: 123/UN27.02.1/PP/2024"
                                        className="font-mono bg-muted/30"
                                        {...register("documentNumber", { required: "Nomor surat wajib diisi" })}
                                    />
                                    {errors.documentNumber && (
                                        <p className="text-xs text-destructive">{errors.documentNumber.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDatePlanned" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Tanggal Mulai Magang
                                        </Label>
                                        <Input
                                            id="startDatePlanned"
                                            type="date"
                                            {...register("startDatePlanned", { required: "Tanggal mulai wajib diisi" })}
                                        />
                                        {errors.startDatePlanned && (
                                            <p className="text-xs text-destructive">{errors.startDatePlanned.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDatePlanned" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            Tanggal Selesai Magang
                                        </Label>
                                        <Input
                                            id="endDatePlanned"
                                            type="date"
                                            {...register("endDatePlanned", { required: "Tanggal selesai wajib diisi" })}
                                        />
                                        {errors.endDatePlanned && (
                                            <p className="text-xs text-destructive">{errors.endDatePlanned.message}</p>
                                        )}
                                    </div>
                                </div>

                                {watchDates[0] && watchDates[1] && (
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                            <Calendar className="h-4 w-4" />
                                            Durasi Magang
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-bold text-lg">{businessDays}</span>
                                            <span className="ml-1 text-muted-foreground">Hari Kerja</span>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
                                        Batal
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
                                                Simpan Data
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default ManageApplicationLetter;
