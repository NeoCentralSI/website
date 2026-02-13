import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSekdepProposalDetail, respondToSekdepProposal } from '@/services/internship.service';
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
    AlertTriangle,
    Check,
    X
} from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { toast } from 'sonner';
import ProposalResponseDialog from '@/components/internship/ProposalResponseDialog';

export default function SekdepInternshipProposalDetail() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { proposalId } = useParams<{ proposalId: string }>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    // Response Dialog State
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [responseType, setResponseType] = useState<'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | null>(null);

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik', href: '/kelola/kerja-praktik/pendaftaran' },
        { label: 'Pendaftaran', href: '/kelola/kerja-praktik/pendaftaran' },
        { label: 'Detail' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Detail Proposal KP (Admin)');
    }, [setBreadcrumbs, setTitle, breadcrumbs]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['sekdep-internship-proposal-detail', proposalId],
        queryFn: () => getSekdepProposalDetail(proposalId!).then((res) => res.data),
        enabled: !!proposalId,
    });

    const respondMutation = useMutation({
        mutationFn: ({ response, notes }: { response: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP', notes?: string }) =>
            respondToSekdepProposal(proposalId!, response, notes),
        onSuccess: (res) => {
            toast.success(res.message);
            setResponseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposal-detail', proposalId] });
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposals'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal merespon proposal');
        }
    });

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleConfirmResponse = (notes?: string) => {
        if (responseType) {
            respondMutation.mutate({ response: responseType, notes });
        }
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
                    <Link to="/kelola/kerja-praktik/pendaftaran">
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
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detail Proposal KP</h1>
                        <p className="text-muted-foreground text-sm">
                            ID: {data.id} • Dibuat pada {formatDateId(data.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {data.status === 'PENDING' ? (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30 shadow-none"
                                onClick={() => {
                                    setResponseType('REJECTED_BY_SEKDEP');
                                    setResponseDialogOpen(true);
                                }}
                                disabled={respondMutation.isPending}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Tolak
                            </Button>
                            <Button
                                variant="outline"
                                className="text-green-600 hover:bg-green-600/10 border-green-600/20 hover:border-green-600/30 shadow-none"
                                onClick={() => {
                                    setResponseType('APPROVED_BY_SEKDEP');
                                    setResponseDialogOpen(true);
                                }}
                                disabled={respondMutation.isPending}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                        </div>
                    ) : (
                        getStatusBadge(data.status)
                    )}
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
                                    <p className="text-sm text-muted-foreground italic text-center py-2">Tidak ada anggota tambahan yang menyetujui.</p>
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

                            {data.applicationLetters?.[0]?.document && (
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 text-green-600 shrink-0" />
                                        <span className="text-xs font-medium truncate">{data.applicationLetters[0].document.fileName}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-green-600"
                                        onClick={() => openDocumentPreview(data.applicationLetters[0].document.fileName, data.applicationLetters[0].document.filePath)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline / Status History */}
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

            <ProposalResponseDialog
                open={responseDialogOpen}
                onOpenChange={setResponseDialogOpen}
                onConfirm={handleConfirmResponse}
                isLoading={respondMutation.isPending}
                type={responseType}
                companyName={data?.targetCompany?.companyName}
            />
        </div>
    );
}
