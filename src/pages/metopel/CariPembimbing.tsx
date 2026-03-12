import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { advisorRequestService, type LecturerCatalogItem } from '@/services/advisorRequest.service';
import { useAdvisorAccessState } from '@/hooks/shared';
import { toast } from 'sonner';
import { Search, User, GraduationCap, AlertCircle, Clock, Send, XCircle, Users, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loading } from '@/components/ui/spinner';

interface SubmitFormData {
    lecturerId: string;
    topicId: string;
    proposedTitle: string;
    backgroundSummary: string;
    justificationText: string;
}

const trafficLightConfig = {
    green: { label: 'Tersedia', color: 'bg-emerald-500', badgeVariant: 'default' as const, badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-200' },
    yellow: { label: 'Hampir Penuh', color: 'bg-amber-500', badgeVariant: 'default' as const, badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-200' },
    red: { label: 'Penuh', color: 'bg-red-500 text-white', badgeVariant: 'default' as const, badgeClass: 'bg-red-500/15 text-red-700 border-red-200' },
};

export default function CariPembimbing() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [kbkFilter, setKbkFilter] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<LecturerCatalogItem | null>(null);
    const [formData, setFormData] = useState<SubmitFormData>({
        lecturerId: '',
        topicId: '',
        proposedTitle: '',
        backgroundSummary: '',
        justificationText: '',
    });
    const {
        data: advisorAccess,
        isLoading: accessLoading,
    } = useAdvisorAccessState();
    const canBrowseCatalog = advisorAccess?.canBrowseCatalog ?? false;
    const blockingRequest = advisorAccess?.blockingRequest ?? null;
    const activeRequest = blockingRequest && ['pending', 'escalated'].includes(blockingRequest.status)
        ? blockingRequest
        : null;

    // Fetch catalog
    const { data: catalog = [], isLoading: catalogLoading } = useQuery({
        queryKey: ['advisor-catalog'],
        queryFn: async () => {
            const res = await advisorRequestService.getCatalog();
            return res.data;
        },
        enabled: canBrowseCatalog,
    });

    // Fetch topics for select
    const { data: topics = [] } = useQuery({
        queryKey: ['thesis-topics'],
        queryFn: async () => {
            const { getApiUrl } = await import('@/config/api');
            const { apiRequest } = await import('@/services/auth.service');
            const url = getApiUrl('/topics');
            const response = await apiRequest(url);
            if (!response.ok) throw new Error('Gagal mengambil topik');
            const json = await response.json() as { data: Array<{ id: string; name: string }> };
            return json.data ?? [];
        },
        enabled: canBrowseCatalog,
    });

    const submitMutation = useMutation({
        mutationFn: (data: SubmitFormData) => advisorRequestService.submitRequest(data),
        onSuccess: () => {
            toast.success('Pengajuan berhasil dikirim!');
            queryClient.invalidateQueries({ queryKey: ['advisor-access-state'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-catalog'] });
            setDialogOpen(false);
            resetForm();
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal mengirim pengajuan');
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: (id: string) => advisorRequestService.withdrawRequest(id),
        onSuccess: () => {
            toast.success('Pengajuan berhasil ditarik');
            queryClient.invalidateQueries({ queryKey: ['advisor-access-state'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-catalog'] });
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal menarik pengajuan');
        },
    });

    const resetForm = () => {
        setFormData({ lecturerId: '', topicId: '', proposedTitle: '', backgroundSummary: '', justificationText: '' });
        setSelectedLecturer(null);
    };

    const handleOpenDialog = (lecturer: LecturerCatalogItem) => {
        setSelectedLecturer(lecturer);
        setFormData((prev) => ({ ...prev, lecturerId: lecturer.lecturerId }));
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.topicId) {
            toast.error('Pilih topik penelitian');
            return;
        }
        submitMutation.mutate(formData);
    };

    if (accessLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loading size="lg" text="Memeriksa akses pencarian pembimbing..." />
            </div>
        );
    }

    if (!advisorAccess?.canBrowseCatalog) {
        if (advisorAccess?.hasOfficialSupervisor) {
            return (
                <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50/80">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {advisorAccess.reason}
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {advisorAccess.supervisors.map((supervisor) => (
                            <Card key={supervisor.id} className="border-green-200 bg-green-50/30">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <Avatar className="h-10 w-10 ring-1 ring-green-200">
                                        <AvatarFallback>
                                            {supervisor.name?.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-sm">{supervisor.name}</p>
                                        <p className="text-xs text-muted-foreground">{supervisor.role || 'Pembimbing'}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-white text-green-700 border-green-200">
                                        Aktif
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {advisorAccess.canOpenLogbook && (
                        <Button asChild className="w-full sm:w-auto">
                            <Link to="/metopel/logbook">Buka Logbook Bimbingan</Link>
                        </Button>
                    )}
                </div>
            );
        }

        if (activeRequest) {
            return (
                <div className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50/80 flex flex-col items-start gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                            <AlertDescription className="text-blue-800 text-sm leading-relaxed">
                                <span className="font-medium">Pengajuan aktif: </span>
                                Anda sudah mengajukan ke{' '}
                                <strong>{activeRequest.lecturer?.user?.fullName}</strong> (status:{' '}
                                <Badge variant="outline" className="ml-1 bg-white">
                                    {activeRequest.status}
                                </Badge>
                                ). Tunggu respon atau tarik pengajuan sebelum mengajukan ke dosen lain.
                            </AlertDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8"
                                    disabled={withdrawMutation.isPending}
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    {withdrawMutation.isPending ? 'Menarik...' : 'Tarik Pengajuan'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tarik Pengajuan?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Pengajuan ke <strong>{activeRequest.lecturer?.user?.fullName}</strong> akan dibatalkan. Anda dapat mengajukan ke dosen lain setelah penarikan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => withdrawMutation.mutate(activeRequest.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Ya, Tarik Pengajuan
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </Alert>

                    <Card className="border-blue-200 bg-blue-50/20">
                        <CardContent className="p-4 text-sm text-blue-900">
                            {advisorAccess?.reason}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        if (advisorAccess?.hasBlockingRequest) {
            return (
                <div className="space-y-4">
                    <Alert className="border-amber-200 bg-amber-50/80">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            {advisorAccess.reason}
                        </AlertDescription>
                    </Alert>
                    <Card className="border-amber-200 bg-amber-50/20">
                        <CardContent className="p-4 text-sm text-amber-900">
                            Status pengajuan saat ini: <strong>{advisorAccess.requestStatus}</strong>.
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50/80">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        {advisorAccess?.reason || 'Pencarian pembimbing belum tersedia.'}
                    </AlertDescription>
                </Alert>

                {advisorAccess?.gates?.length ? (
                    <div className="space-y-3">
                        {advisorAccess.gates.map((gate) => (
                            <Card key={gate.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium text-sm">{gate.templateName}</p>
                                        <p className="text-xs text-muted-foreground">{gate.title}</p>
                                    </div>
                                    <Badge variant={gate.isCompleted ? 'secondary' : 'outline'}>
                                        {gate.isCompleted ? 'Selesai' : gate.status}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : null}

                <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/metopel">Kembali ke Overview</Link>
                </Button>
            </div>
        );
    }

    // Unique KBK list for filter
    const kbkList = [...new Set(catalog.map((l: LecturerCatalogItem) => l.scienceGroup?.name).filter((name): name is string => !!name))];

    // Filter catalog
    const filtered = catalog.filter((l: LecturerCatalogItem) => {
        const matchesSearch =
            !search ||
            l.fullName.toLowerCase().includes(search.toLowerCase()) ||
            l.identityNumber.includes(search);
        const matchesKbk = kbkFilter === 'all' || l.scienceGroup?.name === kbkFilter;
        return matchesSearch && matchesKbk;
    });

    const availabilityStats = {
        total: filtered.length,
        green: filtered.filter((l) => l.trafficLight === 'green').length,
        yellow: filtered.filter((l) => l.trafficLight === 'yellow').length,
        red: filtered.filter((l) => l.trafficLight === 'red').length,
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Active Request Banner - moved to top since header is gone */}
            {activeRequest && (
                <Alert className="border-blue-200 bg-blue-50/80 flex flex-col items-start gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                        <AlertDescription className="text-blue-800 text-sm leading-relaxed">
                            <span className="font-medium">Pengajuan aktif: </span>
                            Anda sudah mengajukan ke{' '}
                            <strong>{activeRequest.lecturer?.user?.fullName}</strong> (status:{' '}
                            <Badge variant="outline" className="ml-1 bg-white">
                                {activeRequest.status}
                            </Badge>
                            ). Tunggu respon atau tarik pengajuan sebelum mengajukan ke dosen lain.
                        </AlertDescription>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8"
                                disabled={withdrawMutation.isPending}
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                {withdrawMutation.isPending ? 'Menarik...' : 'Tarik Pengajuan'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tarik Pengajuan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Pengajuan ke <strong>{activeRequest.lecturer?.user?.fullName}</strong> akan dibatalkan. Anda dapat mengajukan ke dosen lain setelah penarikan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => withdrawMutation.mutate(activeRequest.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Ya, Tarik Pengajuan
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </Alert>
            )}

            {/* Search, Filter, and quick summary */}
            <div className="rounded-xl border bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari berdasarkan nama atau NIP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-background"
                        />
                    </div>
                    <Select value={kbkFilter} onValueChange={setKbkFilter}>
                        <SelectTrigger className="w-full sm:w-[230px] bg-background">
                            <div className="inline-flex items-center gap-2">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Filter KBK" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua KBK</SelectItem>
                            {kbkList.map((kbk) => (
                                <SelectItem key={kbk} value={kbk}>{kbk}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    <div className="rounded-lg border bg-background p-2.5 sm:p-3">
                        <p className="text-[11px] sm:text-xs text-muted-foreground">Dosen ditampilkan</p>
                        <p className="mt-0.5 text-sm sm:text-base font-semibold inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {availabilityStats.total}
                        </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 sm:p-3">
                        <p className="text-[11px] sm:text-xs text-emerald-700">Tersedia</p>
                        <p className="mt-0.5 text-sm sm:text-base font-semibold text-emerald-800">{availabilityStats.green}</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 sm:p-3">
                        <p className="text-[11px] sm:text-xs text-amber-700">Hampir penuh</p>
                        <p className="mt-0.5 text-sm sm:text-base font-semibold text-amber-800">{availabilityStats.yellow}</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50/60 p-2.5 sm:p-3">
                        <p className="text-[11px] sm:text-xs text-red-700">Penuh / overload</p>
                        <p className="mt-0.5 text-sm sm:text-base font-semibold text-red-800">{availabilityStats.red}</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Tersedia
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Hampir Penuh
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    Penuh / Overload
                </span>
            </div>

            {/* Card Grid */}
            {catalogLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loading size="lg" text="Memuat katalog dosen..." />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 rounded-xl border bg-muted/20">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <User className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="font-semibold text-foreground/80 text-sm">
                        {search || kbkFilter !== 'all' ? "Tidak ada dosen yang cocok" : "Katalog dosen kosong"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        {search || kbkFilter !== 'all'
                            ? "Coba ubah kata kunci pencarian atau filter KBK."
                            : "Belum ada data dosen pembimbing yang tersedia saat ini."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((lecturer) => {
                        const config = trafficLightConfig[lecturer.trafficLight];
                        return (
                            <Card key={lecturer.lecturerId} className="relative overflow-hidden border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
                                {/* Traffic light indicator stripe */}
                                <div className={`absolute top-0 left-0 right-0 h-1 ${config.color}`} />

                                <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-4">
                                    <Avatar className="h-11 w-11 ring-1 ring-border/60">
                                        <AvatarImage src={lecturer.avatarUrl ?? undefined} alt={lecturer.fullName} />
                                        <AvatarFallback className="text-sm font-medium">
                                            {lecturer.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm leading-tight truncate">{lecturer.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{lecturer.identityNumber}</p>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 text-xs ${config.badgeClass}`}>
                                        {config.label}
                                    </Badge>
                                </CardHeader>

                                <CardContent className="pb-3 space-y-3">
                                    {lecturer.scienceGroup && (
                                        <div className="inline-flex w-fit items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{lecturer.scienceGroup.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between rounded-md border bg-background px-2 py-1.5 text-xs">
                                        <span className="text-muted-foreground">Kuota Bimbingan</span>
                                        <span className="font-medium">
                                            {lecturer.currentCount}/{lecturer.quotaMax}
                                            <span className="text-muted-foreground ml-1">({lecturer.remaining} sisa)</span>
                                        </span>
                                    </div>
                                    {lecturer.supervisedTopics.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {lecturer.supervisedTopics.slice(0, 3).map((topic: string) => (
                                                <Badge key={topic} variant="secondary" className="text-[10px] px-2 py-0.5">
                                                    {topic}
                                                </Badge>
                                            ))}
                                            {lecturer.supervisedTopics.length > 3 && (
                                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                                    +{lecturer.supervisedTopics.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-0 pb-3">
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        disabled={!!activeRequest}
                                        onClick={() => handleOpenDialog(lecturer)}
                                    >
                                        {lecturer.trafficLight === 'red' ? (
                                            <>
                                                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Ajukan (Eskalasi)
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                                Ajukan
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Submit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Pengajuan Dosen Pembimbing</DialogTitle>
                        <DialogDescription>
                            {selectedLecturer && (
                                <span>
                                    Mengajukan ke <strong>{selectedLecturer.fullName}</strong>
                                    {selectedLecturer.trafficLight === 'red' && (
                                        <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-700 border-red-200">
                                            Eskalasi ke KaDep
                                        </Badge>
                                    )}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {selectedLecturer?.trafficLight === 'red' && (
                            <Alert className="border-amber-200 bg-amber-50">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800 text-sm">
                                    Dosen ini sudah mencapai batas kuota. Pengajuan Anda akan dikirim ke <strong>Kepala Departemen</strong>
                                    {' '}untuk diputuskan. Wajib mengisi alasan justifikasi.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label>Topik Penelitian *</Label>
                            <Select value={formData.topicId} onValueChange={(val) => setFormData((p) => ({ ...p, topicId: val }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih topik..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {topics.map((t: { id: string; name: string }) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Judul Proposal (Opsional)</Label>
                            <Input
                                placeholder="Judul rencana tugas akhir..."
                                value={formData.proposedTitle}
                                onChange={(e) => setFormData((p) => ({ ...p, proposedTitle: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Ringkasan Latar Belakang (Opsional)</Label>
                            <Textarea
                                placeholder="Deskripsikan singkat latar belakang penelitian..."
                                value={formData.backgroundSummary}
                                onChange={(e) => setFormData((p) => ({ ...p, backgroundSummary: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        {selectedLecturer?.trafficLight === 'red' && (
                            <div className="space-y-2">
                                <Label className="text-red-700">Alasan Justifikasi *</Label>
                                <Textarea
                                    placeholder="Kenapa harus dosen ini? Apa alasan spesifiknya? (min. 20 karakter)"
                                    value={formData.justificationText}
                                    onChange={(e) => setFormData((p) => ({ ...p, justificationText: e.target.value }))}
                                    rows={4}
                                    className="border-red-200 focus-visible:ring-red-400"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                            {submitMutation.isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
