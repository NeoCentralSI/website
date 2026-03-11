import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useStudentProposals } from '@/hooks/internship/useStudentProposals';
import RegisterInternshipDialog from '@/components/internship/RegisterInternshipDialog';
import UploadResponseLetterDialog from '@/components/internship/UploadResponseLetterDialog';
import DeleteProposalDialog from '@/components/internship/DeleteProposalDialog';
import { StudentProposalCard } from '@/components/internship/StudentProposalCard';
import { respondToInvitation, type InternshipProposalItem } from '@/services/internship.service';
import { getSopDownloadUrl } from '@/services/sop.service';

import { toast } from 'sonner';

export default function InternshipProposalPage() {

    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [registerOpen, setRegisterOpen] = useState(false);
    const [editItem, setEditItem] = useState<InternshipProposalItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<InternshipProposalItem | null>(null);
    const [uploadResponseItem, setUploadResponseItem] = useState<InternshipProposalItem | null>(null);

    const {
        items,
        displayItems,
        total,
        isLoading,
        isFetching,
        q,
        refetch,
    } = useStudentProposals();

    // Removal of academicYearId defaulting as it's now defaulted to 'all' in the hook
    // and the filter UI is removed.

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const breadcrumb = useMemo(() => [{ label: 'Kerja Praktik' }, { label: 'Pendaftaran' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const activeProposal = useMemo(() => {
        return items.find(item => {
            // If the proposal is cancelled or fully rejected, it's not active
            if (['REJECTED_BY_SEKDEP', 'REJECTED_BY_COMPANY'].includes(item.status)) {
                return false;
            }

            // If the member is rejected (either by declining invite or by company in partial acceptance), it's not active for them
            if (['REJECTED', 'REJECTED_BY_COMPANY'].includes(item.memberStatus as string)) {
                return false;
            }

            // Otherwise, it's an active proposal
            return true;
        });
    }, [items]);

    const handleRegisterClick = () => {
        if (activeProposal) {
            toast.error("Anda masih memiliki proposal aktif. Selesaikan atau batalkan proposal tersebut sebelum mendaftar kembali.");
            return;
        }
        setRegisterOpen(true);
    };

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleRespondInvitation = async (item: InternshipProposalItem, response: 'ACCEPTED' | 'REJECTED') => {
        try {
            const action = response === 'ACCEPTED' ? 'menyetujui' : 'menolak';
            await respondToInvitation(item.id, response);
            toast.success(`Berhasil ${action} undangan.`);
            refetch();
        } catch (error: any) {
            toast.error(error.message || "Gagal merespon undangan");
        }
    };

    const handleEdit = (item: InternshipProposalItem) => {
        setEditItem(item);
        setRegisterOpen(true);
    };

    const handleDelete = (item: InternshipProposalItem) => {
        setDeleteItem(item);
    };

    const { data: publicSops = [] } = useQuery({
        queryKey: ['public-sop-files'],
        queryFn: () => import('@/services/sop.service').then(m => m.getSopFilesPublic()),
    });

    const proposalTemplate = useMemo(() => {
        return publicSops.find((s: any) => s.type === 'TEMPLATE_KP');
    }, [publicSops]);

    const handleDownloadTemplate = () => {
        if (!proposalTemplate) {
            toast.error("Template proposal belum tersedia.");
            return;
        }
        window.open(getSopDownloadUrl(proposalTemplate.url), '_blank');
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pendaftaran Kerja Praktik</h1>
                <p className="text-muted-foreground">Ajukan proposal, surat permohonan, dan surat balasan.</p>
            </div>

            {isLoading ? (
                <div className="flex h-[calc(100vh-280px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data proposal..." />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Header Actions */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between bg-card p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-muted-foreground mr-auto">
                            Menampilkan {displayItems.length} dari {total} proposal
                        </div>
                        <div className="flex items-center gap-2">
                            <RefreshButton
                                onClick={() => refetch()}
                                isRefreshing={isFetching && !isLoading}
                            />
                            {proposalTemplate && (
                                <Button
                                    variant="outline"
                                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={handleDownloadTemplate}
                                >
                                    <FileText className="h-4 w-4" />
                                    Download Template Proposal
                                </Button>
                            )}
                            <Button onClick={handleRegisterClick}>
                                Daftar KP
                            </Button>
                        </div>
                    </div>

                    {/* Proposal Cards List */}
                    {displayItems.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {displayItems.map((item: InternshipProposalItem) => (
                                <StudentProposalCard
                                    key={item.id}
                                    proposal={item}
                                    onViewProposalDoc={(item: InternshipProposalItem) => {
                                        if (item.dokumenProposal) {
                                            openDocumentPreview(item.dokumenProposal.fileName, item.dokumenProposal.filePath);
                                        }
                                    }}
                                    onViewAppLetterDoc={(item: InternshipProposalItem) => {
                                        if (item.dokumenSuratPermohonan) {
                                            openDocumentPreview(item.dokumenSuratPermohonan.fileName, item.dokumenSuratPermohonan.filePath);
                                        }
                                    }}
                                    onViewResponseDoc={(item: InternshipProposalItem) => {
                                        if (item.dokumenSuratBalasan) {
                                            openDocumentPreview(item.dokumenSuratBalasan.fileName, item.dokumenSuratBalasan.filePath);
                                        }
                                    }}
                                    onViewAssignmentDoc={(item: InternshipProposalItem) => {
                                        if (item.dokumenSuratTugas) {
                                            openDocumentPreview(item.dokumenSuratTugas.fileName, item.dokumenSuratTugas.filePath);
                                        }
                                    }}
                                    onRespondInvitation={handleRespondInvitation}
                                    onUploadResponse={(item: InternshipProposalItem) => setUploadResponseItem(item)}
                                    onEditProposal={handleEdit}
                                    onDeleteProposal={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50 border-dashed">
                            <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium">Belum ada proposal</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                {q ? 'Pencarian tidak menemukan hasil. Coba kata kunci lain.' : 'Anda belum memiliki riwayat pengajuan proposal internship. Silakan klik tombol "Daftar KP" untuk memulai pendaftaran.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <RegisterInternshipDialog
                open={registerOpen}
                onOpenChange={(open) => {
                    setRegisterOpen(open);
                    if (!open) setEditItem(null);
                }}
                onSubmitted={() => refetch()}
                proposalToEdit={editItem}
            />

            <DeleteProposalDialog
                open={!!deleteItem}
                onOpenChange={(open) => {
                    if (!open) setDeleteItem(null);
                }}
                proposalId={deleteItem?.id || null}
                companyName={deleteItem?.namaCompany}
                onDeleted={() => refetch()}
            />

            <UploadResponseLetterDialog
                open={!!uploadResponseItem}
                onOpenChange={(open) => {
                    if (!open) setUploadResponseItem(null);
                }}
                proposal={uploadResponseItem || null}
                onSuccess={() => refetch()}
            />

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />
        </div>
    );
}
