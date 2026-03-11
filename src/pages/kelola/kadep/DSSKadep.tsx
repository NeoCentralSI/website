import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advisorRequestService, type AdvisorRequest, type AlternativeLecturer } from '@/services/advisorRequest.service';
import { toast } from 'sonner';
import { Scale, ShieldCheck, ArrowRightLeft, CheckCircle2, GraduationCap, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function DSSKadep() {
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<AdvisorRequest | null>(null);
    const [alternatives, setAlternatives] = useState<AlternativeLecturer[]>([]);
    const [loadingAlts, setLoadingAlts] = useState(false);
    const [kadepNotes, setKadepNotes] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'override' | 'redirect' | 'assign'; targetId?: string; targetName?: string }>({
        open: false, action: 'override',
    });

    const { data: queue, isLoading } = useQuery({
        queryKey: ['kadep-queue'],
        queryFn: async () => {
            const res = await advisorRequestService.getKadepQueue();
            return res.data;
        },
    });

    const decideMutation = useMutation({
        mutationFn: ({ id, action, targetLecturerId, notes }: { id: string; action: 'override' | 'redirect'; targetLecturerId?: string; notes?: string }) =>
            advisorRequestService.decideRequest(id, { action, targetLecturerId, notes }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'override' ? 'Setujui tembus batas berhasil' : 'Pengalihan berhasil');
            queryClient.invalidateQueries({ queryKey: ['kadep-queue'] });
            setSelectedRequest(null);
            setKadepNotes('');
            setConfirmDialog({ open: false, action: 'override' });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const assignMutation = useMutation({
        mutationFn: (id: string) => advisorRequestService.assignAdvisor(id),
        onSuccess: () => {
            toast.success('Pembimbing berhasil ditetapkan!');
            queryClient.invalidateQueries({ queryKey: ['kadep-queue'] });
            setConfirmDialog({ open: false, action: 'assign' });
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
            // not critical
        } finally {
            setLoadingAlts(false);
        }
    };

    const handleConfirmAction = () => {
        if (!selectedRequest) return;
        if (confirmDialog.action === 'assign') {
            assignMutation.mutate(selectedRequest.id);
        } else {
            decideMutation.mutate({
                id: selectedRequest.id,
                action: confirmDialog.action,
                targetLecturerId: confirmDialog.targetId,
                notes: kadepNotes,
            });
        }
    };

    const statusLabel: Record<string, string> = {
        escalated: 'Menunggu Keputusan',
        approved: 'Dosen Menyetujui',
        override_approved: 'Tembus Batas',
        redirected: 'Dialihkan',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Scale className="h-6 w-6" />
                    Penyeimbang Beban Pembimbing
                </h1>
                <p className="text-muted-foreground mt-1">
                    Kelola pengajuan pembimbing yang membutuhkan keputusan Anda.
                </p>
            </div>

            <Tabs defaultValue="escalated">
                <TabsList>
                    <TabsTrigger value="escalated" className="gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Eskalasi
                        {(queue?.escalated?.length ?? 0) > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs px-1.5">
                                {queue?.escalated?.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Penetapan
                        {(queue?.pendingAssignment?.length ?? 0) > 0 && (
                            <Badge className="ml-1 h-5 min-w-5 text-xs px-1.5 bg-blue-500">
                                {queue?.pendingAssignment?.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Escalation Tab */}
                <TabsContent value="escalated">
                    {isLoading ? (
                        <div className="space-y-3"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
                    ) : (queue?.escalated ?? []).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Tidak ada pengajuan eskalasi</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                            {/* Left: Request List */}
                            <div className="space-y-3">
                                <h3 className="font-medium text-sm text-muted-foreground">Pengajuan Masuk</h3>
                                {queue?.escalated?.map((req) => (
                                    <Card
                                        key={req.id}
                                        className={`cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`}
                                        onClick={() => handleSelectRequest(req)}
                                    >
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {req.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{req.student?.user?.fullName}</p>
                                                        <p className="text-xs text-muted-foreground">{req.student?.user?.identityNumber}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Eskalasi</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Mengajukan: <strong>{req.lecturer?.user?.fullName}</strong> ({req.topic?.name})
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Right: Decision Panel */}
                            <div>
                                {!selectedRequest ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm border rounded-lg p-8">
                                        Pilih pengajuan untuk melihat detail dan rekomendasi
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Detail Pengajuan</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Dosen Tujuan</span>
                                                    <span className="font-medium text-red-700">{selectedRequest.lecturer?.user?.fullName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Kuota</span>
                                                    <span className="font-medium">
                                                        {selectedRequest.lecturer?.supervisionQuotas?.[0]?.currentCount ?? '?'}/
                                                        {selectedRequest.lecturer?.supervisionQuotas?.[0]?.quotaMax ?? '?'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Topik</span>
                                                    <span className="font-medium">{selectedRequest.topic?.name}</span>
                                                </div>
                                                {selectedRequest.proposedTitle && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Judul</span>
                                                        <span className="font-medium text-right max-w-[60%]">{selectedRequest.proposedTitle}</span>
                                                    </div>
                                                )}
                                                <Separator />
                                                <div>
                                                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        Alasan Justifikasi Mahasiswa
                                                    </p>
                                                    <p className="bg-muted/50 rounded-md p-3 text-sm italic">
                                                        "{selectedRequest.justificationText || '-'}"
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Recommendations */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center gap-1.5">
                                                    <GraduationCap className="h-4 w-4" />
                                                    Rekomendasi Dosen Alternatif
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {loadingAlts ? (
                                                    <div className="space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
                                                ) : alternatives.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">Tidak ada dosen alternatif di KBK yang sama</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {alternatives.map((alt, i) => (
                                                            <div key={alt.lecturerId} className="flex items-center justify-between p-2.5 rounded-md border hover:bg-muted/50 transition-colors">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                                                                    <div>
                                                                        <p className="text-sm font-medium">{alt.fullName}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {alt.scienceGroup?.name} • Sisa: {alt.remaining}/{alt.quotaMax}
                                                                            {alt.sameTopicCount > 0 && ` • ${alt.sameTopicCount}x topik serupa`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setConfirmDialog({ open: true, action: 'redirect', targetId: alt.lecturerId, targetName: alt.fullName })}
                                                                >
                                                                    <ArrowRightLeft className="h-3 w-3 mr-1" />
                                                                    Alihkan
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <Label>Catatan KaDep (Opsional)</Label>
                                            <Textarea
                                                value={kadepNotes}
                                                onChange={(e) => setKadepNotes(e.target.value)}
                                                placeholder="Catatan internal untuk keputusan ini..."
                                                rows={2}
                                            />
                                        </div>
                                        <Button
                                            className="w-full bg-amber-600 hover:bg-amber-700"
                                            onClick={() => setConfirmDialog({ open: true, action: 'override' })}
                                        >
                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                            Setujui Tembus Batas
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Assignment Tab */}
                <TabsContent value="assignment">
                    {(queue?.pendingAssignment ?? []).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Semua pembimbing sudah ditetapkan</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mt-4">
                            {queue?.pendingAssignment?.map((req) => {
                                const assignTarget = req.status === 'redirected' && req.redirectTarget
                                    ? req.redirectTarget.user?.fullName
                                    : req.lecturer?.user?.fullName;

                                return (
                                    <Card key={req.id}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="text-xs">
                                                        {req.student?.user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{req.student?.user?.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {statusLabel[req.status] || req.status} → Pembimbing: <strong>{assignTarget}</strong>
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setConfirmDialog({ open: true, action: 'assign' });
                                                }}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                Tetapkan
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: 'override' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.action === 'override' && 'Setujui Tembus Batas'}
                            {confirmDialog.action === 'redirect' && 'Alihkan Pembimbing'}
                            {confirmDialog.action === 'assign' && 'Tetapkan Pembimbing'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.action === 'override' && 'Mahasiswa akan ditempatkan ke dosen yang sudah penuh. Pastikan alasan mahasiswa cukup kuat.'}
                            {confirmDialog.action === 'redirect' && `Pengajuan akan dialihkan ke ${confirmDialog.targetName}.`}
                            {confirmDialog.action === 'assign' && 'Tindakan ini akan meresmikan pembimbing dan membuat record ThesisSupervisors.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: 'override' })}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirmAction}
                            disabled={decideMutation.isPending || assignMutation.isPending}
                            className={confirmDialog.action === 'override' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                        >
                            {(decideMutation.isPending || assignMutation.isPending) ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
