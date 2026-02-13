import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery } from '@tanstack/react-query';
import { getProposalDetail, type InternshipProposalDetail } from '@/services/internship.service';
import { toTitleCaseName, formatDateId } from '@/lib/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
    ArrowLeft,
    User,
    Building2,
    MapPin,
    Users,
    FileText,
    Eye,
    Clock,
    AlertTriangle
} from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';

export default function InternshipProposalDetail() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { proposalId } = useParams<{ proposalId: string }>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik', href: '/kerja-praktik/pendaftaran' },
        { label: 'Pendaftaran', href: '/kerja-praktik/pendaftaran' },
        { label: 'Detail' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Detail Proposal KP');
    }, [setBreadcrumbs, setTitle, breadcrumbs]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['internship-proposal-detail', proposalId],
        queryFn: () => getProposalDetail(proposalId!).then((res) => res.data as InternshipProposalDetail),
        enabled: !!proposalId,
    });

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Memuat detail proposal...</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
                <p className="text-muted-foreground mb-4">Gagal memuat detail proposal. Silakan coba lagi.</p>
                <Button asChild variant="outline">
                    <Link to="/kerja-praktik/pendaftaran">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Link>
                </Button>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        let variant: 'outline' | 'default' | 'secondary' | 'destructive' | 'success' = 'outline';
        let label = status.replace(/_/g, ' ');

        if (status === 'APPROVED_BY_SEKDEP') {
            variant = 'success';
            label = 'APPROVED';
        } else if (status === 'REJECTED_BY_SEKDEP') {
            variant = 'destructive';
            label = 'REJECTED';
        } else if (status === 'PENDING') {
            variant = 'secondary';
        }

        return (
            <Badge variant={variant as any} className="px-3 py-1">
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="shrink-0">
                        <Link to="/kerja-praktik/pendaftaran">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detail Proposal KP</h1>
                        <p className="text-muted-foreground text-sm">
                            ID: {data.id} • Dibuat pada {formatDateId(data.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge(data.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Company Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="h-4 w-4" />
                                Informasi Perusahaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">{data.targetCompany.companyName}</h3>
                                <div className="flex items-start gap-2 text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4 mt-1 shrink-0" />
                                    <p className="text-sm">{data.targetCompany.companyAddress}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                Anggota Kelompok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Coordinator */}
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{toTitleCaseName(data.coordinator.user.fullName)}</p>
                                            <p className="text-xs text-muted-foreground">{data.coordinator.user.identityNumber}</p>
                                        </div>
                                    </div>
                                    <Badge variant="default" className="text-[10px]">KOORDINATOR</Badge>
                                </div>

                                {/* Other Members */}
                                {data.members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                <User className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{toTitleCaseName(member.student.user.fullName)}</p>
                                                <p className="text-xs text-muted-foreground">{member.student.user.identityNumber}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase">{member.status.replace(/_/g, ' ')}</Badge>
                                    </div>
                                ))}

                                {data.members.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic text-center py-2">Tidak ada anggota tambahan.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Status & Documents */}
                <div className="space-y-6">
                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4" />
                                Dokumen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.proposalDocument ? (
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span className="text-xs font-medium truncate">{data.proposalDocument.fileName}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-blue-600"
                                        onClick={() => openDocumentPreview(data.proposalDocument!.fileName, data.proposalDocument!.filePath)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Dokumen proposal belum diunggah.</p>
                            )}

                            {/* Future: Add link to surat permohonan etc when available */}
                        </CardContent>
                    </Card>

                    {/* Timeline / Status History (Simplified for now) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-4 w-4" />
                                Status History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                                <div className="relative">
                                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                                    <p className="text-sm font-semibold">Terkirim</p>
                                    <p className="text-xs text-muted-foreground">{formatDateId(data.createdAt)}</p>
                                </div>
                                {data.status !== 'PENDING' && (
                                    <div className="relative">
                                        <div className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-background ${data.status.includes('REJECTED') ? 'bg-destructive' : 'bg-success'}`} />
                                        <p className="text-sm font-semibold">
                                            {data.status === 'APPROVED_BY_SEKDEP' ? 'APPROVED' : data.status === 'REJECTED_BY_SEKDEP' ? 'REJECTED' : data.status.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDateId(data.updatedAt)}</p>
                                        {data.status === 'REJECTED_BY_SEKDEP' && data.sekdepNotes && (
                                            <div className="mt-2 p-2 bg-destructive/5 border border-destructive/10 rounded text-xs text-destructive">
                                                <p className="font-semibold mb-1">Catatan Sekdep:</p>
                                                <p>{data.sekdepNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />
        </div>
    );
}
