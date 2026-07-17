import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    advisorRequestService,
    type AdvisorQuotaEntry,
    type AdvisorRequest,
    type DosenInboxPayload,
} from '@/services/advisorRequest.service';
import { toast } from 'sonner';
import { useState, useEffect, type ReactNode } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { ArrowRight, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, Gauge, UserCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { MetricAction } from '@/components/metopen/MetricAction';
import { Loading } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import EmptyState from '@/components/ui/empty-state';
import { formatDateId, toTitleCaseName } from '@/lib/text';
import {
    getAdvisorRequestStatus,
} from '@/lib/metopen/statusBadge';

const researchPermitStatusLabel: Record<string, string> = {
    approved: 'Izin disetujui',
    in_process: 'Izin dalam proses',
    not_approved: 'Izin belum disetujui',
};

const requestTypeLabel: Record<string, string> = {
    ta_01: 'TA-01 - Pengajuan calon pembimbing',
    ta_02: 'TA-02 - Penetapan pembimbing oleh departemen',
};

function requestShortLabel(request: AdvisorRequest) {
    return request.requestType === 'ta_02' ? 'TA-02' : 'TA-01';
}

function isPathCRequest(request: AdvisorRequest) {
    return request.routeType === 'escalated';
}

function formatDate(d: string) {
    return formatDateId(d);
}

function displayText(value?: string | null) {
    const cleanValue = value?.trim();
    return cleanValue ? cleanValue : '-';
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="min-w-0 max-w-full space-y-1 overflow-hidden">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="max-w-full whitespace-pre-wrap break-all text-sm leading-relaxed">
                {displayText(value)}
            </p>
        </div>
    );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-md border border-border p-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            {children}
        </section>
    );
}

function renderEmpty(title: string, subtitle: string) {
    return <EmptyState size="sm" title={title} description={subtitle} />;
}

