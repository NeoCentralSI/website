import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    advisorRequestService,
    type AdvisorQuotaEntry,
    type AdvisorRequest,
    type DosenInboxPayload,
} from '@/services/advisorRequest.service';
import { toast } from 'sonner';
import { useState, useEffect, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Inbox, CheckCircle2, XCircle, Clock, History, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { Loading } from '@/components/ui/spinner';

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Menunggu', className: 'bg-blue-500/15 text-blue-700 border-blue-200' },
    under_review: { label: 'Sedang Ditinjau', className: 'bg-indigo-500/15 text-indigo-700 border-indigo-200' },
    pending_kadep: { label: 'Menunggu KaDep', className: 'bg-purple-500/15 text-purple-700 border-purple-200' },
    booking_approved: { label: 'Booking Disetujui', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-200' },
    active_official: { label: 'Aktif Resmi', className: 'bg-green-500/15 text-green-700 border-green-200' },
    rejected_by_dosen: { label: 'Ditolak Dosen', className: 'bg-red-500/15 text-red-700 border-red-200' },
    rejected_by_kadep: { label: 'Ditolak KaDep', className: 'bg-red-500/15 text-red-700 border-red-200' },
    canceled: { label: 'Dibatalkan', className: 'bg-gray-500/15 text-muted-foreground border-border' },
    escalated: { label: 'Eskalasi Legacy', className: 'bg-purple-500/15 text-purple-700 border-purple-200' },
    approved: { label: 'Disetujui Legacy', className: 'bg-green-500/15 text-green-700 border-green-200' },
    rejected: { label: 'Ditolak Legacy', className: 'bg-red-500/15 text-red-700 border-red-200' },
    override_approved: { label: 'Override Legacy', className: 'bg-green-500/15 text-green-700 border-green-200' },
    redirected: { label: 'Dialihkan', className: 'bg-amber-500/15 text-amber-700 border-amber-200' },
    withdrawn: { label: 'Ditarik', className: 'bg-gray-500/15 text-muted-foreground border-border' },
    assigned: { label: 'Ditetapkan', className: 'bg-green-500/15 text-green-700 border-green-200' },
};

const researchPermitStatusLabel: Record<string, string> = {
    approved: 'Izin disetujui',
    in_process: 'Izin dalam proses',
    not_approved: 'Izin belum disetujui',
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderEmpty(icon: ReactNode, title: string, subtitle: string) {
    return (
        <div className="text-center py-16 text-muted-foreground">
            {icon}
            <p className="text-lg font-medium">{title}</p>
            <p className="text-sm">{subtitle}</p>
        </div>
    );
}

function EntryCard({ entry, tone }: { entry: AdvisorQuotaEntry; tone: 'active' | 'booking' | 'pending'; }) {
    const toneClass = tone === 'active'
        ? 'border-green-200 bg-green-50/40'
        : tone === 'booking'
            ? 'border-emerald-200 bg-emerald-50/40'
            : 'border-purple-200 bg-purple-50/40';

    return (
        <Card className={toneClass}>
            <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={entry.studentAvatarUrl ?? undefined} />
                        <AvatarFallback>
                            {entry.studentName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{entry.studentName}</p>
                                <p className="text-xs text-muted-foreground">{entry.studentIdentityNumber || '-'}</p>
                            </div>
                            <Badge variant="outline" className={`text-xs ${statusConfig[entry.requestStatus]?.className ?? ''}`}>
                                {statusConfig[entry.requestStatus]?.label ?? entry.requestStatus}
                            </Badge>
                        </div>
                        <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            <p>Judul: {entry.thesisTitle || '-'}</p>
                            <p>Topik: {entry.topicName || '-'}</p>
                            {entry.roleName && <p>Role: {entry.roleName}</p>}
                            {entry.lecturerApprovalNote && <p>Catatan dosen: {entry.lecturerApprovalNote}</p>}
                            {entry.kadepNotes && <p>Catatan KaDep: {entry.kadepNotes}</p>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function InboxPembimbing() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    useEffect(() => {
        setBreadcrumbs([{ label: 'Inbox Pembimbing' }]);
        setTitle(undefined);
    }, [setBreadcrumbs, setTitle]);

    const queryClient = useQueryClient();
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: AdvisorRequest | null }>({ open: false, request: null });
    const [acceptDialog, setAcceptDialog] = useState<{ open: boolean; request: AdvisorRequest | null }>({ open: false, request: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalNote, setApprovalNote] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

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

    const respondMutation = useMutation({
        mutationFn: ({ id, action, approvalNote: nextApprovalNote, lecturerOverquotaReason, rejectionReason: nextReason }: { id: string; action: 'accept' | 'reject'; approvalNote?: string; lecturerOverquotaReason?: string; rejectionReason?: string }) =>
            advisorRequestService.respondToRequest(id, { action, approvalNote: nextApprovalNote, lecturerOverquotaReason, rejectionReason: nextReason }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'accept' ? 'Pengajuan berhasil diproses.' : 'Pengajuan ditolak.');
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox'] });
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox-history'] });
            setRejectDialog({ open: false, request: null });
            setAcceptDialog({ open: false, request: null });
            setRejectionReason('');
            setApprovalNote('');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal merespon pengajuan');
        },
    });

    const markReviewMutation = useMutation({
        mutationFn: (id: string) => advisorRequestService.markUnderReview(id),
        onSuccess: () => {
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

    const renderRequestCard = (request: AdvisorRequest, showActions: boolean) => {
        const cfg = statusConfig[request.status] ?? { label: request.status, className: '' };
        const isQuotaWarning = (inbox.summary?.normalAvailable ?? 0) <= 0;

        return (
            <Card key={request.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                            <AvatarImage src={request.student?.user?.avatarUrl ?? undefined} />
                            <AvatarFallback>
                                {request.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{request.student?.user?.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{request.student?.user?.identityNumber}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {!showActions && (
                                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                                            {cfg.label}
                                        </Badge>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDate(request.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="secondary">{request.topic?.name}</Badge>
                                {request.proposedTitle && (
                                    <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-none">"{request.proposedTitle}"</span>
                                )}
                            </div>
                            {request.backgroundSummary && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{request.backgroundSummary}</p>
                            )}
                            {(request.researchObject || request.researchPermitStatus) && (
                                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                    {request.researchObject && <span>Objek: {request.researchObject}</span>}
                                    {request.researchPermitStatus && (
                                        <span>
                                            {researchPermitStatusLabel[request.researchPermitStatus] || request.researchPermitStatus}
                                        </span>
                                    )}
                                </div>
                            )}
                            {(request.studentJustification || request.justificationText) && (
                                <p className="text-xs text-muted-foreground">Justifikasi mahasiswa: {request.studentJustification || request.justificationText}</p>
                            )}
                            {request.rejectionReason && (
                                <p className="text-xs text-red-600">Alasan ditolak: {request.rejectionReason}</p>
                            )}
                        </div>
                    </div>

                    {showActions && isQuotaWarning && (
                        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Kuota normal Anda sedang penuh. Jika menerima pengajuan ini, sistem akan meminta alasan lalu meneruskannya ke validasi KaDep.</span>
                        </div>
                    )}

                    {showActions && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                            <Button
                                size="sm"
                                onClick={() => handleAccept(request)}
                                disabled={respondMutation.isPending || markReviewMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Terima
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setRejectDialog({ open: true, request })}
                                disabled={respondMutation.isPending || markReviewMutation.isPending}
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Tolak
                            </Button>
                            {request.status === 'pending' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    onClick={() => markReviewMutation.mutate(request.id)}
                                    disabled={respondMutation.isPending || markReviewMutation.isPending}
                                >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    {markReviewMutation.isPending ? 'Menandai...' : 'Sedang Ditinjau'}
                                </Button>
                            )}
                            {request.status === 'under_review' && (
                                <Badge variant="outline" className="text-xs bg-indigo-500/15 text-indigo-700 border-indigo-200">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Anda sedang meninjau
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const renderPortfolioSection = (
        title: string,
        subtitle: string,
        items: AdvisorQuotaEntry[],
        tone: 'active' | 'booking' | 'pending',
        emptyText: string,
    ) => (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {items.length === 0 ? (
                <Card>
                    <CardContent className="p-4 text-sm text-muted-foreground">{emptyText}</CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} tone={tone} />
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
                <p className="text-xs text-muted-foreground sm:text-sm">
                    Permintaan bimbingan dari mahasiswa beserta snapshot kuota Anda saat ini.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Kuota Maksimal</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{inbox.summary?.quotaMax ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Beban Aktif</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{inbox.summary?.activeCount ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Booking</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{inbox.summary?.bookingCount ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Pending KaDep</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{inbox.summary?.pendingKadepCount ?? 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Sisa Normal</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{inbox.summary?.normalAvailable ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className={(inbox.summary?.overquotaAmount ?? 0) > 0 ? 'border-red-200 bg-red-50/40' : ''}>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Overquota Sah</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{inbox.summary?.overquotaAmount ?? 0}</p>
                    </CardContent>
                </Card>
            </div>

            <LocalTabsNav tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'pending' && (
                <>
                    {inboxLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loading size="lg" text="Memuat permintaan..." />
                        </div>
                    ) : inbox.pendingRequests.length === 0 ? (
                        renderEmpty(
                            <Inbox className="h-14 w-14 mx-auto mb-3 opacity-30" />,
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
                    {renderPortfolioSection(
                        'Aktif Resmi',
                        'Mahasiswa yang sudah masuk beban bimbingan resmi aktif.',
                        inbox.activeOfficial,
                        'active',
                        'Belum ada bimbingan resmi aktif.'
                    )}
                    {renderPortfolioSection(
                        'Booking Pra-TA',
                        'Mahasiswa yang sudah disetujui dosen pada fase Metopen tetapi belum resmi TA-04.',
                        inbox.bookings,
                        'booking',
                        'Belum ada booking pembimbing aktif.'
                    )}
                    {renderPortfolioSection(
                        'Pending Validasi KaDep',
                        'Pengajuan yang Anda terima di atas kuota normal dan masih menunggu keputusan KaDep.',
                        inbox.pendingKadep,
                        'pending',
                        'Tidak ada pengajuan yang menunggu validasi KaDep.'
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
                            <History className="h-14 w-14 mx-auto mb-3 opacity-30" />,
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAcceptDialog({ open: false, request: null })}>
                            Batal
                        </Button>
                        <Button onClick={handleAcceptSubmit} disabled={respondMutation.isPending}>
                            {respondMutation.isPending ? 'Memproses...' : 'Terima & Kirim ke KaDep'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, request: null }); setRejectionReason(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Pengajuan</DialogTitle>
                        <DialogDescription>
                            Tolak pengajuan dari <strong>{rejectDialog.request?.student?.user?.fullName}</strong>.
                            Alasan penolakan akan terlihat oleh mahasiswa dan KaDep.
                        </DialogDescription>
                    </DialogHeader>
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null })}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleRejectSubmit} disabled={respondMutation.isPending}>
                            {respondMutation.isPending ? 'Menolak...' : 'Tolak Pengajuan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
