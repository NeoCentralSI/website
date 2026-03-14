import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSekdepProposalDetail, respondToSekdepProposal } from '@/services/internship.service';
import { toTitleCaseName, formatDateId } from '@/lib/text';
import { getInternshipStatusBadge } from '@/lib/internship/status';
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
import ProposalResponseDialog from '@/components/internship/sekdep/ProposalResponseDialog';

export default function SekdepInternshipProposalDetail() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { proposalId } = useParams<{ proposalId: string }>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    // Response Dialog State
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [responseType, setResponseType] = useState<'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | null>(null);

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
        mutationFn: ({ response, notes }: { response: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL', notes?: string }) =>
            respondToSekdepProposal(proposalId!, response, notes),
        onSuccess: (res) => {
            toast.success(res.message);
            setResponseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposal-detail', proposalId] });
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposals'] });
        },
        onError: (error: Error) => {
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



    // ...

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detail Pendaftaran KP</h1>
                        <p className="text-muted-foreground text-sm">
                            ID: {data.id} • {data.academicYearName} • Dibuat pada {formatDateId(data.createdAt)}
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
                                    setResponseType('REJECTED_PROPOSAL');
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
                                    setResponseType('APPROVED_PROPOSAL');
                                    setResponseDialogOpen(true);
                                }}
                                disabled={respondMutation.isPending}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                        </div>
                    ) : (() => {
                        const responseStatus = data.companyResponseStatus;
                        if (responseStatus) {
                            return getInternshipStatusBadge(responseStatus);
                        }
                        if (data.isSigned) {
                            return (
                                <Badge variant="success" className="px-3 py-1">
                                    DITANDATANGANI
                                </Badge>
                            );
                        }
                        return getInternshipStatusBadge(data.status);
                    })()}
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
                                {data.internships && data.internships.map((internship) => (
                                    <div key={internship.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                <User className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{toTitleCaseName(internship.student.user.fullName)}</p>
                                                <p className="text-xs text-muted-foreground">{internship.student.user.identityNumber}</p>
                                            </div>
                                        </div>
                                        {getInternshipStatusBadge(['ONGOING', 'COMPLETED'].includes(internship.status) ? 'ACCEPTED_BY_COMPANY' : internship.status)}
                                    </div>
                                ))}

                                {(!data.internships || data.internships.length === 0) && (
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
                        <CardContent className="space-y-4">
                            {data.proposalDocument ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Proposal</span>
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
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Dokumen proposal belum diunggah.</p>
                            )}

                            {data.appLetterDoc && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Surat Permohonan</span>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className={`h-4 w-4 shrink-0 ${data.isSigned ? 'text-green-600' : 'text-amber-600'}`} />
                                                <span className="text-xs font-medium truncate">{data.appLetterDoc.fileName}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-8 ${data.isSigned ? 'text-green-600' : 'text-amber-600'}`}
                                                onClick={() => openDocumentPreview(data.appLetterDoc!.fileName, data.appLetterDoc!.filePath)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${data.isSigned ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                                            {data.isSigned ? (
                                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                            )}
                                            <span className={`text-[11px] leading-tight font-medium ${data.isSigned ? 'text-green-700' : 'text-amber-700'}`}>
                                                {data.isSigned ? 'Surat permohonan telah ditandatangani oleh Kadep.' : 'Surat permohonan belum ditandatangani oleh Kadep.'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {data.companyResponseDoc && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Surat Balasan</span>
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-xs font-medium truncate">{data.companyResponseDoc.fileName}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-primary"
                                            onClick={() => openDocumentPreview(data.companyResponseDoc!.fileName, data.companyResponseDoc!.filePath)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {data.assignLetterDoc && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Surat Tugas</span>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className={`h-4 w-4 shrink-0 ${data.isAssignmentSigned ? 'text-green-600' : 'text-amber-600'}`} />
                                                <span className="text-xs font-medium truncate">{data.assignLetterDoc.fileName}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-8 ${data.isAssignmentSigned ? 'text-green-600' : 'text-amber-600'}`}
                                                onClick={() => openDocumentPreview(data.assignLetterDoc!.fileName, data.assignLetterDoc!.filePath)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${data.isAssignmentSigned ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                                            {data.isAssignmentSigned ? (
                                                <Check className="h-4 w-4 text-green-600 shrink-0" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                            )}
                                            <span className={`text-[11px] leading-tight font-medium ${data.isAssignmentSigned ? 'text-green-700' : 'text-amber-700'}`}>
                                                {data.isAssignmentSigned ? 'Surat tugas telah ditandatangani oleh Kadep.' : 'Surat tugas belum ditandatangani oleh Kadep.'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