function EntryCard({ entry, tone }: { entry: AdvisorQuotaEntry; tone: 'active' | 'booking' | 'pending'; }) {
    const toneLabel = tone === 'active'
        ? 'Beban aktif'
        : tone === 'booking'
            ? 'Booking'
            : 'Menunggu KaDep';

    return (
        <Card className="border-border/70 shadow-none">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={entry.studentAvatarUrl ?? undefined} />
                        <AvatarFallback>
                            {entry.studentName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{entry.studentName}</p>
                                <p className="text-xs text-muted-foreground">{entry.studentIdentityNumber || '-'}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    {toneLabel}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getAdvisorRequestStatus(entry.requestStatus).className}`}>
                                    {getAdvisorRequestStatus(entry.requestStatus).label}
                                </Badge>
                            </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed">
                            {entry.thesisTitle || 'Judul belum tersedia'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{entry.topicName || 'Topik belum tersedia'}</span>
                            {entry.roleName && <span>{entry.roleName}</span>}
                        </div>
                        {(entry.lecturerApprovalNote || entry.kadepNotes) && (
                            <p className="mt-2 border-l-2 border-border pl-2 text-xs leading-relaxed text-muted-foreground">
                                {entry.kadepNotes || entry.lecturerApprovalNote}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function InboxPembimbing() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        setBreadcrumbs([{ label: 'Inbox Pembimbing' }]);
        setTitle(undefined);
    }, [setBreadcrumbs, setTitle]);

    const queryClient = useQueryClient();
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: AdvisorRequest | null }>({ open: false, request: null });
    const [acceptDialog, setAcceptDialog] = useState<{ open: boolean; request: AdvisorRequest | null }>({ open: false, request: null });
    const [detailDialog, setDetailDialog] = useState<{ open: boolean; request: AdvisorRequest | null; showActions: boolean }>({
        open: false,
        request: null,
        showActions: false,
    });
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalNote, setApprovalNote] = useState('');
    const activeTab = ['pending', 'portfolio', 'history'].includes(searchParams.get('tab') ?? '')
        ? (searchParams.get('tab') as 'pending' | 'portfolio' | 'history')
        : 'pending';
    const portfolioFocus = ['active', 'booking', 'pending', 'overquota'].includes(searchParams.get('focus') ?? '')
        ? (searchParams.get('focus') as 'active' | 'booking' | 'pending' | 'overquota')
        : null;

    const applyView = (tab: 'pending' | 'portfolio' | 'history', focus?: typeof portfolioFocus) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        if (tab === 'portfolio' && focus) next.set('focus', focus);
        else next.delete('focus');
        setSearchParams(next, { replace: true });
    };

    const { data: inboxData, isLoading: inboxLoading } = useQuery({
        queryKey: ['dosen-inbox'],
        queryFn: async () => {
            const res = await advisorRequestService.getDosenInbox();
            return res.data;
        },
    });

    const { data: history = [], isLoading: historyLoading } = useQuery({
        queryKey: ['dosen-inbox-history'],
        queryFn: async () => {
            const res = await advisorRequestService.getDosenInboxHistory();
            return res.data;
        },
    });

    const inbox: DosenInboxPayload = inboxData ?? {
        summary: null,
        pendingRequests: [],
        activeOfficial: [],
        bookings: [],
        pendingKadep: [],
    };
    const overquotaEntries = [...inbox.activeOfficial, ...inbox.bookings]
        .filter((entry) => entry.acceptedOverNormal);
    const overquotaSahCount = inbox.summary?.overquotaSahCount ?? overquotaEntries.length;

    const respondMutation = useMutation({
        mutationFn: ({ id, action, approvalNote: nextApprovalNote, lecturerOverquotaReason, rejectionReason: nextReason }: { id: string; action: 'accept' | 'reject'; approvalNote?: string; lecturerOverquotaReason?: string; rejectionReason?: string }) =>
            advisorRequestService.respondToRequest(id, { action, approvalNote: nextApprovalNote, lecturerOverquotaReason, rejectionReason: nextReason }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'accept' ? 'Pengajuan berhasil diproses.' : 'Pengajuan ditolak.');
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox'] });
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox-history'] });
            setRejectDialog({ open: false, request: null });
            setAcceptDialog({ open: false, request: null });
            setDetailDialog({ open: false, request: null, showActions: false });
            setRejectionReason('');
            setApprovalNote('');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal merespon pengajuan');
        },
    });

    const markReviewMutation = useMutation({
        mutationFn: (id: string) => advisorRequestService.markUnderReview(id),
        onSuccess: (response) => {
            const updatedRequest = response.data;
            setDetailDialog((prev) => (
                prev.request?.id === updatedRequest.id
                    ? { ...prev, request: updatedRequest }
                    : prev
            ));
            toast.success('Pengajuan ditandai sedang ditinjau');
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox'] });
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox-history'] });
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal menandai pengajuan');
        },
    });

    const needsOverquotaNote = (request: AdvisorRequest) => {
        if (!request) return false;
        const remainingNormal = inbox.summary?.normalAvailable ?? 0;
        return remainingNormal <= 0;
    };

    const handleAccept = (request: AdvisorRequest) => {
        if (needsOverquotaNote(request)) {
            // F-1.2 + BR-26 (OQ-0.1.1): overquota wajib dual-justification. Bila request
            // ini bukan escalated (tanpa justifikasi mahasiswa), jangan buka dialog alasan
            // dosen (akan ditolak backend) — arahkan mahasiswa ajukan ulang jalur escalated.
            const hasStudentJustification = Boolean(
                (request.studentJustification || request.justificationText || '').trim(),
            );
            if (!hasStudentJustification) {
                toast.error(
                    'Kuota normal Anda penuh dan pengajuan ini belum memuat justifikasi akademik mahasiswa. Minta mahasiswa mengajukan ulang lewat TA-01 saat kuota penuh (dosen dengan kuota merah) agar dapat diteruskan ke KaDep.',
                );
                return;
            }
            setDetailDialog({ open: false, request: null, showActions: false });
            setAcceptDialog({ open: true, request });
            return;
        }

        respondMutation.mutate({ id: request.id, action: 'accept' });
    };

    const handleAcceptSubmit = () => {
        if (!acceptDialog.request) return;
        if (approvalNote.trim().length < 10) {
            toast.error('Alasan menerima di atas kuota normal minimal 10 karakter');
            return;
        }

        respondMutation.mutate({
            id: acceptDialog.request.id,
            action: 'accept',
            approvalNote,
            lecturerOverquotaReason: approvalNote,
        });
    };

    const handleRejectSubmit = () => {
        if (!rejectDialog.request) return;
        if (rejectionReason.trim().length < 5) {
            toast.error('Alasan penolakan minimal 5 karakter');
            return;
        }
        respondMutation.mutate({ id: rejectDialog.request.id, action: 'reject', rejectionReason });
    };

    const handleOpenDetail = (request: AdvisorRequest, showActions: boolean) => {
        setDetailDialog({ open: true, request, showActions });
    };

    const renderRequestCard = (request: AdvisorRequest, showActions: boolean) => {
        const cfg = getAdvisorRequestStatus(request.status);
        const isQuotaWarning = (inbox.summary?.normalAvailable ?? 0) <= 0;
        const isUnderReview = request.status === 'under_review';

        return (
            <Card key={request.id} className="overflow-hidden border-border/70 shadow-none transition-colors hover:border-primary/30">
                <CardContent className="p-0">
                    <div className="space-y-4 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/60 sm:h-11 sm:w-11">
                                <AvatarImage src={request.student?.user?.avatarUrl ?? undefined} />
                                <AvatarFallback>
                                    {request.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{request.student?.user?.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{request.student?.user?.identityNumber}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                                            {cfg.label}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                            {requestShortLabel(request)}
                                        </Badge>
                                        {isPathCRequest(request) && (
                                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-xs text-amber-800">
                                                Di atas kuota
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        Diajukan {formatDate(request.createdAt)}
                                    </span>
                                    <span>{request.topic?.name || 'Topik belum dipilih'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold leading-snug">
                                {request.proposedTitle || 'Judul belum tersedia'}
                            </p>
                            {request.backgroundSummary && (
                                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                    {request.backgroundSummary}
                                </p>
                            )}
                            {(request.researchObject || request.researchPermitStatus) && (
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    {request.researchObject && <span>Objek: {request.researchObject}</span>}
                                    {request.researchPermitStatus && (
                                        <span>{researchPermitStatusLabel[request.researchPermitStatus] || request.researchPermitStatus}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {(request.studentJustification || request.justificationText) && (
                            <div className="border-l-2 border-amber-400 pl-3 text-xs leading-relaxed">
                                <p className="font-medium text-foreground">Alasan memilih dosen ini</p>
                                <p className="mt-1 line-clamp-3 text-muted-foreground">
                                    {request.studentJustification || request.justificationText}
                                </p>
                            </div>
                        )}

                        {request.rejectionReason && (
                            <p className="text-xs text-destructive">Alasan ditolak: {request.rejectionReason}</p>
                        )}

                        {showActions && isQuotaWarning && (
                            <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>Kuota normal penuh. Penerimaan membutuhkan proyeksi lulus sebelum diteruskan ke KaDep.</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-xs text-muted-foreground">
                            {showActions
                                ? isUnderReview
                                    ? 'Pengajuan sudah ditandai sedang ditinjau.'
                                    : 'Tinjau substansi sebelum memberi keputusan.'
                                : 'Keputusan dan catatan tersimpan dalam riwayat.'}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
                            {showActions && request.status === 'pending' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markReviewMutation.mutate(request.id)}
                                    disabled={respondMutation.isPending || markReviewMutation.isPending}
                                >
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    {markReviewMutation.isPending ? 'Menandai...' : 'Tandai sedang ditinjau'}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant={showActions ? 'default' : 'outline'}
                                onClick={() => handleOpenDetail(request, showActions)}
                                disabled={respondMutation.isPending || markReviewMutation.isPending}
                            >
                                {showActions ? (isUnderReview ? 'Lanjutkan tinjauan' : 'Tinjau') : 'Lihat detail'}
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderPortfolioSection = (
        title: string,
        subtitle: string,
        items: AdvisorQuotaEntry[],
        tone: 'active' | 'booking' | 'pending' | null,
        emptyText: string,
    ) => (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{items.length} mahasiswa · {subtitle}</p>
            </div>
            {items.length === 0 ? (
                <Card>
                    <CardContent className="p-4 text-sm text-muted-foreground">{emptyText}</CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((entry) => (
                        <EntryCard
                            key={entry.id}
                            entry={entry}
                            tone={tone ?? (entry.bucket === 'active' ? 'active' : entry.bucket === 'pendingKadep' ? 'pending' : 'booking')}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    const tabItems = [
        { label: `Permintaan${inbox.pendingRequests.length > 0 ? ` (${inbox.pendingRequests.length})` : ''}`, value: 'pending' },
        { label: 'Kuota Aktif', value: 'portfolio' },
        { label: 'Riwayat', value: 'history' },
    ];

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                    Inbox Permintaan Bimbingan
                </h1>
                <p className="text-sm text-muted-foreground">
                    Permintaan bimbingan dari mahasiswa beserta snapshot kuota Anda saat ini.
                </p>
            </div>

            <Card className="overflow-hidden border-border/70 shadow-none">
                <CardContent className="p-0">
                    <div className="grid lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2fr)]">
                        <div className="border-b bg-muted/25 p-5 lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Gauge className="h-4 w-4" />
                                Kapasitas bimbingan
                            </div>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-3xl font-semibold tabular-nums">{inbox.summary?.normalAvailable ?? 0}</span>
                                <span className="pb-1 text-sm text-muted-foreground">sisa kuota normal</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Dari batas {inbox.summary?.quotaMax ?? 0} mahasiswa. Pengajuan di atas batas normal memerlukan validasi KaDep.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricAction
                                icon={<UserCheck className="h-3.5 w-3.5" />}
                                label="Beban aktif"
                                value={inbox.summary?.activeCount ?? 0}
                                tone="emerald"
                                active={activeTab === 'portfolio' && portfolioFocus === 'active'}
                                onClick={() => applyView('portfolio', 'active')}
                            />
                            <MetricAction
                                icon={<UsersRound className="h-3.5 w-3.5" />}
                                label="Booking"
                                value={inbox.summary?.bookingCount ?? 0}
                                tone="blue"
                                active={activeTab === 'portfolio' && portfolioFocus === 'booking'}
                                onClick={() => applyView('portfolio', 'booking')}
                            />
                            <MetricAction
                                label="Menunggu KaDep"
                                value={inbox.summary?.pendingKadepCount ?? 0}
                                tone="amber"
                                active={activeTab === 'portfolio' && portfolioFocus === 'pending'}
                                onClick={() => applyView('portfolio', 'pending')}
                            />
                            <MetricAction
                                label="Overquota sah"
                                value={overquotaSahCount}
                                tone="rose"
                                hint="Disetujui melalui jalur di atas kuota normal"
                                active={activeTab === 'portfolio' && portfolioFocus === 'overquota'}
                                onClick={() => applyView('portfolio', 'overquota')}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <LocalTabsNav
                tabs={tabItems}
                activeTab={activeTab}
                onTabChange={(value) => applyView(value as 'pending' | 'portfolio' | 'history')}
            />

            {activeTab === 'pending' && (
                <>
                    {inboxLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loading size="lg" text="Memuat permintaan..." />
                        </div>
                    ) : inbox.pendingRequests.length === 0 ? (
                        renderEmpty(
                            'Tidak ada permintaan baru',
                            'Permintaan bimbingan mahasiswa akan muncul di sini.'
                        )
                    ) : (
                        <div className="space-y-3">
                            {inbox.pendingRequests.map((request) => renderRequestCard(request, true))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'portfolio' && (
                <div className="space-y-6">
                    {portfolioFocus && (
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => applyView('portfolio')}>
                                Tampilkan seluruh komposisi kuota
                            </Button>
                        </div>
                    )}
                    {(!portfolioFocus || portfolioFocus === 'active') && renderPortfolioSection(
                        'Aktif Resmi',
                        'Mahasiswa yang sudah masuk beban bimbingan resmi aktif.',
                        inbox.activeOfficial,
                        'active',
                        'Belum ada bimbingan resmi aktif.'
                    )}
                    {(!portfolioFocus || portfolioFocus === 'booking') && renderPortfolioSection(
                        'Booking Pra-TA',
                        'Mahasiswa yang sudah disetujui dosen pada fase Metopen tetapi belum resmi TA-04.',
                        inbox.bookings,
                        'booking',
                        'Belum ada booking pembimbing aktif.'
                    )}
                    {(!portfolioFocus || portfolioFocus === 'pending') && renderPortfolioSection(
                        'Pending Validasi KaDep',
                        'Pengajuan yang Anda terima di atas kuota normal dan masih menunggu keputusan KaDep.',
                        inbox.pendingKadep,
                        'pending',
                        'Tidak ada pengajuan yang menunggu validasi KaDep.'
                    )}
                    {portfolioFocus === 'overquota' && renderPortfolioSection(
                        'Overquota Sah',
                        'Mahasiswa yang disetujui melalui jalur di atas kuota normal.',
                        overquotaEntries,
                        null,
                        'Tidak ada mahasiswa overquota sah pada komposisi kuota saat ini.'
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <>
                    {historyLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loading size="lg" text="Memuat riwayat..." />
                        </div>
                    ) : history.length === 0 ? (
                        renderEmpty(
                            'Belum ada riwayat',
                            'Riwayat pengajuan yang sudah Anda respon akan muncul di sini.'
                        )
                    ) : (
                        <div className="space-y-3">
                            {history.map((request) => renderRequestCard(request, false))}
                        </div>
                    )}
                </>
            )}

            <Dialog open={acceptDialog.open} onOpenChange={(open) => { if (!open) { setAcceptDialog({ open: false, request: null }); setApprovalNote(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Terima di Atas Kuota Normal</DialogTitle>
                        <DialogDescription>
                            Pengajuan dari <strong>{acceptDialog.request?.student?.user?.fullName}</strong> akan diteruskan ke validasi KaDep karena kuota normal Anda sedang penuh.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2">
                        {(acceptDialog.request?.studentJustification || acceptDialog.request?.justificationText) && (
                            <div className="rounded-md border bg-muted/40 p-3 text-sm">
                                <p className="text-xs font-medium text-muted-foreground">Justifikasi Akademik Mahasiswa</p>
                                <p className="mt-1 whitespace-pre-wrap">{acceptDialog.request.studentJustification || acceptDialog.request.justificationText}</p>
                            </div>
                        )}
                        <Label>Proyeksi Lulus Dosen *</Label>
                        <Textarea
                            placeholder="Jelaskan proyeksi lulus mahasiswa bimbingan eksisting yang membuat kuota efektif akan turun (minimal 10 karakter)..."
                            value={approvalNote}
                            onChange={(e) => setApprovalNote(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">{approvalNote.trim().length}/10 karakter minimum</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAcceptDialog({ open: false, request: null })}>
                            Batal
                        </Button>
                        <Button onClick={handleAcceptSubmit} disabled={respondMutation.isPending || approvalNote.trim().length < 10}>
                            {respondMutation.isPending ? 'Memproses...' : 'Terima & Kirim ke KaDep'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailDialog.open} onOpenChange={(open) => { if (!open) setDetailDialog({ open: false, request: null, showActions: false }); }}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-hidden gap-0 p-0">
                    <DialogHeader className="px-5 pb-3 pt-5">
                        <DialogTitle>Detail Pengajuan Pembimbing</DialogTitle>
                        <DialogDescription>
                            Snapshot data yang disubmit mahasiswa untuk ditinjau dosen sebelum memberi keputusan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[calc(90vh-170px)] w-full min-w-0 overflow-y-auto overflow-x-hidden">
                        <div className="w-full min-w-0 max-w-full space-y-4 px-5 pb-5">
                            {detailDialog.request && (
                                <>
                                    <DetailSection title="Mahasiswa">
                                        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                                            <DetailField label="Nama" value={toTitleCaseName(detailDialog.request.student?.user?.fullName)} />
                                            <DetailField label="NIM" value={detailDialog.request.student?.user?.identityNumber} />
                                            <DetailField label="Tanggal submit" value={formatDateId(detailDialog.request.createdAt)} />
                                            <DetailField label="Status" value={getAdvisorRequestStatus(detailDialog.request.status).label} />
                                            <DetailField label="Jenis pengajuan" value={requestTypeLabel[detailDialog.request.requestType] ?? detailDialog.request.requestType} />
                                        </div>
                                    </DetailSection>

                                    <DetailSection title="Topik dan Judul">
                                        <DetailField label="Topik" value={detailDialog.request.topic?.name} />
                                        <DetailField label="Judul yang diajukan" value={detailDialog.request.proposedTitle} />
                                    </DetailSection>

                                    <DetailSection title="Substansi Pengajuan">
                                        <div className="space-y-4">
                                            <DetailField label="Latar belakang singkat" value={detailDialog.request.backgroundSummary} />
                                            <DetailField label="Tujuan / permasalahan" value={detailDialog.request.problemStatement} />
                                            <DetailField label="Rencana solusi" value={detailDialog.request.proposedSolution} />
                                            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                                                <DetailField label="Objek penelitian" value={detailDialog.request.researchObject} />
                                                <DetailField
                                                    label="Status izin penelitian"
                                                    value={
                                                        detailDialog.request.researchPermitStatus
                                                            ? researchPermitStatusLabel[detailDialog.request.researchPermitStatus] ?? detailDialog.request.researchPermitStatus
                                                            : null
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </DetailSection>

                                    <DetailSection title="Justifikasi dan Catatan">
                                        <div className="space-y-4">
                                            <DetailField
                                                label="Justifikasi akademik mahasiswa"
                                                value={detailDialog.request.studentJustification || detailDialog.request.justificationText}
                                            />
                                            <DetailField label="Proyeksi lulus / alasan dosen" value={detailDialog.request.lecturerOverquotaReason || detailDialog.request.lecturerApprovalNote} />
                                            <DetailField label="Catatan KaDep" value={detailDialog.request.kadepNotes} />
                                            <DetailField label="Alasan penolakan" value={detailDialog.request.rejectionReason} />
                                        </div>
                                    </DetailSection>
                                </>
                            )}
                        </div>
                    </div>
                    {detailDialog.request && (
                        <>
                            <Separator />
                            <DialogFooter className="px-5 py-4">
                                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Button variant="outline" onClick={() => setDetailDialog({ open: false, request: null, showActions: false })}>
                                        Tutup
                                    </Button>
                                    {detailDialog.showActions && (
                                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                            <Button
                                                variant="destructive"
                                                onClick={() => {
                                                    setRejectDialog({ open: true, request: detailDialog.request });
                                                    setDetailDialog({ open: false, request: null, showActions: false });
                                                }}
                                                disabled={respondMutation.isPending || markReviewMutation.isPending}
                                            >
                                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                                Tolak
                                            </Button>
                                            <Button
                                                onClick={() => handleAccept(detailDialog.request!)}
                                                disabled={respondMutation.isPending || markReviewMutation.isPending}
                                            >
                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                                Terima
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, request: null }); setRejectionReason(''); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tolak Pengajuan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tolak pengajuan dari <strong>{rejectDialog.request?.student?.user?.fullName}</strong>.
                            Alasan penolakan akan terlihat oleh mahasiswa dan KaDep.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label>Alasan Penolakan *</Label>
                        <Textarea
                            placeholder="Jelaskan alasan penolakan (minimal 5 karakter)..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                            className="mt-2"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRejectDialog({ open: false, request: null })}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleRejectSubmit();
                            }}
                            disabled={respondMutation.isPending || rejectionReason.trim().length < 5}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {respondMutation.isPending ? 'Menolak...' : 'Tolak Pengajuan'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
