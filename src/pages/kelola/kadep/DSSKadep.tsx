import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Supervisor2KadepSection } from '@/components/bimbingan/Supervisor2KadepSection';
import { advisorRequestService, type AdvisorRequest, type AlternativeLecturer } from '@/services/advisorRequest.service';
import { getSupervisor2KadepRequests } from '@/services/lecturerGuidance.service';
import { metopenTitleService, type PendingTitleReportRow, type TitleReportHistoryRow } from '@/services/metopenTitle.service';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle2, GraduationCap, FileText, XCircle, AlertTriangle, Check, X, Stamp, Users, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loading } from '@/components/ui/spinner';
import { formatDateId } from '@/lib/text';

type ConfirmAction = 'approve' | 'reject' | 'redirect' | 'request_revision' | 'assign';

/** P0-04: pisahkan tab TA-01 overquota dari TA-02 penetapan dosen.
 *  'supervisor2' = persetujuan akhir Pembimbing 2 modul TA (F2-5 / OQ-2.2). */
type TabKey = 'ta01_overquota' | 'ta02_penetapan' | 'assignment' | 'titles' | 'history' | 'supervisor2';

export default function DSSKadep() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const location = useLocation();

    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<AdvisorRequest | null>(null);
    const [alternatives, setAlternatives] = useState<AlternativeLecturer[]>([]);
    const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);
    const [loadingAlts, setLoadingAlts] = useState(false);
    const [kadepNotes, setKadepNotes] = useState('');
    const initialTab: TabKey = location.pathname.endsWith('/pengesahan-judul')
        ? 'titles'
        : 'ta01_overquota';
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: ConfirmAction; targetId?: string; targetName?: string }>({
        open: false,
        action: 'approve',
    });
    const [titleReviewNotes, setTitleReviewNotes] = useState('');
    const [titleReviewTarget, setTitleReviewTarget] = useState<string | null>(null);
    const [titleRejectTarget, setTitleRejectTarget] = useState<string | null>(null);
    const [titleRejectNotes, setTitleRejectNotes] = useState('');
    const [historyAcademicYearFilter, setHistoryAcademicYearFilter] = useState<string>('all');

    const { data: queue, isLoading } = useQuery({
        queryKey: ['kadep-queue'],
        queryFn: async () => (await advisorRequestService.getKadepQueue()).data,
    });
    const {
        data: titleReports = [],
        isLoading: isLoadingTitleReports,
        isFetching: isFetchingTitleReports,
        refetch: refetchTitleReports,
    } = useQuery({
        queryKey: ['pending-title-reports'],
        queryFn: async () => (await metopenTitleService.getPendingTitleReports()).data,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchInterval: 30_000,
    });
    // Antrean persetujuan Pembimbing 2 (cache key sama dengan Supervisor2KadepSection
    // sehingga TanStack Query men-dedupe fetch-nya).
    const { data: supervisor2Requests = [] } = useQuery({
        queryKey: ['kadep-supervisor2-requests'],
        queryFn: getSupervisor2KadepRequests,
    });

    // P0-04: pisahkan TA-01 overquota dari TA-02 penetapan
    const escalatedQueue = queue?.escalated ?? [];
    const ta01Overquota = escalatedQueue.filter((r) => r.requestType !== 'ta_02');
    const ta02Penetapan = escalatedQueue.filter((r) => r.requestType === 'ta_02');
    const pendingAssignmentCount = queue?.pendingAssignment?.length ?? 0;

    // P1-04: dynamic breadcrumb berdasarkan active tab + label tab eksplisit
    const tabLabels: Record<TabKey, string> = {
        ta01_overquota: 'TA-01 Overquota',
        ta02_penetapan: 'TA-02 Penetapan Dosen',
        assignment: 'Finalisasi Booking',
        titles: 'Pengesahan TA-04',
        history: 'Riwayat Pengesahan',
        supervisor2: 'Pembimbing 2',
    };

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Tugas Akhir', href: '/kelola/tugas-akhir/kadep' },
            { label: tabLabels[activeTab] },
        ]);
        setTitle(`KaDep — ${tabLabels[activeTab]}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setBreadcrumbs, setTitle, activeTab]);

    const decideMutation = useMutation({
        mutationFn: ({ id, action, targetLecturerId, notes }: { id: string; action: 'approve' | 'reject' | 'redirect' | 'request_revision'; targetLecturerId?: string; notes?: string }) =>
            advisorRequestService.decideRequest(id, { action, targetLecturerId, notes }),
        onSuccess: (_, variables) => {
            toast.success(
                variables.action === 'approve'
                    ? 'Pengajuan jalur departemen disetujui.'
                    : variables.action === 'request_revision'
                        ? 'Permintaan revisi berhasil dikirim ke mahasiswa.'
                    : variables.action === 'reject'
                        ? 'Pengajuan ditolak.'
                        : !selectedRequest?.lecturerId
                            ? 'Pembimbing berhasil ditetapkan untuk pengajuan TA-02.'
                            : 'Dosen alternatif berhasil ditetapkan sebelum booking pembimbing dicatat.',
            );
            queryClient.invalidateQueries({ queryKey: ['kadep-queue'] });
            setSelectedRequest(null);
            setKadepNotes('');
            setConfirmDialog({ open: false, action: 'approve' });
        },
        onError: (err: Error) => toast.error(err.message),
    });
    const assignMutation = useMutation({
        mutationFn: (id: string) => advisorRequestService.assignAdvisor(id),
        onSuccess: () => {
            toast.success('Booking pembimbing berhasil difinalisasi.');
            queryClient.invalidateQueries({ queryKey: ['kadep-queue'] });
            setConfirmDialog({ open: false, action: 'assign' });
        },
        onError: (err: Error) => toast.error(err.message),
    });
    const titleReviewMutation = useMutation({
        mutationFn: ({ thesisId, action, notes }: { thesisId: string; action: 'accept' | 'reject'; notes?: string }) =>
            metopenTitleService.reviewTitleReport(thesisId, { action, notes }),
        onSuccess: (_data, vars) => {
            if (vars.action === 'accept') {
                toast.success('Judul TA disahkan. Mahasiswa & pembimbing telah dinotifikasi. Mahasiswa masuk fase Tugas Akhir; Formulir TA-04 batch periode perlu difinalisasi di tab Riwayat.');
            } else {
                toast.success('Judul TA ditolak. Mahasiswa telah dinotifikasi dengan catatan revisi.');
            }
            queryClient.invalidateQueries({ queryKey: ['pending-title-reports'] });
            queryClient.invalidateQueries({ queryKey: ['kadep-title-report-history'] });
            // Explicit refetch history agar muncul langsung tanpa tunggu remount.
            void refetchHistory();
            setTitleReviewTarget(null);
            setTitleReviewNotes('');
            setTitleRejectTarget(null);
            setTitleRejectNotes('');
        },
        onError: (err: Error) => toast.error(err.message),
    });
    // Riwayat keputusan TA-04 (accepted/rejected) antar-periode.
    // staleTime:0 + refetchOnMount:'always' supaya switch tab "Riwayat" langsung
    // refetch (mencegah stale cache ketika KaDep baru saja accept di tab "titles").
    const {
        data: titleReportHistory = [],
        isLoading: isLoadingHistory,
        refetch: refetchHistory,
    } = useQuery({
        queryKey: ['kadep-title-report-history'],
        queryFn: async () => (await metopenTitleService.getKadepTitleReportHistory()).data,
        staleTime: 0,
        refetchOnMount: 'always',
    });
    // Daftar tahun akademik unik dari data history untuk dropdown filter.
    const historyAcademicYears = Array.from(
        new Map(
            titleReportHistory
                .map((r) => r.academicYear)
                .filter((ay): ay is { id: string; year: string | null; semester: string } => Boolean(ay))
                .map((ay) => [ay.id, ay]),
        ).values(),
    );
    const filteredHistory = historyAcademicYearFilter === 'all'
        ? titleReportHistory
        : titleReportHistory.filter((r) => r.academicYear?.id === historyAcademicYearFilter);
    // KaDep mengunduh Formulir TA-04 batch resmi.
    const downloadKadepSkMutation = useMutation({
        mutationFn: (thesisId: string) => metopenTitleService.downloadKadepTitleApprovalDocument(thesisId),
        onSuccess: () => toast.success('Formulir TA-04 berhasil diunduh.'),
        onError: (err: Error) => toast.error(err.message || 'Gagal mengunduh Formulir TA-04.'),
    });
    // Formulir TA-04 per-periode (panduan: format resmi tabel batch).
    // Preview unduh tanpa persist; finalisasi persist + link ke semua thesis.
    const [finalizeBatchTarget, setFinalizeBatchTarget] = useState<{ academicYearId: string; label: string; thesisCount: number } | null>(null);
    const downloadBatchPreviewMutation = useMutation({
        mutationFn: async ({ academicYearId, label }: { academicYearId: string; label: string }) => {
            const blob = await advisorRequestService.getBatchTA04(academicYearId);
            const blobUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = `TA04-Batch-${label}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(blobUrl);
        },
        onSuccess: () => toast.success('Pratinjau batch TA-04 berhasil diunduh.'),
        onError: (err: Error) => toast.error(err.message || 'Gagal mengunduh pratinjau batch TA-04.'),
    });
    const finalizeBatchMutation = useMutation({
        mutationFn: (academicYearId: string) => advisorRequestService.finalizeBatchTA04(academicYearId),
        onSuccess: (res) => {
            const data = res.data;
            toast.success(`Formulir TA-04 difinalisasi (${data.thesisCount} mahasiswa, ${data.academicYear}). Dokumen resmi terhubung ke seluruh thesis periode ini.`);
            queryClient.invalidateQueries({ queryKey: ['kadep-title-report-history'] });
            setFinalizeBatchTarget(null);
        },
        onError: (err: Error) => toast.error(err.message || 'Gagal finalisasi Formulir TA-04.'),
    });
    // Status finalisasi batch per academic year: sudah sinkron jika semua thesis
    // accepted DAN batch-eligible di periode itu menunjuk ke dokumen batch resmi
    // yang sama. Thesis accepted tapi tidak batch-eligible (data legacy/tidak
    // lengkap) TIDAK dimasukkan ke dokumen batch — hanya yang eligible.
    const batchStatusByAcademicYear = historyAcademicYears.map((ay) => {
        const rows = titleReportHistory.filter(
            (r) => r.academicYear?.id === ay.id && r.proposalStatus === 'accepted',
        );
        const acceptedCount = rows.length;
        const eligibleRows = rows.filter((r) => r.ta04BatchEligible !== false);
        const batchEligibleCount = eligibleRows.length;
        const ineligibleCount = acceptedCount - batchEligibleCount;
        const batchRows = eligibleRows.filter((r) => r.documentKind === 'batch');
        const finalizedCount = batchRows.length;
        const notLinkedCount = eligibleRows.filter((r) => r.documentKind !== 'batch').length;
        const batchDocumentNames = Array.from(
            new Set(
                batchRows
                    .map((r) => r.titleApprovalDocument?.fileName)
                    .filter((fileName): fileName is string => Boolean(fileName)),
            ),
        );
        const batchAnchor = batchRows[0] ?? null;
        const isFinalized = batchEligibleCount > 0 && finalizedCount === batchEligibleCount && batchDocumentNames.length === 1;
        return {
            academicYear: ay,
            label: `${ay.semester === 'genap' ? 'Genap' : 'Ganjil'} ${ay.year ?? '-'}`,
            acceptedCount,
            batchEligibleCount,
            ineligibleCount,
            finalizedCount,
            notLinkedCount,
            batchDocumentName: batchDocumentNames[0] ?? null,
            batchThesisId: batchAnchor?.thesisId ?? null,
            isFinalized,
            hasPartialFinalization: finalizedCount > 0 && !isFinalized,
        };
    }).filter((s) => s.acceptedCount > 0);

    const getHistoryDocumentLabel = (row: TitleReportHistoryRow) => {
        if (row.documentKind === 'batch') return 'Unduh Formulir TA-04';
        return 'Belum Tersedia';
    };

    const ta04BatchBlockLabel: Record<string, string> = {
        proposal_final_not_submitted: 'Proposal final belum disubmit',
        ta_course_not_confirmed: 'SIA belum konfirmasi MK Tugas Akhir',
        no_active_pembimbing_1: 'Tidak ada Pembimbing 1 aktif',
        missing_scores: 'Nilai TA-03 belum lengkap',
        scores_not_finalized: 'Nilai TA-03 belum final',
        metopel_auto_zeroed: 'Gagal presensi Metopel (auto-zero)',
    };

    const handleSelectRequest = async (request: AdvisorRequest) => {
        setSelectedRequest(request);
        setAlternatives([]);
        setRecommendationMessage(null);
        setLoadingAlts(true);
        try {
            const res = await advisorRequestService.getRecommendations(request.id);
            setAlternatives(res.data.alternatives);
            setRecommendationMessage(res.data.message ?? null);
        } catch (err) {
            setAlternatives([]);
            setRecommendationMessage(err instanceof Error ? err.message : 'Gagal memuat rekomendasi dosen.');
        } finally {
            setLoadingAlts(false);
        }
    };

    const handleConfirmAction = () => {
        if (!selectedRequest) return;
        if (confirmDialog.action === 'assign') {
            assignMutation.mutate(selectedRequest.id);
            return;
        }
        decideMutation.mutate({
            id: selectedRequest.id,
            action: confirmDialog.action as 'approve' | 'reject' | 'redirect' | 'request_revision',
            targetLecturerId: confirmDialog.targetId,
            notes: kadepNotes || undefined,
        });
    };

    // P1-04 (audit 2026-05-10): Label tab eksplisit dengan kode formulir TA-04.
    // Counter angka tetap dipertahankan untuk visibility antrean.
    const tabItems: Array<{ label: string; value: TabKey }> = [
        {
            label: `${tabLabels.ta01_overquota}${ta01Overquota.length > 0 ? ` (${ta01Overquota.length})` : ''}`,
            value: 'ta01_overquota',
        },
        {
            label: `${tabLabels.ta02_penetapan}${ta02Penetapan.length > 0 ? ` (${ta02Penetapan.length})` : ''}`,
            value: 'ta02_penetapan',
        },
        {
            label: `${tabLabels.assignment}${pendingAssignmentCount > 0 ? ` (${pendingAssignmentCount})` : ''}`,
            value: 'assignment',
        },
        {
            label: `${tabLabels.titles}${titleReports.length > 0 ? ` (${titleReports.length})` : ''}`,
            value: 'titles',
        },
        {
            label: tabLabels.history,
            value: 'history',
        },
        {
            label: `${tabLabels.supervisor2}${supervisor2Requests.length > 0 ? ` (${supervisor2Requests.length})` : ''}`,
            value: 'supervisor2',
        },
    ];

    // P0-04: deep-link path mapping (existing legacy: /pembimbing → ta01_overquota,
    // /pengesahan-judul → titles). Auto-flip tab logic dihapus per P1-05 agar
    // tab tidak berpindah sendiri ketika antrean kosong (perilaku lama membingungkan).
    useEffect(() => {
        if (location.pathname.endsWith('/pengesahan-judul')) {
            setActiveTab('titles');
        } else if (location.pathname.endsWith('/pembimbing')) {
            setActiveTab('ta01_overquota');
        }
    }, [location.pathname]);

    const detail = selectedRequest?.quotaSnapshot;
    const preview = selectedRequest?.quotaPreview;
    const hasTargetLecturer = Boolean(selectedRequest?.lecturerId);
    const isTa02Request = selectedRequest?.requestType === 'ta_02';
    const permitStatusLabel: Record<string, string> = { approved: 'Sudah Disetujui', in_process: 'Dalam Proses', not_approved: 'Belum Disetujui' };

    const escalatedListForTab = activeTab === 'ta02_penetapan' ? ta02Penetapan : ta01Overquota;
    const escalatedTabHeading = activeTab === 'ta02_penetapan' ? {
        icon: Users,
        title: 'TA-02 Penetapan Dosen Pembimbing',
        emptyText: 'Tidak ada pengajuan TA-02 yang menunggu penetapan dosen.',
        helper: 'TA-02 = mahasiswa belum punya calon dosen. KaDep menetapkan dosen pembimbing dari rekomendasi KBK. Catatan KaDep wajib bila Minta Revisi atau Tolak.',
    } : {
        icon: ShieldCheck,
        title: 'TA-01 Validasi Kuota (Overquota)',
        emptyText: 'Tidak ada request TA-01 yang menunggu validasi overquota.',
        helper: 'TA-01 escalated = mahasiswa kokoh memilih dosen dengan kuota merah. KaDep memutuskan menerima overquota atau redirect ke dosen alternatif KBK yang sama.',
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h1 className="text-base font-semibold tracking-tight sm:text-lg">Kelola TA-01 s.d. TA-04</h1>
                <p className="text-xs text-muted-foreground sm:text-sm">{tabLabels[activeTab]} — pisahkan flow TA-01 (overquota) vs TA-02 (penetapan dosen) vs Finalisasi Booking vs Pengesahan TA-04.</p>
            </div>

            <LocalTabsNav tabs={tabItems} activeTab={activeTab} onTabChange={(v) => setActiveTab(v as TabKey)} />

            {(activeTab === 'ta01_overquota' || activeTab === 'ta02_penetapan') && (
                isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loading size="lg" text="Memuat antrean keputusan KaDep..." />
                    </div>
                ) : escalatedListForTab.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <escalatedTabHeading.icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>{escalatedTabHeading.emptyText}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
                        <div className="space-y-3">
                            <Card className="border-blue-200 bg-blue-50/50">
                                <CardContent className="p-3 text-xs text-blue-900">
                                    {escalatedTabHeading.helper}
                                </CardContent>
                            </Card>
                            {escalatedListForTab.map((req) => (
                                <Card key={req.id} className={`cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`} onClick={() => handleSelectRequest(req)}>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{req.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}</AvatarFallback></Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{req.student?.user?.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">{req.student?.user?.identityNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                                                    {req.requestType === 'ta_02' ? 'TA-02' : 'TA-01'}
                                                </Badge>
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Pending KaDep</Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Dosen tujuan: <strong>{req.lecturer?.user?.fullName || 'Belum ada dosen target'}</strong></p>
                                        <p className="text-xs text-muted-foreground">Topik: {req.topic?.name || '-'}</p>
                                        {req.quotaPreview?.willBeOverquota && <p className="text-xs text-red-600">Overquota setelah approve: {req.quotaPreview.projectedOverquotaAmount}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {!selectedRequest ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm border rounded-lg p-8">Pilih request untuk melihat snapshot kuota dan memberi keputusan.</div>
                            ) : (
                                <>
                                    <Card>
                                        <CardHeader className="pb-3"><CardTitle className="text-sm">Snapshot Kuota Dosen</CardTitle></CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            {hasTargetLecturer ? (
                                                <>
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                        <div className="rounded-md border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Kuota Maksimal</p><p className="mt-1 text-xl font-semibold tabular-nums">{detail?.quotaMax ?? 0}</p></div>
                                                        <div className="rounded-md border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Beban Aktif</p><p className="mt-1 text-xl font-semibold tabular-nums">{detail?.activeCount ?? 0}</p></div>
                                                        <div className="rounded-md border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Booking</p><p className="mt-1 text-xl font-semibold tabular-nums">{detail?.bookingCount ?? 0}</p></div>
                                                        <div className="rounded-md border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Pending KaDep</p><p className="mt-1 text-xl font-semibold tabular-nums">{detail?.pendingKadepCount ?? 0}</p></div>
                                                        <div className="rounded-md border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Sisa Normal</p><p className="mt-1 text-xl font-semibold tabular-nums">{detail?.normalAvailable ?? 0}</p></div>
                                                        <div className={`rounded-md border p-3 ${(preview?.projectedOverquotaAmount ?? 0) > 0 ? 'border-red-200 bg-red-50/60' : 'bg-muted/40'}`}><p className="text-xs text-muted-foreground">Overquota Setelah Approve</p><p className="mt-1 text-xl font-semibold tabular-nums">{preview?.projectedOverquotaAmount ?? 0}</p></div>
                                                    </div>
                                                    {preview?.willBeOverquota && <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /><span>Approval ini membuat dosen berada di atas kuota normal, tetapi kondisi tersebut sah jika KaDep menyetujuinya.</span></div>}
                                                </>
                                            ) : (
                                                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-800">
                                                    Pengajuan ini berasal dari TA-02 tanpa dosen target. KaDep perlu memilih dosen pembimbing dari rekomendasi sebelum booking pembimbing dapat dicatat.
                                                </div>
                                            )}
                                            <Separator />
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div><p className="text-muted-foreground">Jenis Pengajuan</p><p className="font-medium">{selectedRequest.requestType === 'ta_02' ? 'TA-02 Langsung ke Departemen' : 'TA-01 ke Calon Dosen'}</p></div>
                                                <div><p className="text-muted-foreground">Mahasiswa</p><p className="font-medium">{selectedRequest.student?.user?.fullName}</p><p className="text-xs text-muted-foreground">{selectedRequest.student?.user?.identityNumber}</p></div>
                                                <div><p className="text-muted-foreground">Dosen Tujuan</p><p className="font-medium text-red-700">{selectedRequest.lecturer?.user?.fullName || 'Belum ada dosen target'}</p></div>
                                                <div><p className="text-muted-foreground">Topik</p><p className="font-medium">{selectedRequest.topic?.name || '-'}</p></div>
                                                <div><p className="text-muted-foreground">Status Izin</p><p className="font-medium">{selectedRequest.researchPermitStatus ? (permitStatusLabel[selectedRequest.researchPermitStatus] || selectedRequest.researchPermitStatus) : '-'}</p></div>
                                            </div>
                                            {selectedRequest.proposedTitle && <div><p className="text-muted-foreground mb-1">Judul</p><p className="bg-muted/50 rounded-md p-3">{selectedRequest.proposedTitle}</p></div>}
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div>
                                                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Justifikasi Akademik Mahasiswa</p>
                                                    <p className="bg-muted/50 rounded-md p-3 whitespace-pre-wrap">{selectedRequest.studentJustification || selectedRequest.justificationText || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground mb-1">Proyeksi Lulus Dosen</p>
                                                    <p className="bg-muted/50 rounded-md p-3 whitespace-pre-wrap">{selectedRequest.lecturerOverquotaReason || selectedRequest.lecturerApprovalNote || '-'}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />Rekomendasi Dosen Alternatif</CardTitle></CardHeader>
                                        <CardContent>
                                            {loadingAlts ? (
                                                <div className="flex h-24 items-center justify-center">
                                                    <Loading text="Memuat rekomendasi..." />
                                                </div>
                                            ) : alternatives.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    {recommendationMessage || 'Tidak ada dosen alternatif di KBK yang sama'}
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {alternatives.map((alt, index) => (
                                                        <div key={alt.lecturerId} className="flex items-center justify-between p-2.5 rounded-md border hover:bg-muted/50 transition-colors">
                                                            <div><p className="text-sm font-medium">#{index + 1} {alt.fullName}</p><p className="text-xs text-muted-foreground">{alt.scienceGroup?.name || '-'} | Sisa normal: {alt.remaining}/{alt.quotaMax}</p></div>
                                                            <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, action: 'redirect', targetId: alt.lecturerId, targetName: alt.fullName })}><CheckCircle2 className="h-3 w-3 mr-1" />{hasTargetLecturer ? 'Pilih Alternatif' : 'Tetapkan'}</Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-2">
                                        <Label>Catatan KaDep</Label>
                                        <Textarea value={kadepNotes} onChange={(e) => setKadepNotes(e.target.value)} placeholder="Tambahkan catatan keputusan bila diperlukan..." rows={3} />
                                    </div>
                                    {hasTargetLecturer ? (
                                        <div className={`grid gap-2 ${isTa02Request ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                                            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setConfirmDialog({ open: true, action: 'approve' })}><ShieldCheck className="h-4 w-4 mr-2" />Setujui Booking Overquota</Button>
                                            {isTa02Request && (
                                                <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setConfirmDialog({ open: true, action: 'request_revision' })}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Minta Revisi
                                                </Button>
                                            )}
                                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmDialog({ open: true, action: 'reject' })}><XCircle className="h-4 w-4 mr-2" />Tolak Pengajuan</Button>
                                        </div>
                                    ) : (
                                        <div className={`grid gap-2 ${isTa02Request ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                                            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" disabled>
                                                Pilih dosen dari rekomendasi
                                            </Button>
                                            {isTa02Request && (
                                                <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setConfirmDialog({ open: true, action: 'request_revision' })}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Minta Revisi
                                                </Button>
                                            )}
                                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmDialog({ open: true, action: 'reject' })}><XCircle className="h-4 w-4 mr-2" />Tolak Pengajuan</Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )
            )}

            {activeTab === 'assignment' && (
                (queue?.pendingAssignment ?? []).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada booking yang perlu difinalisasi</p>
                    </div>
                ) : (
                    <div className="space-y-3 mt-4">
                        {(queue?.pendingAssignment ?? []).map((req) => {
                            const assignTarget = req.status === 'redirected' && req.redirectTarget
                                ? req.redirectTarget.user?.fullName
                                : req.lecturer?.user?.fullName;

                            return (
                                <Card key={req.id}>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{req.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{req.student?.user?.fullName}</p>
                                                <p className="text-xs text-muted-foreground">Status {req.status} - Pembimbing: <strong>{assignTarget}</strong></p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => { setSelectedRequest(req); setConfirmDialog({ open: true, action: 'assign' }); }}>
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                            Tetapkan
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )
            )}

            {activeTab === 'supervisor2' && <Supervisor2KadepSection />}

            {activeTab === 'history' && (
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold">Riwayat Pengesahan TA-04</h2>
                            <p className="text-xs text-muted-foreground">
                                Daftar keputusan TA-04 (disahkan/ditolak) antar-periode.
                            </p>
                        </div>
                        <Select
                            value={historyAcademicYearFilter}
                            onValueChange={setHistoryAcademicYearFilter}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Semua periode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua periode</SelectItem>
                                {historyAcademicYears.map((ay) => (
                                    <SelectItem key={ay.id} value={ay.id}>
                                        {ay.semester === 'genap' ? 'Genap' : 'Ganjil'} {ay.year ?? '-'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Formulir TA-04 per Periode — panduan: format resmi tabel batch.
                        Riwayat memisahkan keputusan per thesis dari dokumen batch periode. */}
                    {batchStatusByAcademicYear.length > 0 && (
                        <Card className="border-blue-200 bg-blue-50/40">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm text-blue-900">
                                    <FileText className="h-4 w-4" />
                                    Formulir TA-04 per Periode
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Panduan TA-04 memakai format tabel batch per periode. Dokumen resmi sistem hanya Formulir TA-04 batch; mahasiswa dapat mengunduhnya dari arsip Metode Penelitian setelah KaDep memfinalisasi batch periode.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {batchStatusByAcademicYear.map((s) => (
                                    <div
                                        key={s.academicYear.id}
                                        className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{s.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.batchEligibleCount} siap batch dari {s.acceptedCount} disahkan
                                                {s.ineligibleCount > 0 && (
                                                    <span className="text-amber-600"> ({s.ineligibleCount} tidak memenuhi syarat batch)</span>
                                                )}
                                            </p>
                                            {s.batchDocumentName && (
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    Dokumen batch: {s.batchDocumentName}
                                                </p>
                                            )}
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                {s.isFinalized ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Formulir TA-04 tersedia
                                                    </Badge>
                                                ) : s.hasPartialFinalization ? (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                                        <AlertTriangle className="h-3 w-3 mr-1" /> Perlu perbarui batch ({s.finalizedCount}/{s.batchEligibleCount} terhubung, {s.notLinkedCount} belum)
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">
                                                        Belum difinalisasi batch
                                                    </Badge>
                                                )}
                                                {s.ineligibleCount > 0 && (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]" title="Thesis accepted tapi data tidak lengkap (tidak ada proposal final / nilai TA-03 / konfirmasi MK TA). Tidak dimasukkan ke dokumen batch.">
                                                        <AlertTriangle className="h-3 w-3 mr-1" /> {s.ineligibleCount} tidak lengkap
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {s.batchThesisId && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => downloadKadepSkMutation.mutate(s.batchThesisId!)}
                                                    disabled={
                                                        downloadKadepSkMutation.isPending &&
                                                        downloadKadepSkMutation.variables === s.batchThesisId
                                                    }
                                                >
                                                    <Download className="h-3.5 w-3.5 mr-1" />
                                                    {downloadKadepSkMutation.isPending &&
                                                    downloadKadepSkMutation.variables === s.batchThesisId
                                                        ? 'Mengunduh...'
                                                        : 'Unduh Formulir TA-04'}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => downloadBatchPreviewMutation.mutate({ academicYearId: s.academicYear.id, label: s.label })}
                                                disabled={downloadBatchPreviewMutation.isPending && downloadBatchPreviewMutation.variables?.academicYearId === s.academicYear.id}
                                            >
                                                <Download className="h-3.5 w-3.5 mr-1" />
                                                Unduh Pratinjau Batch
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setFinalizeBatchTarget({ academicYearId: s.academicYear.id, label: s.label, thesisCount: s.batchEligibleCount })}
                                                disabled={s.isFinalized || finalizeBatchMutation.isPending || s.batchEligibleCount === 0}
                                            >
                                                <Stamp className="h-3.5 w-3.5 mr-1" />
                                                {s.isFinalized
                                                    ? 'Batch Sudah Sinkron'
                                                    : s.hasPartialFinalization
                                                        ? 'Perbarui Formulir TA-04'
                                                        : 'Finalisasi Formulir TA-04'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {isLoadingHistory ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loading text="Memuat riwayat pengesahan..." />
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Stamp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Belum ada riwayat pengesahan TA-04{historyAcademicYearFilter !== 'all' ? ' untuk periode ini' : ''}.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredHistory.map((row: TitleReportHistoryRow) => (
                                <Card key={row.thesisId}>
                                    <CardContent className="space-y-3 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{row.studentName}</p>
                                                <p className="text-xs text-muted-foreground">{row.studentNim}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        row.proposalStatus === 'accepted'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                                            : 'bg-red-50 text-red-700 border-red-200 text-xs'
                                                    }
                                                >
                                                    {row.proposalStatus === 'accepted' ? 'Disahkan' : 'Ditolak'}
                                                </Badge>
                                                {row.proposalStatus === 'accepted' && row.ta04BatchEligible === false && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                                        title={row.ta04BatchBlock ? ta04BatchBlockLabel[row.ta04BatchBlock] ?? row.ta04BatchBlock : 'Data tidak lengkap'}
                                                    >
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Tidak masuk batch
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded bg-muted/50 p-2.5">
                                            <p className="text-xs text-muted-foreground mb-0.5">Judul TA</p>
                                            <p className="text-sm font-medium">{row.title || '-'}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Pembimbing: {row.supervisors}
                                            </p>
                                            {row.academicYear && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Periode: {row.academicYear.semester === 'genap' ? 'Genap' : 'Ganjil'} {row.academicYear.year ?? '-'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                                            <div>
                                                <p className="text-muted-foreground">Tanggal keputusan</p>
                                                <p className="font-medium">{row.reviewedAt ? formatDateId(row.reviewedAt) : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Ditetapkan oleh</p>
                                                <p className="font-medium">{row.reviewedByName ?? '-'}</p>
                                            </div>
                                        </div>
                                        {row.reviewNotes && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Catatan KaDep</p>
                                                <p className="text-xs bg-muted/30 rounded-md p-2 whitespace-pre-wrap">{row.reviewNotes}</p>
                                            </div>
                                        )}
                                        {row.proposalStatus === 'accepted' && (
                                            <div className="flex flex-col gap-2 rounded-md border bg-background p-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    {row.ta04BatchEligible === false ? (
                                                        <>
                                                            <p className="text-xs font-medium text-amber-700">
                                                                Tidak termasuk Formulir TA-04 batch
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {row.ta04BatchBlock
                                                                    ? `Alasan: ${ta04BatchBlockLabel[row.ta04BatchBlock] ?? row.ta04BatchBlock}. `
                                                                    : 'Data thesis tidak lengkap. '}
                                                                Thesis ini tetap berstatus disahkan, tetapi tidak dimasukkan ke dokumen batch periode karena tidak memenuhi syarat kelengkapan data.
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-xs font-medium">
                                                                {row.documentKind === 'batch'
                                                                    ? 'Termasuk Formulir TA-04 periode'
                                                                    : row.documentKind === 'legacy'
                                                                        ? 'Perlu perbarui Formulir TA-04 batch'
                                                                        : 'Belum masuk Formulir TA-04 batch'}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {row.documentKind === 'batch'
                                                                    ? 'Unduhan mahasiswa dan KaDep mengarah ke Formulir TA-04 periode.'
                                                                    : row.documentKind === 'legacy'
                                                                        ? 'Ada dokumen lama non-batch pada data, tetapi output resmi harus diterbitkan ulang lewat finalisasi batch.'
                                                                        : 'Finalisasi batch periode diperlukan sebelum mahasiswa dapat mengunduh Formulir TA-04.'}
                                                            </p>
                                                            {row.titleApprovalDocument && (
                                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                    File: {row.titleApprovalDocument.fileName}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                {row.ta04BatchEligible !== false && row.documentKind === 'batch' && row.titleApprovalDocument && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => downloadKadepSkMutation.mutate(row.thesisId)}
                                                        disabled={
                                                            downloadKadepSkMutation.isPending &&
                                                            downloadKadepSkMutation.variables === row.thesisId
                                                        }
                                                        className="shrink-0"
                                                    >
                                                        <Download className="h-3.5 w-3.5 mr-1" />
                                                        {downloadKadepSkMutation.isPending &&
                                                        downloadKadepSkMutation.variables === row.thesisId
                                                            ? 'Mengunduh...'
                                                            : getHistoryDocumentLabel(row)}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'titles' && (
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold">Antrean Pengesahan TA-04</h2>
                            <p className="text-xs text-muted-foreground">
                                Data diperbarui otomatis setiap 30 detik.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void refetchTitleReports()}
                            disabled={isFetchingTitleReports}
                        >
                            <RefreshCw
                                className={`mr-1 h-3.5 w-3.5 ${
                                    isFetchingTitleReports ? 'animate-spin' : ''
                                }`}
                            />
                            Segarkan
                        </Button>
                    </div>
                {isLoadingTitleReports ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loading size="lg" text="Memuat antrean pengesahan TA-04..." />
                    </div>
                ) : titleReports.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Stamp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada pengesahan TA-04 menunggu review</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardContent className="p-3 text-xs text-blue-900">
                                Pengesahan TA-04 (canon §5.8 + BR-18). Pastikan semua 5 syarat tercapai sebelum sahkan. Sistem akan re-cek <strong>taking_thesis_course</strong> dari SIA pada saat Anda klik Sahkan — bila SIA berubah, transaksi akan ditolak.
                            </CardContent>
                        </Card>
                        {titleReports.map((report: PendingTitleReportRow) => {
                            const r = report.requirements ?? {
                                supervisorAssigned: false,
                                proposalFinalSubmitted: false,
                                ta03aComplete: false,
                                ta03bComplete: false,
                                takingThesisCourse: false,
                            };
                            const allMet =
                                r.supervisorAssigned &&
                                r.proposalFinalSubmitted &&
                                r.ta03aComplete &&
                                r.ta03bComplete &&
                                r.takingThesisCourse;
                            const checklistRows: Array<{ label: string; met: boolean; hint: string }> = [
                                {
                                    label: '1. Pembimbing resmi (P1) ditetapkan',
                                    met: r.supervisorAssigned,
                                    hint: 'Minimal Pembimbing 1 aktif di thesis_participants.',
                                },
                                {
                                    label: '2. Proposal final ditetapkan',
                                    met: r.proposalFinalSubmitted,
                                    hint: 'Mahasiswa sudah memilih satu versi proposal sebagai final aktif.',
                                },
                                {
                                    label: `3. Penilaian TA-03A ${report.hasP2 ? '(P1 + P2 cosign)' : '(P1 saja)'} lengkap`,
                                    met: r.ta03aComplete,
                                    hint: report.hasP2
                                        ? 'Pembimbing 1 sudah submit + Pembimbing 2 sudah co-sign konsensus.'
                                        : 'Pembimbing 1 sudah submit penilaian rubrik.',
                                },
                                {
                                    label: '4. Penilaian TA-03B (Koordinator) lengkap',
                                    met: r.ta03bComplete,
                                    hint: 'Koordinator Metopen sudah submit penilaian rubrik.',
                                },
                                {
                                    label: '5. SIA mengonfirmasi MK Tugas Akhir',
                                    met: r.takingThesisCourse,
                                    hint: 'Snapshot students.taking_thesis_course = true. Akan di-revalidasi otomatis saat Anda klik Sahkan.',
                                },
                            ];
                            return (
                                <Card key={report.thesisId}>
                                    <CardContent className="space-y-3 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{report.studentName}</p>
                                                <p className="text-xs text-muted-foreground">{report.studentNim}</p>
                                            </div>
                                            {allMet ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                                    Siap disahkan
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                                    Syarat belum lengkap
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="rounded bg-muted/50 p-2.5">
                                            <p className="text-xs text-muted-foreground mb-0.5">Judul TA</p>
                                            <p className="text-sm font-medium">{report.title || '-'}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Pembimbing: {report.supervisors}
                                            </p>
                                            {report.finalScore != null && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Skor akhir: <strong>{report.finalScore}/100</strong>
                                                </p>
                                            )}
                                        </div>

                                        {/* P0-05 + P1-11: Checklist 5 syarat TA-04 visual */}
                                        <div className="space-y-1.5 rounded-md border bg-background p-3">
                                            {checklistRows.map((row) => (
                                                <div key={row.label} className="flex items-start gap-2 text-xs">
                                                    <div
                                                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                                            row.met
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {row.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={row.met ? 'font-medium text-foreground' : 'font-medium text-red-700'}>
                                                            {row.label}
                                                        </p>
                                                        <p className="text-muted-foreground">{row.hint}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                onClick={() => setTitleReviewTarget(report.thesisId)}
                                                disabled={!allMet}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                Sahkan TA-04
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    setTitleRejectTarget(report.thesisId);
                                                    setTitleRejectNotes('');
                                                }}
                                            >
                                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                                Tolak / Minta Revisi
                                            </Button>
                                            {!allMet && (
                                                <p className="self-center text-xs text-muted-foreground">
                                                    Tombol Sahkan aktif setelah semua 5 syarat terpenuhi.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                </div>
            )}

            <Dialog open={!!titleReviewTarget} onOpenChange={(open) => !open && setTitleReviewTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sahkan Pengesahan TA-04</DialogTitle>
                        <DialogDescription>
                            Anda akan mengesahkan judul TA dan mahasiswa masuk fase Tugas Akhir penuh. Formulir TA-04 resmi baru dapat diunduh setelah batch periode difinalisasi pada tab riwayat.
                        </DialogDescription>
                    </DialogHeader>
                    {/* P0-05 (BR-18): tampilkan ringkasan 5 syarat termasuk warning re-validasi
                        taking_thesis_course pada saat klik Sahkan. */}
                    {titleReviewTarget && (() => {
                        const target = titleReports.find((r) => r.thesisId === titleReviewTarget);
                        const r = target?.requirements;
                        return (
                            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1.5">
                                <p className="font-medium text-foreground">Verifikasi 5 syarat TA-04 (canon §5.8):</p>
                                <ul className="space-y-1">
                                    <li className={r?.supervisorAssigned ? 'text-emerald-700' : 'text-red-700'}>
                                        {r?.supervisorAssigned ? '✓' : '✗'} Pembimbing resmi
                                    </li>
                                    <li className={r?.proposalFinalSubmitted ? 'text-emerald-700' : 'text-red-700'}>
                                        {r?.proposalFinalSubmitted ? '✓' : '✗'} Proposal final
                                    </li>
                                    <li className={r?.ta03aComplete ? 'text-emerald-700' : 'text-red-700'}>
                                        {r?.ta03aComplete ? '✓' : '✗'} TA-03A {target?.hasP2 ? '(P1 + P2 cosign)' : '(P1)'}
                                    </li>
                                    <li className={r?.ta03bComplete ? 'text-emerald-700' : 'text-red-700'}>
                                        {r?.ta03bComplete ? '✓' : '✗'} TA-03B (Koordinator)
                                    </li>
                                    <li className={r?.takingThesisCourse ? 'text-emerald-700' : 'text-red-700'}>
                                        {r?.takingThesisCourse ? '✓' : '✗'} MK Tugas Akhir SIA <span className="text-muted-foreground">(akan di-revalidasi saat klik Sahkan)</span>
                                    </li>
                                </ul>
                            </div>
                        );
                    })()}
                    <div className="space-y-2 py-2">
                        <Label>Catatan (opsional)</Label>
                        <Textarea value={titleReviewNotes} onChange={(e) => setTitleReviewNotes(e.target.value)} placeholder="Catatan untuk mahasiswa..." rows={3} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTitleReviewTarget(null)}>Batal</Button>
                        <Button
                            onClick={() => titleReviewTarget && titleReviewMutation.mutate({ thesisId: titleReviewTarget, action: 'accept', notes: titleReviewNotes || undefined })}
                            disabled={titleReviewMutation.isPending}
                        >
                            {titleReviewMutation.isPending ? 'Memproses...' : 'Sahkan TA-04'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!titleRejectTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setTitleRejectTarget(null);
                        setTitleRejectNotes('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tolak Pengesahan TA-04 / Minta Revisi</AlertDialogTitle>
                        <AlertDialogDescription>
                            Mahasiswa akan dinotifikasi (in-app + push) dengan catatan di bawah. Proposal masuk status <span className="font-medium">rejected</span>; mahasiswa dapat merevisi proposal sesuai catatan lalu pembimbing menyetujui revisi untuk masuk antrean kembali (canon §5.8.2).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Catatan / Arahan Revisi (wajib, minimal 10 karakter)</Label>
                        <Textarea
                            value={titleRejectNotes}
                            onChange={(e) => setTitleRejectNotes(e.target.value)}
                            placeholder="Contoh: Judul terlalu luas; persempit ke studi kasus spesifik dan lengkapi tinjauan pustaka bab 2."
                            rows={4}
                        />
                        {titleRejectNotes.trim().length > 0 && titleRejectNotes.trim().length < 10 && (
                            <p className="text-xs text-red-600">Catatan minimal 10 karakter.</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={
                                titleReviewMutation.isPending ||
                                titleRejectNotes.trim().length < 10
                            }
                            onClick={() =>
                                titleRejectTarget &&
                                titleReviewMutation.mutate({
                                    thesisId: titleRejectTarget,
                                    action: 'reject',
                                    notes: titleRejectNotes.trim(),
                                })
                            }
                        >
                            {titleReviewMutation.isPending ? 'Memproses...' : 'Ya, Tolak & Minta Revisi'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: 'approve' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.action === 'approve' && 'Setujui Booking Overquota'}
                            {confirmDialog.action === 'reject' && 'Tolak Request'}
                            {confirmDialog.action === 'redirect' && (hasTargetLecturer ? 'Tetapkan Dosen Alternatif' : 'Tetapkan Pembimbing')}
                            {confirmDialog.action === 'request_revision' && 'Minta Revisi TA-02'}
                            {confirmDialog.action === 'assign' && 'Finalisasi Booking'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.action === 'approve' && 'KaDep menyetujui usulan ini pada dosen target dan booking pembimbing akan langsung tercatat.'}
                            {confirmDialog.action === 'reject' && 'Request ini akan ditolak dan tidak akan menghitung booking_count.'}
                            {confirmDialog.action === 'redirect' && (
                                hasTargetLecturer
                                    ? `Dosen target pada pengajuan ini akan diganti ke ${confirmDialog.targetName} sebelum booking pembimbing aktif dicatat.`
                                    : `KaDep akan menetapkan ${confirmDialog.targetName} sebagai pembimbing untuk pengajuan TA-02 ini.`
                            )}
                            {confirmDialog.action === 'request_revision' && 'Mahasiswa akan diminta memperbaiki draft TA-02 yang sama sesuai catatan KaDep. Catatan minimal 10 karakter.'}
                            {confirmDialog.action === 'assign' && 'Finalisasi hanya mencatat booking pembimbing dari pengajuan TA-01/TA-02 yang sudah disetujui.'}
                        </DialogDescription>
                    </DialogHeader>
                    {/* P2-16 (audit Sprint 3): Catatan KaDep wajib min 10 char untuk
                        decision negatif (reject + redirect) selain hanya request_revision,
                        agar audit trail seragam. */}
                    {(confirmDialog.action === 'reject' || confirmDialog.action === 'redirect' || confirmDialog.action === 'request_revision') && (
                        <p className="text-xs text-muted-foreground px-1">
                            Catatan KaDep wajib minimal 10 karakter untuk audit trail keputusan negatif. Saat ini: {kadepNotes.trim().length} karakter.
                        </p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: 'approve' })}>Batal</Button>
                        <Button
                            onClick={handleConfirmAction}
                            disabled={
                                decideMutation.isPending ||
                                assignMutation.isPending ||
                                ((confirmDialog.action === 'request_revision' ||
                                    confirmDialog.action === 'reject' ||
                                    confirmDialog.action === 'redirect') &&
                                    kadepNotes.trim().length < 10)
                            }
                            className={
                                confirmDialog.action === 'approve'
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : confirmDialog.action === 'reject'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : confirmDialog.action === 'request_revision'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : ''
                            }
                        >
                            {(decideMutation.isPending || assignMutation.isPending) ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Konfirmasi finalisasi Formulir TA-04 per periode.
                Finalisasi menerbitkan satu dokumen batch resmi (format tabel panduan)
                dan mengaitkannya ke seluruh thesis accepted di periode itu. */}
            <AlertDialog open={!!finalizeBatchTarget} onOpenChange={(open) => !open && setFinalizeBatchTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalisasi Formulir TA-04 {finalizeBatchTarget?.label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan menerbitkan satu Formulir TA-04 batch untuk {finalizeBatchTarget?.thesisCount} mahasiswa yang sudah disahkan dan memenuhi syarat kelengkapan data pada periode {finalizeBatchTarget?.label}. Thesis accepted dengan data tidak lengkap tidak dimasukkan ke dokumen batch. Aksi ini dapat diulang untuk memperbarui batch jika ada mahasiswa baru disahkan kemudian.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => finalizeBatchTarget && finalizeBatchMutation.mutate(finalizeBatchTarget.academicYearId)}
                            disabled={finalizeBatchMutation.isPending}
                        >
                            {finalizeBatchMutation.isPending ? 'Memproses...' : 'Ya, Finalisasi Formulir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
