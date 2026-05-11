import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { advisorRequestService, type AdvisorRequest, type AlternativeLecturer } from '@/services/advisorRequest.service';
import { metopenTitleService, type PendingTitleReportRow } from '@/services/metopenTitle.service';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle2, GraduationCap, FileText, XCircle, AlertTriangle, Check, X, Stamp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/spinner';

type ConfirmAction = 'approve' | 'reject' | 'redirect' | 'request_revision' | 'assign';

/** P0-04: pisahkan tab TA-01 overquota dari TA-02 penetapan dosen. */
type TabKey = 'ta01_overquota' | 'ta02_penetapan' | 'assignment' | 'titles';

export default function DSSKadep() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const location = useLocation();

    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<AdvisorRequest | null>(null);
    const [alternatives, setAlternatives] = useState<AlternativeLecturer[]>([]);
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

    const { data: queue, isLoading } = useQuery({
        queryKey: ['kadep-queue'],
        queryFn: async () => (await advisorRequestService.getKadepQueue()).data,
    });
    const { data: titleReports = [] } = useQuery({
        queryKey: ['pending-title-reports'],
        queryFn: async () => (await metopenTitleService.getPendingTitleReports()).data,
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
        mutationFn: ({ thesisId, action, notes }: { thesisId: string; action: 'accept'; notes?: string }) =>
            metopenTitleService.reviewTitleReport(thesisId, { action, notes }),
        onSuccess: () => {
            toast.success('Judul TA disahkan');
            queryClient.invalidateQueries({ queryKey: ['pending-title-reports'] });
            setTitleReviewTarget(null);
            setTitleReviewNotes('');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const handleSelectRequest = async (request: AdvisorRequest) => {
        setSelectedRequest(request);
        setAlternatives([]);
        setLoadingAlts(true);
        try {
            const res = await advisorRequestService.getRecommendations(request.id);
            setAlternatives(res.data.alternatives);
        } catch {
            setAlternatives([]);
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
                                                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada dosen alternatif di KBK yang sama</p>
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

            {activeTab === 'titles' && (
                titleReports.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Stamp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada pengesahan TA-04 menunggu review</p>
                    </div>
                ) : (
                    <div className="space-y-3 mt-4">
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
                                            {!allMet && (
                                                <p className="self-center text-xs text-muted-foreground">
                                                    Tombol akan aktif setelah semua 5 syarat terpenuhi.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )
            )}

            <Dialog open={!!titleReviewTarget} onOpenChange={(open) => !open && setTitleReviewTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sahkan Pengesahan TA-04</DialogTitle>
                        <DialogDescription>
                            Anda akan mengesahkan judul TA. SK Penugasan Pembimbing TA-04 akan diterbitkan otomatis dan mahasiswa akan masuk fase Tugas Akhir penuh.
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
        </div>
    );
}
