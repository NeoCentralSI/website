import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { ArrowLeft, Eye, ShieldCheck, FileDown, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useYudisiumEvents } from '@/hooks/master-data/useYudisiumEvents';
import { useLecturerYudisiumParticipants, useDownloadDraftSk, useUploadSkResmi } from '@/hooks/yudisium/useLecturerYudisium';
import { useRole } from '@/hooks/shared';
import { ROLES } from '@/lib/roles';
import type { AdminYudisiumParticipant } from '@/types/admin-yudisium.types';
import { formatDateOnlyId } from '@/lib/text';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
    registered: {
        label: 'Menunggu Validasi Berkas',
        className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    },
    under_review: {
        label: 'Menunggu Validasi CPL',
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    approved: {
        label: 'Lulus',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    },
    rejected: {
        label: 'Ditolak',
        className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    },
    finalized: {
        label: 'Selesai',
        className: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    },
};

export default function LecturerYudisiumDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { hasAnyRole } = useRole();
    const { events } = useYudisiumEvents();
    const { data, isLoading, isFetching, refetch } = useLecturerYudisiumParticipants(id!);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // SK upload modal state
    const [skModalOpen, setSkModalOpen] = useState(false);
    const [skFile, setSkFile] = useState<File | null>(null);
    const [skEventDate, setSkEventDate] = useState('');
    const [skDecreeNumber, setSkDecreeNumber] = useState('');
    const [skDecreeIssuedAt, setSkDecreeIssuedAt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const draftSkMutation = useDownloadDraftSk();
    const uploadSkMutation = useUploadSkResmi(id!);

    const canManageSkActions = hasAnyRole([
        ROLES.KETUA_DEPARTEMEN,
        ROLES.SEKRETARIS_DEPARTEMEN,
        ROLES.KOORDINATOR_YUDISIUM,
    ]);

    const canValidateCpl = hasAnyRole([ROLES.GKM, ROLES.TIM_PENGELOLA_CPL]);

    const yudisium = useMemo(() => events.find((item: { id: string }) => item.id === id), [events, id]);

    const breadcrumbs = useMemo(
        () => [
            { label: 'Yudisium', href: '/yudisium/lecturer/event' },
            { label: 'Detail Periode' },
        ],
        [],
    );

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Detail Yudisium');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const participants = data?.participants ?? [];
    const filteredData = useMemo(() => {
        const term = search.toLowerCase();
        if (!term) return participants;
        return participants.filter((p: AdminYudisiumParticipant) =>
            p.studentName.toLowerCase().includes(term) ||
            p.studentNim.toLowerCase().includes(term) ||
            p.thesisTitle.toLowerCase().includes(term) ||
            (PARTICIPANT_STATUS_MAP[p.status]?.label ?? p.status).toLowerCase().includes(term)
        );
    }, [participants, search]);

    const paginated = filteredData.slice((page - 1) * pageSize, page * pageSize);

    const columns: Column<AdminYudisiumParticipant>[] = [
        {
            key: 'studentName',
            header: 'Nama',
            accessor: 'studentName',
        },
        {
            key: 'studentNim',
            header: 'NIM',
            accessor: 'studentNim',
        },
        {
            key: 'thesisTitle',
            header: 'Judul Tugas Akhir',
            render: (row) => <span className="line-clamp-2 text-sm">{row.thesisTitle}</span>,
        },
        {
            key: 'registeredAt',
            header: 'Tanggal Daftar',
            render: (row) => formatDateOnlyId(row.registeredAt),
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => {
                const s = PARTICIPANT_STATUS_MAP[row.status] || PARTICIPANT_STATUS_MAP.registered;
                return (
                    <Badge variant="outline" className={s.className}>
                        {s.label}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (row) => (
                <div className="flex gap-1">
                    {canValidateCpl && row.status === 'under_review' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/yudisium/lecturer/event/${id}/participant/${row.id}/cpl-validation`)}
                            title="Validasi CPL"
                        >
                            <ShieldCheck className="mr-1 h-4 w-4" />
                            Validasi CPL
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/yudisium/lecturer/event/${id}/participant/${row.id}`)}
                        title="Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loading size="lg" text="Memuat detail yudisium..." />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <Button variant="ghost" className="px-0" onClick={() => navigate('/yudisium/lecturer/event')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Yudisium
            </Button>

            <div>
                <h1 className="text-2xl font-bold">Kelola Detail Yudisium</h1>
                <p className="text-muted-foreground text-sm">Kelola detail pelaksanaan yudisium dan peserta.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle>Identitas Yudisium</CardTitle>
                        {canManageSkActions && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSkFile(null);
                                        setSkEventDate('');
                                        setSkDecreeNumber('');
                                        setSkDecreeIssuedAt('');
                                        setSkModalOpen(true);
                                    }}
                                >
                                    <Upload className="mr-1 h-4 w-4" />
                                    Upload SK Resmi
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => draftSkMutation.mutate(id!)}
                                    disabled={draftSkMutation.isPending}
                                >
                                    <FileDown className="mr-1 h-4 w-4" />
                                    {draftSkMutation.isPending ? 'Mengunduh...' : 'Generate Draft SK'}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        <span className="font-medium text-foreground">Nama Periode:</span> {yudisium?.name ?? '-'}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">Tanggal Pendaftaran:</span>{' '}
                        {yudisium
                            ? `${formatDateOnlyId(yudisium.registrationOpenDate)} - ${formatDateOnlyId(yudisium.registrationCloseDate)}`
                            : '-'}
                    </p>
                    <p>
                        <span className="font-medium text-foreground">Tanggal Yudisium:</span>{' '}
                        {yudisium ? formatDateOnlyId(yudisium.eventDate) : '-'}
                    </p>
                </CardContent>
            </Card>

            <div>
                <h2 className="mb-3 text-2xl font-bold">Peserta Yudisium</h2>
                <CustomTable
                    columns={columns}
                    data={paginated}
                    loading={isLoading}
                    isRefreshing={isFetching && !isLoading}
                    total={filteredData.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                    searchValue={search}
                    onSearchChange={(val) => {
                        setSearch(val);
                        setPage(1);
                    }}
                    emptyText="Belum ada peserta yudisium"
                    actions={
                        <RefreshButton
                            onClick={() => {
                                void refetch();
                            }}
                            isRefreshing={isFetching && !isLoading}
                        />
                    }
                />
            </div>

            {/* Upload SK Resmi Dialog */}
            <Dialog open={skModalOpen} onOpenChange={setSkModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload SK Resmi</DialogTitle>
                        <DialogDescription>
                            Unggah file SK resmi beserta informasi terkait pelaksanaan yudisium.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>File SK (PDF)</Label>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setSkFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div>
                            <Label>Tanggal Pelaksanaan Yudisium</Label>
                            <Input
                                type="date"
                                value={skEventDate}
                                onChange={(e) => setSkEventDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Nomor SK</Label>
                            <Input
                                type="text"
                                placeholder="Contoh: SK/001/2026"
                                value={skDecreeNumber}
                                onChange={(e) => setSkDecreeNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Tanggal SK Ditetapkan</Label>
                            <Input
                                type="date"
                                value={skDecreeIssuedAt}
                                onChange={(e) => setSkDecreeIssuedAt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSkModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                if (!skFile) return;
                                uploadSkMutation.mutate(
                                    {
                                        file: skFile,
                                        eventDate: skEventDate,
                                        decreeNumber: skDecreeNumber,
                                        decreeIssuedAt: skDecreeIssuedAt,
                                    },
                                    { onSuccess: () => setSkModalOpen(false) }
                                );
                            }}
                            disabled={uploadSkMutation.isPending || !skFile || !skEventDate || !skDecreeNumber || !skDecreeIssuedAt}
                        >
                            {uploadSkMutation.isPending ? 'Mengunggah...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
