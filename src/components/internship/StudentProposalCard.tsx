import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Edit, Trash2, Check, X, ChevronDown, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle, Users, User } from 'lucide-react';
import type { InternshipProposalItem } from '@/services/internship.service';
import { cn } from '@/lib/utils';
import { getInternshipStatusBadge } from '@/lib/internship/status';

interface StudentProposalCardProps {
    proposal: InternshipProposalItem;
    onViewProposalDoc: (item: InternshipProposalItem) => void;
    onViewAppLetterDoc: (item: InternshipProposalItem) => void;
    onViewResponseDoc: (item: InternshipProposalItem) => void;
    onViewAssignmentDoc: (item: InternshipProposalItem) => void;
    onRespondInvitation: (item: InternshipProposalItem, response: 'ACCEPTED' | 'REJECTED') => void;
    onUploadResponse: (item: InternshipProposalItem) => void;
    onEditProposal: (item: InternshipProposalItem) => void;
    onDeleteProposal: (item: InternshipProposalItem) => void;
}

export function StudentProposalCard({
    proposal,
    onViewProposalDoc,
    onViewAppLetterDoc,
    onViewResponseDoc,
    onViewAssignmentDoc,
    onRespondInvitation,
    onUploadResponse,
    onEditProposal,
    onDeleteProposal,
}: StudentProposalCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const isCoordinator = proposal.koordinatorAtauMember === 'Koordinator';
    const isMemberPending = proposal.koordinatorAtauMember === 'Member' && proposal.memberStatus === 'PENDING';
    const isRejected = ['REJECTED', 'REJECTED_BY_COMPANY'].includes(proposal.memberStatus as string);
    const hasAssignment = !!proposal.dokumenSuratTugas;

    // Derived states for timeline steps
    const step1Status = 'completed'; // Submission is always complete if proposal exists

    let step2Status = 'pending';
    if (['APPROVED_PROPOSAL', 'WAITING_FOR_VERIFICATION', 'ACCEPTED_BY_COMPANY', 'PARTIALLY_ACCEPTED'].includes(proposal.status)) {
        step2Status = 'completed';
    } else if (proposal.status === 'REJECTED_PROPOSAL') {
        step2Status = 'rejected';
    }

    let step3Status = 'pending';
    if (proposal.dokumenSuratPermohonan) {
        step3Status = proposal.isSigned ? 'completed' : 'processing';
    }

    let step4Status = 'pending';
    if (proposal.dokumenSuratBalasan) {
        step4Status = 'completed';
    }

    let step5Status = 'pending';
    if (['ACCEPTED_BY_COMPANY', 'PARTIALLY_ACCEPTED'].includes(proposal.status)) {
        step5Status = 'completed';
    } else if (proposal.status === 'REJECTED_BY_COMPANY') {
        step5Status = 'rejected';
    } else if (proposal.status === 'WAITING_FOR_VERIFICATION') {
        step5Status = 'processing';
    }

    let step6Status = 'pending';
    if (hasAssignment && !isRejected) {
        step6Status = proposal.isAssignmentSigned ? 'completed' : 'processing';
    }

    const canUploadResponse = proposal.status === 'APPROVED_PROPOSAL' && isCoordinator && !proposal.dokumenSuratBalasan && !!proposal.dokumenSuratPermohonan && proposal.isSigned;
    const canReuploadResponse = (proposal.status === 'REJECTED_PROPOSAL' || proposal.status === 'WAITING_FOR_VERIFICATION') && !!proposal.dokumenSuratBalasan && isCoordinator;

    const getDashedLineColor = (status: string) => {
        if (status === 'completed') return 'border-green-300';
        if (status === 'rejected') return 'border-red-300';
        if (status === 'processing') return 'border-amber-300';
        return 'border-border/80';
    };

    const renderStepIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (status === 'rejected') return <XCircle className="h-5 w-5 text-red-500" />;
        if (status === 'processing') return <Clock className="h-5 w-5 text-amber-500" />;
        return <div className="h-5 w-5 rounded-full bg-muted-foreground/20" />;
    };

    return (
        <Card className="w-full bg-card border overflow-hidden py-0">
            {/* Header */}
            <CardHeader className="p-4 sm:p-5 sm:px-6 bg-card">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 sm:mb-2 flex-wrap">
                            <h3 className="text-xl font-medium leading-tight text-foreground">{proposal.nama}</h3>
                            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 font-medium uppercase text-[10px] sm:text-xs">
                                {proposal.koordinatorAtauMember}
                            </Badge>
                            {proposal.memberStatus && (
                                <Badge variant="outline" className={cn("text-[10px] sm:text-xs",
                                    ['ACCEPTED', 'ACCEPTED_BY_COMPANY', 'ONGOING', 'COMPLETED'].includes(proposal.memberStatus) ? 'text-green-600 border-green-300 bg-green-50' :
                                        ['REJECTED', 'REJECTED_BY_COMPANY'].includes(proposal.memberStatus) ? 'text-red-600 border-red-300 bg-red-50' :
                                            'text-amber-600 border-amber-300 bg-amber-50'
                                )}>
                                    {proposal.memberStatus === 'ACCEPTED' ? 'Diterima' :
                                        ['ACCEPTED_BY_COMPANY', 'ONGOING', 'COMPLETED'].includes(proposal.memberStatus) ? 'Diterima Perusahaan' :
                                            proposal.memberStatus === 'REJECTED' ? 'Ditolak' :
                                                proposal.memberStatus === 'REJECTED_BY_COMPANY' ? 'Ditolak Perusahaan' : 'Menunggu Undangan'}
                                </Badge>
                            )}
                            {hasAssignment && (
                                <Badge variant="success" className="h-5 px-2 text-[10px] sm:text-xs">SELESAI</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 sm:mt-0">NIM: {proposal.nim}</p>
                        <div className="flex gap-4 sm:gap-6 mt-1 sm:mt-2 text-sm text-muted-foreground flex-wrap">
                            <div>
                                <span className="font-medium text-foreground">Perusahaan:</span> {proposal.namaCompany}
                            </div>
                            <div>
                                <span className="font-medium text-foreground">Tahun Ajaran:</span> {proposal.academicYearName}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <div className="mr-2">
                            {getInternshipStatusBadge(proposal.status)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="gap-2 h-9 rounded-full"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Header Actions (Invitations / Edit / Delete) */}
                {(isMemberPending || (isCoordinator && (proposal.status === 'PENDING' || (proposal.status === 'REJECTED_PROPOSAL' && !proposal.dokumenSuratBalasan)))) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t">

                        {isMemberPending && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-1 rounded-md px-2.5">
                                <span className="text-xs font-medium text-amber-800">Undangan Anggota:</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs bg-white text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200"
                                    onClick={() => onRespondInvitation(proposal, 'ACCEPTED')}
                                >
                                    <Check className="h-3 w-3 mr-1" /> Terima
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs bg-white text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                                    onClick={() => onRespondInvitation(proposal, 'REJECTED')}
                                >
                                    <X className="h-3 w-3 mr-1" /> Tolak
                                </Button>
                            </div>
                        )}

                        {isCoordinator && (proposal.status === 'PENDING' || proposal.status === 'REJECTED_PROPOSAL') && !proposal.dokumenSuratBalasan && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
                                onClick={() => onEditProposal(proposal)}
                            >
                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Proposal
                            </Button>
                        )}

                        {isCoordinator && proposal.status === 'PENDING' && !proposal.dokumenSuratBalasan && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                                onClick={() => onDeleteProposal(proposal)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Hapus
                            </Button>
                        )}
                    </div>
                )}
            </CardHeader>

            {/* Timeline Body */}
            {isExpanded && (
                <CardContent className="p-5 sm:p-6 bg-background -mt-12">
                    {proposal.members && proposal.members.filter(m => m.nim !== proposal.nim).length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Anggota Kelompok
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {proposal.members.filter(m => m.nim !== proposal.nim).map(member => (
                                    <div key={member.id} className="flex flex-col p-3 border rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", member.role === 'KOORDINATOR' ? "bg-primary/10" : "bg-muted")}>
                                                <User className={cn("h-4 w-4", member.role === 'KOORDINATOR' ? "text-primary" : "text-muted-foreground")} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate capitalize">{member.name.toLowerCase()}</p>
                                                <p className="text-xs text-muted-foreground">{member.nim}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <Badge variant="outline" className={cn("text-[10px]", member.role === 'KOORDINATOR' ? "text-orange-600 border-orange-300 bg-orange-50" : "")}>
                                                {member.role}
                                            </Badge>
                                            <Badge variant="outline" className={cn("text-[10px]",
                                                ['ACCEPTED', 'ACCEPTED_BY_COMPANY', 'ONGOING', 'COMPLETED'].includes(member.status) ? 'text-green-600 border-green-300 bg-green-50' :
                                                    ['REJECTED', 'REJECTED_BY_COMPANY'].includes(member.status) ? 'text-red-600 border-red-300 bg-red-50' :
                                                        'text-amber-600 border-amber-300 bg-amber-50'
                                            )}>
                                                {member.status === 'ACCEPTED' ? 'Menerima' :
                                                    ['ACCEPTED_BY_COMPANY', 'ONGOING', 'COMPLETED'].includes(member.status) ? 'Diterima Perusahaan' :
                                                        member.status === 'REJECTED' ? 'Menolak Undangan' :
                                                            member.status === 'REJECTED_BY_COMPANY' ? 'Ditolak Perusahaan' : 'Menunggu Undangan'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <hr className="mb-6 border-border" />
                    <div className="relative border-l border-border ml-3 space-y-8 my-2 pt-2 sm:pr-4">

                        {/* Step 1: Proposal */}
                        <div className="ml-6 relative group pb-2">
                            <span className={cn(
                                "absolute -left-[39px] top-1 p-1 rounded-full border bg-background z-10",
                                step1Status === 'completed' ? "border-green-500" : "border-border"
                            )}>
                                {renderStepIcon(step1Status)}
                            </span>
                            <div className="flex flex-col gap-2 w-full pb-0">
                                <div className="flex justify-between items-center gap-3">
                                    <h4 className="text-sm font-semibold mt-0.5 whitespace-nowrap">Pendaftaran dan proposal</h4>
                                    <div className={cn("flex-1 border-b border-dashed mt-1", getDashedLineColor(step1Status))}></div>
                                    <Badge variant="outline" className={cn("text-[10px] w-[130px] justify-center shrink-0", step1Status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' : '')}>
                                        Selesai
                                    </Badge>
                                </div>
                                {proposal.dokumenProposal && (
                                    <div className="flex items-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                            onClick={() => onViewProposalDoc(proposal)}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Lihat {proposal.dokumenProposal.fileName}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Verifikasi Sekdep */}
                        <div className="ml-6 relative group pb-2">
                            <span className={cn(
                                "absolute -left-[39px] top-1 p-1 rounded-full border bg-background z-10",
                                step2Status === 'completed' ? "border-green-500" :
                                    step2Status === 'rejected' ? "border-red-500" : "border-border"
                            )}>
                                {renderStepIcon(step2Status)}
                            </span>
                            <div className="flex flex-col gap-2 w-full pb-0">
                                <div className="flex justify-between items-center gap-3">
                                    <h4 className="text-sm font-semibold mt-0.5 whitespace-nowrap">Verifikasi Proposal</h4>
                                    <div className={cn("flex-1 border-b border-dashed mt-1", getDashedLineColor(step2Status))}></div>
                                    <Badge variant="outline" className={cn("text-[10px] w-[130px] justify-center shrink-0",
                                        step2Status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' :
                                            step2Status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' :
                                                'text-muted-foreground'
                                    )}>
                                        {step2Status === 'completed' ? 'Disetujui' : step2Status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </Badge>
                                </div>
                                {step2Status === 'rejected' && !!proposal.proposalSekdepNotes && (
                                    <div className="bg-red-50 border border-red-100 rounded-md p-3 mt-1">
                                        <div className="flex gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                            <div className="text-xs text-red-800">
                                                <span className="font-semibold block mb-0.5">Catatan Penolakan:</span>
                                                {proposal.proposalSekdepNotes}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Surat Permohonan */}
                        <div className="ml-6 relative group pb-2">
                            <span className={cn(
                                "absolute -left-[39px] top-1 p-1 rounded-full border bg-background z-10",
                                step3Status === 'completed' ? "border-green-500" :
                                    step3Status === 'processing' ? "border-amber-500" : "border-border"
                            )}>
                                {renderStepIcon(step3Status)}
                            </span>
                            <div className="flex flex-col gap-2 w-full pb-0">
                                <div className="flex justify-between items-center gap-3">
                                    <h4 className="text-sm font-semibold mt-0.5 whitespace-nowrap">Surat Permohonan</h4>
                                    <div className={cn("flex-1 border-b border-dashed mt-1", getDashedLineColor(step3Status))}></div>
                                    <Badge variant="outline" className={cn("text-[10px] w-[130px] justify-center shrink-0",
                                        step3Status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' :
                                            step3Status === 'processing' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                'text-muted-foreground'
                                    )}>
                                        {step3Status === 'completed' ? 'Selesai' : step3Status === 'processing' ? 'Belum TTD' : 'Belum Mulai'}
                                    </Badge>
                                </div>
                                {proposal.dokumenSuratPermohonan && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                            onClick={() => onViewAppLetterDoc(proposal)}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Lihat {proposal.dokumenSuratPermohonan.fileName}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 4: Surat Balasan */}
                        <div className="ml-6 relative group pb-2">
                            <span className={cn(
                                "absolute -left-[39px] top-1 p-1 rounded-full border bg-background z-10",
                                step4Status === 'completed' ? "border-green-500" : "border-border"
                            )}>
                                {renderStepIcon(step4Status)}
                            </span>
                            <div className="flex flex-col gap-2 w-full pb-0">
                                <div className="flex justify-between items-center gap-3">
                                    <h4 className="text-sm font-semibold mt-0.5 whitespace-nowrap">Surat Balasan</h4>
                                    <div className={cn("flex-1 border-b border-dashed mt-1", getDashedLineColor(step4Status))}></div>
                                    <Badge variant="outline" className={cn("text-[10px] w-[130px] justify-center shrink-0",
                                        step4Status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' : 'text-muted-foreground'
                                    )}>
                                        {step4Status === 'completed' ? 'Selesai' : 'Belum Mulai'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {proposal.dokumenSuratBalasan && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                                            onClick={() => onViewResponseDoc(proposal)}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Lihat Surat Balasan
                                        </Button>
                                    )}
                                    {canUploadResponse && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-8 gap-2 text-xs"
                                            onClick={() => onUploadResponse(proposal)}
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Upload Surat Balasan
                                        </Button>
                                    )}
                                    {canReuploadResponse && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 text-xs"
                                            onClick={() => onUploadResponse(proposal)}
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Upload Ulang
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Step 5: Verifikasi Surat Balasan */}
                        <div className="ml-6 relative group pb-2">
                            <span className={cn(
                                "absolute -left-[39px] top-1 p-1 rounded-full border bg-background z-10",
                                step5Status === 'completed' ? "border-green-500" :
                                    step5Status === 'rejected' ? "border-red-500" :
                                        step5Status === 'processing' ? "border-amber-500" : "border-border"
                            )}>
                                {renderStepIcon(step5Status)}
                            </span>
                            <div className="flex flex-col gap-2 w-full pb-0">
                                <div className="flex justify-between items-center gap-3">
                                    <h4 className="text-sm font-semibold mt-0.5 whitespace-nowrap">Verifikasi Surat Balasan</h4>
                                    <div className={cn("flex-1 border-b border-dashed mt-1", getDashedLineColor(step5Status))}></div>
                                    <Badge variant="outline" className={cn("text-[10px] w-[130px] justify-center shrink-0",
                                        step5Status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' :
                                            step5Status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' :
                                                step5Status === 'processing' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                    'text-muted-foreground'
                                    )}>
                                        {step5Status === 'completed' ? 'Diterima' : step5Status === 'rejected' ? 'Ditolak' : step5Status === 'processing' ? 'Menunggu' : 'Belum Mulai'}
                                    </Badge>
                                </div>
                                {step5Status === 'rejected' && !!proposal.companyResponseSekdepNotes && (
                                    <div className="bg-red-50 border border-red-100 rounded-md p-3 mt-1">
                                        <div className="flex gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                            <div className="text-xs text-red-800">
                                                <span className="font-semibold block mb-0.5">Catatan Penolakan:</span>
                                                {proposal.companyResponseSekdepNotes}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {step5Status === 'processing' && (
                                    <p className="text-xs text-muted-foreground">Menunggu verifikasi untuk balasan dari perusahaan</p>
                                )}
                            </div>
                        </div>

                        {/* Step 6: Surat Tugas */}
                        <div className="ml-6 relative group pb-2">
                            <span className={cn(
                                "absolute -left-[39px] top-1 p-1 rounded-full border bg-background z-10",
                                step6Status === 'completed' ? "border-green-500" : "border-border"
                            )}>
                                {renderStepIcon(step6Status)}
                            </span>
                            <div className="flex flex-col gap-2 w-full pb-0">
                                <div className="flex justify-between items-center gap-3">
                                    <h4 className="text-sm font-semibold mt-0.5 whitespace-nowrap">Surat Tugas</h4>
                                    <div className={cn("flex-1 border-b border-dashed mt-1", getDashedLineColor(step6Status))}></div>
                                    <Badge variant="outline" className={cn("text-[10px] w-[130px] justify-center shrink-0",
                                        step6Status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' :
                                            step6Status === 'processing' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                'text-muted-foreground'
                                    )}>
                                        {step6Status === 'completed' ? 'Selesai' : step6Status === 'processing' ? 'Belum TTD' : 'Belum Mulai'}
                                    </Badge>
                                </div>
                                {proposal.dokumenSuratTugas && !isRejected && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                            onClick={() => onViewAssignmentDoc(proposal)}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Lihat {proposal.dokumenSuratTugas.fileName}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {hasAssignment && !isRejected && (
                            <div className="bg-green-50 border border-green-100 rounded-md p-3 mt-2">
                                <p className="text-xs text-green-800">
                                    Proses pendaftaran selesai. Anda sudah dapat memulai Kerja Praktik sesuai jadwal yang tertera pada Surat Tugas.
                                </p>
                            </div>
                        )}

                        {isRejected && (
                            <div className="bg-red-50 border border-red-100 rounded-md p-3 mt-2">
                                <p className="text-xs text-red-800">
                                    Anda tidak terpilih oleh perusahaan untuk posisi ini. Silakan melakukan pendaftaran kembali di perusahaan lain.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card >
    );
}
