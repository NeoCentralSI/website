import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advisorRequestService, type AdvisorRequest } from '@/services/advisorRequest.service';
import { toast } from 'sonner';
import { useState } from 'react';
import { Inbox, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function InboxPembimbing() {
    const queryClient = useQueryClient();
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: AdvisorRequest | null }>({ open: false, request: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: inbox = [], isLoading } = useQuery({
        queryKey: ['dosen-inbox'],
        queryFn: async () => {
            const res = await advisorRequestService.getDosenInbox();
            return res.data;
        },
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, action, rejectionReason }: { id: string; action: 'accept' | 'reject'; rejectionReason?: string }) =>
            advisorRequestService.respondToRequest(id, { action, rejectionReason }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'accept' ? 'Pengajuan diterima' : 'Pengajuan ditolak');
            queryClient.invalidateQueries({ queryKey: ['dosen-inbox'] });
            setRejectDialog({ open: false, request: null });
            setRejectionReason('');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal merespon pengajuan');
        },
    });

    const handleAccept = (request: AdvisorRequest) => {
        respondMutation.mutate({ id: request.id, action: 'accept' });
    };

    const handleRejectSubmit = () => {
        if (!rejectDialog.request) return;
        if (rejectionReason.trim().length < 5) {
            toast.error('Alasan penolakan minimal 5 karakter');
            return;
        }
        respondMutation.mutate({ id: rejectDialog.request.id, action: 'reject', rejectionReason });
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Inbox className="h-6 w-6" />
                    Inbox Permintaan Bimbingan
                </h1>
                <p className="text-muted-foreground mt-1">
                    Permintaan bimbingan dari mahasiswa yang mengajukan Anda sebagai pembimbing.
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            ) : inbox.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Inbox className="h-14 w-14 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">Tidak ada permintaan baru</p>
                    <p className="text-sm">Permintaan bimbingan dari mahasiswa akan muncul di sini.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {inbox.map((request) => (
                        <Card key={request.id} className="transition-shadow hover:shadow-md">
                            <CardContent className="flex items-start gap-4 p-5">
                                <Avatar className="h-11 w-11 shrink-0">
                                    <AvatarImage src={request.student?.user?.avatarUrl ?? undefined} />
                                    <AvatarFallback>
                                        {request.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-sm">{request.student?.user?.fullName}</p>
                                            <p className="text-xs text-muted-foreground">{request.student?.user?.identityNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDate(request.createdAt)}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <Badge variant="secondary">{request.topic?.name}</Badge>
                                        {request.proposedTitle && (
                                            <span className="text-muted-foreground truncate">"{request.proposedTitle}"</span>
                                        )}
                                    </div>
                                    {request.backgroundSummary && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{request.backgroundSummary}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAccept(request)}
                                        disabled={respondMutation.isPending}
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
                                        disabled={respondMutation.isPending}
                                    >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        Tolak
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, request: null }); setRejectionReason(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Pengajuan</DialogTitle>
                        <DialogDescription>
                            Tolak pengajuan dari <strong>{rejectDialog.request?.student?.user?.fullName}</strong>.
                            Alasan penolakan akan terlihat oleh mahasiswa dan Kepala Departemen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label>Alasan Penolakan *</Label>
                        <Textarea
                            placeholder="Jelaskan alasan penolakan (min. 5 karakter)..."
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
