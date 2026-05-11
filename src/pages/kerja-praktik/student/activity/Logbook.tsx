import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { getStudentLogbooks, type InternshipLogbookItem, updateInternshipDetails, finishLogbook } from '@/services/internship';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InternshipTable } from '@/components/internship/InternshipTable';
import { getLogbookColumns } from '@/lib/internship/activityColumns';
import EmptyState from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import EditLogbookDialog from '@/components/internship/student/EditLogbookDialog';
import { Edit, Loader2, User, ShieldCheck, Lock, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LogbookPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [editOpen, setEditOpen] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState<InternshipLogbookItem | null>(null);

    const qc = useQueryClient();
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['student-logbooks'],
        queryFn: () => getStudentLogbooks(),
    });

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [fieldSupervisor, setFieldSupervisor] = useState("");
    const [fieldSupervisorEmail, setFieldSupervisorEmail] = useState("");
    const [unitSection, setUnitSection] = useState("");
    const [finishOpen, setFinishOpen] = useState(false);

    const updateDetailsMutation = useMutation({
        mutationFn: (body: { fieldSupervisorName: string; fieldSupervisorEmail: string; unitSection: string }) => updateInternshipDetails(body),
        onSuccess: () => {
            toast.success("Informasi KP berhasil diperbarui");
            qc.invalidateQueries({ queryKey: ['student-logbooks'] });
            setDetailsOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Gagal memperbarui informasi");
        }
    });

    const finishLogbookMutation = useMutation({
        mutationFn: () => finishLogbook(),
        onSuccess: () => {
            toast.success("Logbook berhasil diselesaikan dan dikunci.");
            qc.invalidateQueries({ queryKey: ['student-logbooks'] });
            setFinishOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Gagal menyelesaikan logbook");
        }
    });

    const handleEditDetails = () => {
        setFieldSupervisor(data?.data?.internship?.fieldSupervisorName || "");
        setFieldSupervisorEmail(data?.data?.internship?.fieldSupervisorEmail || "");
        setUnitSection(data?.data?.internship?.unitSection || "");
        setDetailsOpen(true);
    };

    const onSubmitDetails = (e: React.FormEvent) => {
        e.preventDefault();
        updateDetailsMutation.mutate({
            fieldSupervisorName: fieldSupervisor,
            fieldSupervisorEmail: fieldSupervisorEmail,
            unitSection: unitSection
        });
    };

    const [previewConfig, setPreviewConfig] = useState<{
        open: boolean;
        fileName: string;
        filePath: string;
    }>({
        open: false,
        fileName: '',
        filePath: ''
    });

    const handlePreview = (fileName: string, filePath: string) => {
        setPreviewConfig({
            open: true,
            fileName,
            filePath
        });
    };


    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik', to: '/kerja-praktik' },
        { label: 'Pelaksanaan', to: '/kerja-praktik/kegiatan' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const handleEdit = (item: InternshipLogbookItem) => {
        setSelectedLogbook(item);
        setEditOpen(true);
    };

    const isLocked = data?.data?.internship?.fieldAssessmentStatus === 'COMPLETED' || data?.data?.internship?.isLogbookLocked;
    const columns = useMemo(() => getLogbookColumns({ onEdit: handleEdit, isLocked }), [handleEdit, isLocked]);

    const tabs = [
        { label: 'Logbook', to: '/kerja-praktik/kegiatan/logbook', end: true },
        { label: 'Bimbingan', to: '/kerja-praktik/kegiatan/bimbingan' },
    ];

    const logbooks = data?.data?.logbooks || [];
    const companyName = data?.data?.internship?.proposal?.targetCompany?.companyName || '-';

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pelaksanaan Kerja Praktik</h1>
                <p className="text-muted-foreground">Logbook harian di {companyName}.</p>
            </div>

            <TabsNav tabs={tabs} preserveSearch />

            {data?.data?.internship && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informasi Kerja Praktik</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-primary" onClick={handleEditDetails} disabled={isLocked}>
                                <Edit className="h-4 w-4" />
                                Edit Info
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 p-4 rounded-xl border bg-card text-card-foreground">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                <User className="h-3 w-3" />
                                Pembimbing Lapangan
                            </span>
                            <span className="font-medium">{fieldSupervisor || data.data.internship.fieldSupervisorName || <span className="text-muted-foreground italic">Nama belum ditentukan</span>}</span>
                            <span className="text-sm text-muted-foreground">{fieldSupervisorEmail || data.data.internship.fieldSupervisorEmail || <span className="italic">Email belum ditentukan</span>}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl border bg-card text-card-foreground">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                <Edit className="h-3 w-3" />
                                Unit / Bagian
                            </span>
                            <span className="font-medium">{unitSection || data.data.internship.unitSection || <span className="text-muted-foreground italic">Belum ditentukan</span>}</span>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loading size="lg" text="Memuat data logbook..." />
                </div>
            ) : !data?.data?.internship ? (
                <EmptyState
                    title="Belum Ada Kerja Praktik"
                    description="Anda belum memiliki kegiatan Kerja Praktik yang sedang berjalan."
                />
            ) : logbooks.length === 0 ? (
                <EmptyState
                    title="Logbook Kosong"
                    description="Belum ada data logbook. Logbook akan otomatis tersedia setelah Surat Tugas disetujui oleh Kadep."
                    size="lg"
                />
            ) : (
                <div className="flex flex-col gap-4">
                    <InternshipTable
                        columns={columns as any}
                        data={logbooks}
                        loading={isLoading}
                        isRefreshing={isFetching && !isLoading}
                        total={logbooks.length}
                        page={1}
                        pageSize={100}
                        onPageChange={() => { }}
                        hidePagination={logbooks.length <= 100}
                        actions={
                            <div className="flex items-center gap-2">
                                {data?.data?.internship?.logbookDocument?.filePath ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handlePreview(
                                            data.data!.internship!.logbookDocument!.fileName,
                                            data.data!.internship!.logbookDocument!.filePath
                                        )}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Lihat Logbook (KP-002)
                                    </Button>
                                ) : data?.data?.internship?.isLogbookLocked ? (
                                    <div className="flex items-center px-4 h-9 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <ShieldCheck className="h-3 w-3 mr-2 opacity-50" />
                                        PDF Tersedia Setelah Disahkan
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl px-4"
                                        onClick={() => setFinishOpen(true)}
                                    >
                                        <Lock className="h-4 w-4" />
                                        Selesaikan Logbook
                                    </Button>
                                )}
                                <RefreshButton
                                    onClick={() => refetch()}
                                    isRefreshing={isFetching && !isLoading}
                                />
                            </div>
                        }
                    />
                </div>
            )}

            <EditLogbookDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                logbook={selectedLogbook}
                onSuccess={() => refetch()}
            />

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={onSubmitDetails}>
                        <DialogHeader>
                            <DialogTitle>Edit Informasi Kerja Praktik</DialogTitle>
                            <DialogDescription>
                                Perbarui informasi pembimbing lapangan dan unit kerja Anda.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="supervisor" className="text-xs font-bold uppercase text-muted-foreground">Nama Pembimbing Lapangan</Label>
                                <Input
                                    id="supervisor"
                                    placeholder="Nama Lengkap Pembimbing"
                                    value={fieldSupervisor}
                                    onChange={(e) => setFieldSupervisor(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="supervisorEmail" className="text-xs font-bold uppercase text-muted-foreground">Email Pembimbing Lapangan</Label>
                                <Input
                                    id="supervisorEmail"
                                    type="email"
                                    placeholder="email@perusahaan.com"
                                    value={fieldSupervisorEmail}
                                    onChange={(e) => setFieldSupervisorEmail(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit" className="text-xs font-bold uppercase text-muted-foreground">Unit / Bagian Kerja</Label>
                                <Input
                                    id="unit"
                                    placeholder="Contoh: Divisi IT / Software Engineering"
                                    value={unitSection}
                                    onChange={(e) => setUnitSection(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => setDetailsOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={updateDetailsMutation.isPending} size="sm" className="gap-2">
                                {updateDetailsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <Lock className="h-5 w-5" />
                            Selesaikan Logbook?
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-slate-600 font-medium">
                            Setelah diselesaikan, logbook akan <span className="text-red-600 font-bold underline">dikunci secara permanen</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-2">
                        <p className="font-bold uppercase flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Penting:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Anda tidak akan bisa lagi menambah, mengubah, atau menghapus kegiatan harian.</li>
                            <li>Status logbook akan berubah menjadi <strong>Selesai</strong>.</li>
                            <li>Langkah ini wajib dilakukan sebelum Anda mengunggah <strong>Laporan Instansi</strong>.</li>
                        </ul>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFinishOpen(false)}>Batal</Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="bg-amber-600 hover:bg-amber-700 gap-2"
                            onClick={() => finishLogbookMutation.mutate()}
                            disabled={finishLogbookMutation.isPending}
                        >
                            {finishLogbookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Ya, Selesaikan & Kunci
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DocumentPreviewDialog
                open={previewConfig.open}
                onOpenChange={(open) => setPreviewConfig(prev => ({ ...prev, open }))}
                fileName={previewConfig.fileName}
                filePath={previewConfig.filePath}
            />
        </div>
    );
}
