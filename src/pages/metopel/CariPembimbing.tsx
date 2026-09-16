import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { advisorRequestService, type LecturerCatalogItem, type AdvisorRequest, type AdvisorRequestDraft } from '@/services/advisorRequest.service';
import { useAdvisorAccessState } from '@/hooks/shared';
import { toast } from 'sonner';
import { ArrowRight, Search, GraduationCap, AlertCircle, Clock, XCircle, Users, SlidersHorizontal, CheckCircle2, History, ChevronDown, ChevronUp } from 'lucide-react';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loading, Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
    getAdvisorRequestStatus,
    getTrafficLightConfig,
} from '@/lib/metopen/statusBadge';

const STUDENT_OVERQUOTA_REASON_OPTIONS = [
    { code: 'topic_match', label: 'Topik atau riset sangat cocok dengan keahlian dosen ini' },
    { code: 'prior_guidance', label: 'Sudah pernah bimbingan atau diskusi topik dengan dosen ini' },
    { code: 'lecturer_recommend', label: 'Direkomendasikan dosen atau pembimbing sebelumnya' },
    { code: 'research_continue', label: 'Kelanjutan penelitian atau proyek terkait dengan dosen ini' },
    { code: 'kbk_limited', label: 'Pilihan dosen di KBK atau topik terkait sangat terbatas' },
    { code: 'other', label: 'Lainnya (tulis alasan konkret)' },
] as const;

type StudentOverquotaReasonCode = (typeof STUDENT_OVERQUOTA_REASON_OPTIONS)[number]['code'] | '';

interface SubmitFormData {
    lecturerId: string;
    topicId: string;
    proposedTitle: string;
    backgroundSummary: string;
    problemStatement: string;
    proposedSolution: string;
    researchObject: string;
    researchPermitStatus: 'approved' | 'in_process' | 'not_approved' | '';
    justificationText?: string;
    studentJustification: string;
    justificationReasonCode: StudentOverquotaReasonCode;
    studentJustificationDetail: string;
    /** Draft teks opsi Lainnya — tidak hilang saat user sempat klik preset lain. */
    otherJustificationDraft: string;
}

const EMPTY_FORM_DATA: SubmitFormData = {
    lecturerId: '',
    topicId: '',
    proposedTitle: '',
    backgroundSummary: '',
    problemStatement: '',
    proposedSolution: '',
    researchObject: '',
    researchPermitStatus: '',
    studentJustification: '',
    justificationReasonCode: '',
    studentJustificationDetail: '',
    otherJustificationDraft: '',
};

const DRAFT_SAVE_DEBOUNCE_MS = 700;
type ResearchPermitStatus = SubmitFormData['researchPermitStatus'];
type FormDataInput = Partial<SubmitFormData> | AdvisorRequestDraft | null | undefined;
type ThesisTopicOption = {
    id: string;
    name: string;
    scienceGroupId?: string | null;
    scienceGroup?: { id: string; name: string } | null;
};

const VALID_RESEARCH_PERMIT_STATUSES = new Set<Exclude<ResearchPermitStatus, ''>>([
    'approved',
    'in_process',
    'not_approved',
]);

const WITHDRAW_LOCK_HOURS = 72;
const RED_QUOTA_JUSTIFICATION_MIN_LENGTH = 20;

function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function hoursSince(dateStr: string) {
    return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function getRequestLecturerName(request: AdvisorRequest) {
    return request.redirectTarget?.user?.fullName ?? request.lecturer?.user?.fullName ?? 'Belum ditetapkan';
}

function toFormString(value: unknown): string {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function toResearchPermitStatus(value: unknown): ResearchPermitStatus {
    const status = toFormString(value);
    return VALID_RESEARCH_PERMIT_STATUSES.has(status as Exclude<ResearchPermitStatus, ''>)
        ? (status as Exclude<ResearchPermitStatus, ''>)
        : '';
}

function resolveJustificationReasonFromText(text: string): {
    justificationReasonCode: StudentOverquotaReasonCode;
    studentJustificationDetail: string;
} {
    const trimmed = text.trim();
    if (!trimmed) {
        return { justificationReasonCode: '', studentJustificationDetail: '' };
    }

    for (const option of STUDENT_OVERQUOTA_REASON_OPTIONS) {
        if (option.code === 'other') continue;
        if (trimmed === option.label) {
            return { justificationReasonCode: option.code, studentJustificationDetail: '' };
        }
        const prefix = `${option.label}. `;
        if (trimmed.startsWith(prefix)) {
            return {
                justificationReasonCode: option.code,
                studentJustificationDetail: trimmed.slice(prefix.length).trim(),
            };
        }
    }

    return { justificationReasonCode: 'other', studentJustificationDetail: trimmed };
}

function composeStudentJustification(
    reasonCode: StudentOverquotaReasonCode,
    detail: string,
): string {
    const cleanDetail = detail.trim();
    if (!reasonCode) return cleanDetail;
    if (reasonCode === 'other') return cleanDetail;

    const option = STUDENT_OVERQUOTA_REASON_OPTIONS.find((item) => item.code === reasonCode);
    if (!option) return cleanDetail;
    return cleanDetail ? `${option.label}. ${cleanDetail}` : option.label;
}

function normalizeFormData(data?: FormDataInput): SubmitFormData {
    const studentJustification = toFormString(data?.studentJustification ?? data?.justificationText);
    const fromExtended = data as Partial<SubmitFormData> | null | undefined;
    const explicitCode = fromExtended?.justificationReasonCode;
    const explicitDetail = fromExtended?.studentJustificationDetail;
    const explicitOtherDraft = fromExtended?.otherJustificationDraft;
    const resolved =
        explicitCode !== undefined || explicitDetail !== undefined
            ? {
                  justificationReasonCode: (explicitCode ?? '') as StudentOverquotaReasonCode,
                  studentJustificationDetail: toFormString(explicitDetail),
              }
            : resolveJustificationReasonFromText(studentJustification);
    const otherJustificationDraft =
        explicitOtherDraft !== undefined
            ? toFormString(explicitOtherDraft)
            : resolved.justificationReasonCode === 'other'
                ? resolved.studentJustificationDetail
                : '';

    return {
        lecturerId: toFormString(data?.lecturerId),
        topicId: toFormString(data?.topicId),
        proposedTitle: toFormString(data?.proposedTitle),
        backgroundSummary: toFormString(data?.backgroundSummary),
        problemStatement: toFormString(data?.problemStatement),
        proposedSolution: toFormString(data?.proposedSolution),
        researchObject: toFormString(data?.researchObject),
        researchPermitStatus: toResearchPermitStatus(data?.researchPermitStatus),
        justificationText: studentJustification,
        studentJustification,
        justificationReasonCode: resolved.justificationReasonCode,
        studentJustificationDetail: resolved.studentJustificationDetail,
        otherJustificationDraft,
    };
}

function buildFormDataFromDraft(draft?: AdvisorRequestDraft | null): SubmitFormData {
    return normalizeFormData(draft);
}

function trimFormText(value: unknown): string {
    return toFormString(value).trim();
}

function trimOrNull(value: unknown): string | null {
    const trimmed = trimFormText(value);
    return trimmed || null;
}

function isSameFormData(left: FormDataInput, right: FormDataInput) {
    const normalizedLeft = normalizeFormData(left);
    const normalizedRight = normalizeFormData(right);

    return (
        normalizedLeft.lecturerId === normalizedRight.lecturerId &&
        normalizedLeft.topicId === normalizedRight.topicId &&
        normalizedLeft.proposedTitle === normalizedRight.proposedTitle &&
        normalizedLeft.backgroundSummary === normalizedRight.backgroundSummary &&
        normalizedLeft.problemStatement === normalizedRight.problemStatement &&
        normalizedLeft.proposedSolution === normalizedRight.proposedSolution &&
        normalizedLeft.researchObject === normalizedRight.researchObject &&
        normalizedLeft.researchPermitStatus === normalizedRight.researchPermitStatus &&
        normalizedLeft.justificationReasonCode === normalizedRight.justificationReasonCode &&
        normalizedLeft.studentJustificationDetail === normalizedRight.studentJustificationDetail &&
        normalizedLeft.otherJustificationDraft === normalizedRight.otherJustificationDraft &&
        normalizedLeft.studentJustification === normalizedRight.studentJustification
    );
}

function RequestHistorySection() {
    const [expanded, setExpanded] = useState(false);

    const { data: history = [], isLoading } = useQuery({
        queryKey: ['advisor-request-history'],
        queryFn: async () => {
            const res = await advisorRequestService.getMyRequests();
            return res.data;
        },
    });

    if (isLoading) return null;
    if (history.length === 0) return null;

    const displayItems = expanded ? history : history.slice(0, 3);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Riwayat Pengajuan Pembimbing
                    <Badge variant="secondary" className="text-xs ml-auto">
                        {history.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                {displayItems.map((req: AdvisorRequest) => {
                    const statusCfg = getAdvisorRequestStatus(req.status, 'student');
                    const waitDays = ['pending', 'under_review', 'pending_kadep', 'escalated'].includes(req.status) ? daysSince(req.createdAt) : null;

                    return (
                        <div key={req.id} className="relative flex gap-3 pl-4 border-l-2 border-muted">
                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-muted-foreground/40" />
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium truncate">
                                        {getRequestLecturerName(req)}
                                    </span>
                                    <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                                        {statusCfg.label}
                                    </Badge>
                                    {waitDays !== null && waitDays >= 3 && (
                                        <Badge variant="outline" className="text-[10px] bg-orange-500/15 text-orange-700 border-orange-200">
                                            {waitDays} hari menunggu
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p>
                                        Topik: {req.topic?.name ?? '-'} &middot; {formatDateShort(req.createdAt)}
                                    </p>
                                    {req.rejectionReason && (
                                        <p className="text-red-600">
                                            Alasan ditolak: {req.rejectionReason}
                                        </p>
                                    )}
                                    {req.kadepNotes && (
                                        <p className="text-purple-600">
                                            Catatan KaDep: {req.kadepNotes}
                                        </p>
                                    )}
                                    {req.redirectTarget && (
                                        <p className="text-amber-600">
                                            Diputuskan ke: {req.redirectTarget.user?.fullName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {history.length > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? (
                            <><ChevronUp className="h-3.5 w-3.5 mr-1" />Tutup</>
                        ) : (
                            <><ChevronDown className="h-3.5 w-3.5 mr-1" />Lihat {history.length - 3} lainnya</>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

type AdvisorAccessState = NonNullable<ReturnType<typeof useAdvisorAccessState>["data"]>;

interface CariPembimbingProps {
    readOnly?: boolean;
    advisorAccess?: AdvisorAccessState;
}

type AvailabilityFilter = 'all' | LecturerCatalogItem['trafficLight'];

export default function CariPembimbing({ readOnly = false, advisorAccess: advisorAccessFromParent }: CariPembimbingProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [kbkFilter, setKbkFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>(() => {
        const value = searchParams.get('availability');
        return value === 'green' || value === 'yellow' || value === 'red' ? value : 'all';
    });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState<LecturerCatalogItem | null>(null);
    const [formData, setFormData] = useState<SubmitFormData>(EMPTY_FORM_DATA);
    const [lastSavedFormData, setLastSavedFormData] = useState<SubmitFormData>(EMPTY_FORM_DATA);
    const [draftReady, setDraftReady] = useState(false);
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const [withdrawUnderReviewConfirmed, setWithdrawUnderReviewConfirmed] = useState(false);

    useEffect(() => {
        const value = searchParams.get('availability');
        setAvailabilityFilter(value === 'green' || value === 'yellow' || value === 'red' ? value : 'all');
    }, [searchParams]);
    const {
        data: queriedAdvisorAccess,
        isLoading: accessLoading,
    } = useAdvisorAccessState(!advisorAccessFromParent);
    const advisorAccess = advisorAccessFromParent ?? queriedAdvisorAccess;
    const canViewCatalog = advisorAccess?.canViewCatalog ?? false;
    const canBrowseCatalog = advisorAccess?.canBrowseCatalog ?? false;
    // readOnly overrides canSubmitRequest — archived students cannot submit new requests
    const canSubmitRequest = !readOnly && (advisorAccess?.canSubmitRequest ?? false);
    const blockingRequest = advisorAccess?.blockingRequest ?? null;
    const latestRequest = advisorAccess?.latestRequest ?? null;
    const activeRequest = blockingRequest && ['pending', 'under_review', 'pending_kadep', 'booking_approved', 'escalated'].includes(blockingRequest.status)
        ? blockingRequest
        : null;
    const revisionRequest = latestRequest?.status === 'revision_requested' ? latestRequest : null;

    const TAB_STATUS = 'status';
    const TAB_CATALOG = 'catalog';
    const tabs = useMemo(() => [
        { label: 'Pilihan Dosen', value: TAB_CATALOG },
        { label: 'Status & Riwayat', value: TAB_STATUS },
    ], []);
    // BR-07 (canon §5.2 + audit P1-02): Default tab = Pilihan Dosen agar
    // mahasiswa baru langsung melihat 2 jalur sah (TA-01 + TA-02). Tab Status
    // menjadi sekunder. Bila ada pengajuan aktif, kita auto-flip ke Status
    // di useEffect di bawah supaya mahasiswa langsung melihat status mereka.
    const initialTab = (advisorAccess?.hasBookedSupervisor || advisorAccess?.hasOfficialSupervisor || advisorAccess?.hasBlockingRequest)
        ? TAB_STATUS
        : TAB_CATALOG;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [hasUserSelectedTab, setHasUserSelectedTab] = useState(false);
    const handleTabChange = (next: string) => {
        setHasUserSelectedTab(true);
        setActiveTab(next);
    };

    useEffect(() => {
        if (hasUserSelectedTab) return;
        const desired = (advisorAccess?.hasBookedSupervisor || advisorAccess?.hasOfficialSupervisor || advisorAccess?.hasBlockingRequest)
            ? TAB_STATUS
            : TAB_CATALOG;
        if (activeTab !== desired) setActiveTab(desired);
    }, [advisorAccess?.hasBookedSupervisor, advisorAccess?.hasOfficialSupervisor, advisorAccess?.hasBlockingRequest, activeTab, hasUserSelectedTab]);

    const {
        data: draft,
        isLoading: draftLoading,
    } = useQuery({
        queryKey: ['advisor-request-draft'],
        queryFn: async () => {
            const res = await advisorRequestService.getMyDraft();
            return res.data;
        },
        enabled: canViewCatalog || canBrowseCatalog || Boolean(revisionRequest),
        staleTime: 60 * 1000,
    });

    // Fetch catalog only when mahasiswa memang sudah bisa membuka pengajuan pembimbing.
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
            const json = await response.json() as { data: ThesisTopicOption[] };
            return json.data ?? [];
        },
        enabled: canBrowseCatalog,
    });

    const submitMutation = useMutation({
        mutationFn: (data: SubmitFormData) => {
            const normalizedData = normalizeFormData(data);
            const studentJustification = trimFormText(
                composeStudentJustification(
                    normalizedData.justificationReasonCode,
                    normalizedData.studentJustificationDetail,
                ) || normalizedData.studentJustification,
            );

            return advisorRequestService.submitRequest({
                lecturerId: trimOrNull(normalizedData.lecturerId),
                topicId: trimFormText(normalizedData.topicId),
                proposedTitle: trimFormText(normalizedData.proposedTitle),
                backgroundSummary: trimFormText(normalizedData.backgroundSummary),
                problemStatement: trimFormText(normalizedData.problemStatement),
                proposedSolution: trimFormText(normalizedData.proposedSolution),
                researchObject: trimFormText(normalizedData.researchObject),
                researchPermitStatus: normalizedData.researchPermitStatus as 'approved' | 'in_process' | 'not_approved',
                justificationText: studentJustification,
                studentJustification,
            });
        },
        onSuccess: () => {
            toast.success(
                !lecturerForDialog
                    ? 'Pengajuan TA-02 berhasil dikirim ke KaDep.'
                    : lecturerForDialog.trafficLight === 'red'
                    ? 'Pengajuan TA-01 saat kuota penuh berhasil dikirim ke dosen target.'
                    : 'Pengajuan pembimbing berhasil dikirim ke dosen tujuan.',
            );
            queryClient.invalidateQueries({ queryKey: ['advisor-access-state'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-catalog'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-request-history'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-request-draft'] });
            setDialogOpen(false);
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal mengirim pengajuan');
        },
    });

    const saveDraftMutation = useMutation({
        mutationFn: async (data: SubmitFormData) => {
            const normalizedData = normalizeFormData(data);
            const studentJustification = trimOrNull(
                composeStudentJustification(
                    normalizedData.justificationReasonCode,
                    normalizedData.studentJustificationDetail,
                ) || normalizedData.studentJustification,
            );

            const res = await advisorRequestService.saveDraft({
                lecturerId: trimOrNull(normalizedData.lecturerId),
                topicId: trimOrNull(normalizedData.topicId),
                proposedTitle: trimOrNull(normalizedData.proposedTitle),
                backgroundSummary: trimOrNull(normalizedData.backgroundSummary),
                problemStatement: trimOrNull(normalizedData.problemStatement),
                proposedSolution: trimOrNull(normalizedData.proposedSolution),
                researchObject: trimOrNull(normalizedData.researchObject),
                researchPermitStatus: normalizedData.researchPermitStatus || null,
                justificationText: studentJustification,
                studentJustification,
            });
            return res.data;
        },
        onSuccess: (savedDraft) => {
            const savedFormData = buildFormDataFromDraft(savedDraft);
            setLastSavedFormData(savedFormData);
            queryClient.setQueryData(['advisor-request-draft'], savedDraft);
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal menyimpan draft pengajuan');
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: (id: string) => advisorRequestService.withdrawRequest(id),
        onSuccess: () => {
            toast.success('Pengajuan berhasil ditarik');
            queryClient.invalidateQueries({ queryKey: ['advisor-access-state'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-catalog'] });
            queryClient.invalidateQueries({ queryKey: ['advisor-request-history'] });
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Gagal menarik pengajuan');
        },
    });

    /** Always align modal with latest catalog row (avoids stale snapshot vs grid after refetch). */
    const lecturerForDialog = useMemo(() => {
        if (!selectedLecturer) return null;
        return catalog.find((c) => c.lecturerId === selectedLecturer.lecturerId) ?? selectedLecturer;
    }, [catalog, selectedLecturer]);

    useEffect(() => {
        if (!draftReady && !draftLoading) {
            const initialFormData = buildFormDataFromDraft(draft);
            setFormData(initialFormData);
            setLastSavedFormData(initialFormData);
            setDraftReady(true);
        }
    }, [draft, draftLoading, draftReady]);

    useEffect(() => {
        if (!draftReady || !dialogOpen) return undefined;
        const draftSnapshot = normalizeFormData(formData);

        if (isSameFormData(draftSnapshot, lastSavedFormData)) return undefined;

        const timeoutId = window.setTimeout(() => {
            saveDraftMutation.mutate(draftSnapshot);
        }, DRAFT_SAVE_DEBOUNCE_MS);

        return () => window.clearTimeout(timeoutId);
    }, [dialogOpen, draftReady, formData, lastSavedFormData, saveDraftMutation]);

    const handleOpenDialog = (lecturer: LecturerCatalogItem | null = null) => {
        if (lecturer && lecturer.acceptingRequests === false) {
            toast.error('Dosen ini sedang tidak menerima pengajuan pembimbing.');
            return;
        }
        setSelectedLecturer(lecturer);
        setFormData((prev) => ({ ...normalizeFormData(prev), lecturerId: lecturer?.lecturerId ?? '' }));
        setDialogOpen(true);
    };

    const handleOpenDepartmentDialog = () => {
        handleOpenDialog(null);
    };

    const handleDialogOpenChange = (open: boolean) => {
        const currentFormData = normalizeFormData(formData);

        if (!open && draftReady && !isSameFormData(currentFormData, lastSavedFormData)) {
            saveDraftMutation.mutate(currentFormData);
        }

        if (!open) {
            setSelectedLecturer(null);
        }

        setDialogOpen(open);
    };

    // P2-03 (audit Sprint 3): min-length validation untuk field substansi TA-02
    // mengikuti standar form TA-02 PDF resmi. Latar belakang minimal 50 karakter
    // (cukup detail untuk dosen review), tujuan dan solusi minimal 30 karakter.
    const FIELD_MIN_LENGTHS = {
        backgroundSummary: 50,
        problemStatement: 30,
        proposedSolution: 30,
        researchObject: 5,
    } as const;

    const handleSubmit = () => {
        const currentFormData = normalizeFormData(formData);
        const proposedTitle = trimFormText(currentFormData.proposedTitle);
        const backgroundSummary = trimFormText(currentFormData.backgroundSummary);
        const problemStatement = trimFormText(currentFormData.problemStatement);
        const proposedSolution = trimFormText(currentFormData.proposedSolution);
        const researchObject = trimFormText(currentFormData.researchObject);
        const composedJustification = composeStudentJustification(
            currentFormData.justificationReasonCode,
            currentFormData.studentJustificationDetail,
        );
        const studentJustification = trimFormText(composedJustification);

        if (!trimFormText(currentFormData.topicId)) {
            toast.error('Pilih topik penelitian');
            return;
        }
        if (!proposedTitle) {
            toast.error('Judul tugas akhir wajib diisi');
            return;
        }
        if (proposedTitle.length < 12) {
            toast.error('Judul tugas akhir terlalu pendek. Isi judul rencana penelitian yang spesifik, bukan nama topik.');
            return;
        }
        const selectedTopic = topics.find((t) => t.id === trimFormText(currentFormData.topicId));
        const normalize = (value: string) =>
            value
                .normalize('NFKC')
                .toLowerCase()
                .replace(/[^a-z0-9\u00c0-\u024f]+/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        const titleKey = normalize(proposedTitle);
        const bannedLabels = topics.flatMap((t) => {
            const labels = [t.name];
            if (t.scienceGroup?.name) {
                labels.push(t.scienceGroup.name);
                labels.push(`${t.name} - ${t.scienceGroup.name}`);
            }
            return labels;
        });
        if (bannedLabels.some((label) => normalize(label) === titleKey)) {
            toast.error('Judul tidak boleh sama dengan nama topik/KBK. Jangan menyalin label dropdown topik.');
            return;
        }
        if (selectedTopic && normalize(selectedTopic.name) === titleKey) {
            toast.error('Judul tidak boleh sama dengan topik yang dipilih.');
            return;
        }
        if (backgroundSummary.length < FIELD_MIN_LENGTHS.backgroundSummary) {
            toast.error(`Latar belakang singkat minimal ${FIELD_MIN_LENGTHS.backgroundSummary} karakter`);
            return;
        }
        if (problemStatement.length < FIELD_MIN_LENGTHS.problemStatement) {
            toast.error(`Tujuan / permasalahan minimal ${FIELD_MIN_LENGTHS.problemStatement} karakter`);
            return;
        }
        if (proposedSolution.length < FIELD_MIN_LENGTHS.proposedSolution) {
            toast.error(`Rencana solusi minimal ${FIELD_MIN_LENGTHS.proposedSolution} karakter`);
            return;
        }
        if (researchObject.length < FIELD_MIN_LENGTHS.researchObject) {
            toast.error('Objek penelitian wajib diisi');
            return;
        }
        if (!currentFormData.researchPermitStatus) {
            toast.error('Status izin penelitian wajib dipilih');
            return;
        }
        if (lecturerForDialog?.trafficLight === 'red') {
            if (!currentFormData.justificationReasonCode) {
                toast.error('Pilih alasan akademik terlebih dahulu');
                return;
            }
            if (
                currentFormData.justificationReasonCode === 'other' &&
                studentJustification.length < RED_QUOTA_JUSTIFICATION_MIN_LENGTH
            ) {
                toast.error(
                    `Untuk opsi Lainnya, tulis alasan konkret minimal ${RED_QUOTA_JUSTIFICATION_MIN_LENGTH} karakter`,
                );
                return;
            }
            if (studentJustification.length < RED_QUOTA_JUSTIFICATION_MIN_LENGTH) {
                toast.error(
                    `Justifikasi akademik mahasiswa untuk pengajuan TA-01 saat kuota penuh minimal ${RED_QUOTA_JUSTIFICATION_MIN_LENGTH} karakter`,
                );
                return;
            }
        }
        submitMutation.mutate({
            ...currentFormData,
            proposedTitle,
            backgroundSummary,
            problemStatement,
            proposedSolution,
            researchObject,
            justificationText: studentJustification,
            studentJustification,
            researchPermitStatus: currentFormData.researchPermitStatus as 'approved' | 'in_process' | 'not_approved',
        });
    };

    // P2-05 (audit Sprint 3): Reset draft button — clear semua field setelah konfirmasi.
    const handleResetDraft = () => {
        setFormData((prev) => ({
            ...EMPTY_FORM_DATA,
            // Pertahankan lecturerId untuk konteks dialog (mahasiswa pilih dosen lagi
            // bila reset di dialog dosen tertentu).
            lecturerId: normalizeFormData(prev).lecturerId,
        }));
        toast.success('Draft direset. Field terisi kosong; klik Batal untuk batal sebelum simpan otomatis.');
    };

    if (accessLoading || (!draftReady && draftLoading)) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loading size="lg" text="Memeriksa akses pengajuan pembimbing..." />
            </div>
        );
    }

    let statusContent: React.ReactNode = null;
    if (advisorAccess?.hasOfficialSupervisor) {
        statusContent = (
            <>
                <Alert className="border-green-200 bg-green-50/80">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="space-y-2 text-green-800">
                        <p>{advisorAccess.reason}</p>
                        <p>
                            Penugasan sudah terkunci. Perubahan pembimbing menghubungi departemen.
                        </p>
                        <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800">
                            Penugasan TA-04 terkunci
                        </Badge>
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
            </>
        );
    } else if (activeRequest) {
        const waitDays = daysSince(activeRequest.createdAt);
        const elapsedHours = hoursSince(activeRequest.createdAt);
        const isUnderReview = activeRequest.status === 'under_review';
        const isPendingKadep = ['pending_kadep', 'escalated'].includes(activeRequest.status);
        const isBookingApproved = activeRequest.status === 'booking_approved';
        const isTa04IssuedBooking = isBookingApproved && Boolean(advisorAccess?.ta04AssignmentIssued);
        // BR-22 (canon §5.12 + audit Q9): Window 72 jam berlaku untuk semua
        // status review aktif (pending / under_review / pending_kadep /
        // escalated). Tidak ada lagi special-case `under_review` hard-disable
        // indefinit. Setelah 72 jam, mahasiswa berhak menarik dari status
        // mana pun untuk mencegah birokrasi menyandera.
        const TIME_LOCKED_STATUSES = ['pending', 'under_review', 'pending_kadep', 'escalated'];
        const isTimeLocked =
            TIME_LOCKED_STATUSES.includes(activeRequest.status) && elapsedHours < WITHDRAW_LOCK_HOURS;
        const remainingLockHours = Math.max(0, Math.ceil(WITHDRAW_LOCK_HOURS - elapsedHours));
        const remainingLockMinutes = Math.max(
            0,
            Math.ceil((WITHDRAW_LOCK_HOURS - elapsedHours) * 60),
        );
        const lockCountdownText =
            remainingLockHours > 1
                ? `${remainingLockHours} jam`
                : remainingLockMinutes > 1
                    ? `${remainingLockMinutes} menit`
                    : 'kurang dari 1 menit';
        const statusCfg = getAdvisorRequestStatus(activeRequest.status, 'student');
        const toneClass = isBookingApproved
            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
            : isPendingKadep
                ? 'border-purple-200 bg-purple-50/80 text-purple-800'
                : isUnderReview
                    ? 'border-indigo-200 bg-indigo-50/80 text-indigo-800'
                    : 'border-blue-200 bg-blue-50/80 text-blue-800';

        statusContent = (
            <>
                <Alert className={`p-3 sm:p-4 [&>svg]:size-5 ${toneClass}`}>
                    <Clock className={`h-5 w-5 shrink-0 ${isBookingApproved ? 'text-emerald-600' : isPendingKadep ? 'text-purple-600' : isUnderReview ? 'text-indigo-600' : 'text-blue-600'}`} />
                    <div className="min-w-0 space-y-3">
                        <div className="space-y-2">
                            <p className={`text-sm leading-relaxed font-medium ${isBookingApproved ? 'text-emerald-800' : isPendingKadep ? 'text-purple-800' : isUnderReview ? 'text-indigo-800' : 'text-blue-800'}`}>
                                Pengajuan aktif
                            </p>
                            <p className={`text-sm leading-relaxed break-words ${isBookingApproved ? 'text-emerald-800' : isPendingKadep ? 'text-purple-800' : isUnderReview ? 'text-indigo-800' : 'text-blue-800'}`}>
                                {activeRequest.lecturerId ? (
                                    <>
                                        Anda sudah mengajukan ke <strong className="break-words">{getRequestLecturerName(activeRequest)}</strong>
                                    </>
                                ) : (
                                    <>
                                        Anda sudah mengirim <strong>TA-02 digital</strong> dan departemen sedang memilih dosen pembimbing yang sesuai.
                                    </>
                                )}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`shrink-0 ${statusCfg.className}`}>
                                    {statusCfg.label}
                                </Badge>
                                {!isBookingApproved && waitDays >= 3 && (
                                    <Badge variant="outline" className="shrink-0 bg-orange-500/15 text-orange-700 border-orange-200">
                                        {waitDays} hari menunggu
                                    </Badge>
                                )}
                                {isTimeLocked && (
                                    <Badge variant="outline" className="shrink-0 bg-amber-500/15 text-amber-700 border-amber-200">
                                        Tarik tersedia dalam {lockCountdownText}
                                    </Badge>
                                )}
                            </div>
                            {isPendingKadep && (
                                <p className="text-purple-700 text-sm leading-relaxed">
                                    {activeRequest.lecturerId
                                        ? 'Pengajuan Anda sedang diproses melalui jalur departemen dan menunggu keputusan Kepala Departemen.'
                                        : 'Pengajuan TA-02 Anda sedang ditinjau oleh departemen untuk penetapan dosen pembimbing.'}
                                </p>
                            )}
                            {isBookingApproved && (
                                <p className="text-emerald-700 text-sm leading-relaxed">
                                    {isTa04IssuedBooking
                                        ? 'Penugasan sudah terkunci. Perubahan pembimbing menghubungi departemen.'
                                        : 'Booking pembimbing Anda sudah disetujui dan reservasi kuota tetap tercatat. Anda masih dapat membatalkan booking sebelum TA-04 difinalisasi KaDep. Draf proposal pribadi boleh disimpan, tetapi bimbingan yang tercatat sistem dan submit proposal final menunggu TA-04.'}
                                </p>
                            )}
                            {isUnderReview && !isTimeLocked && (
                                <p className="text-indigo-700 text-sm leading-relaxed">
                                    Window 72 jam pertama sudah lewat. Anda berhak menarik pengajuan kapan pun bila dosen belum merespons.
                                </p>
                            )}
                            {isUnderReview && isTimeLocked && (
                                <p className="text-indigo-700 text-sm leading-relaxed">
                                    Dosen sedang meninjau pengajuan Anda. Setelah 72 jam pertama lewat, Anda berhak menarik pengajuan secara manual untuk mencari dosen baru.
                                </p>
                            )}
                            {!isUnderReview && !isPendingKadep && !isBookingApproved && (
                                <p className="text-blue-700 text-sm leading-relaxed">
                                    {isTimeLocked
                                        ? 'Tunggu respon dosen. Tombol "Tarik Pengajuan" akan aktif setelah window 72 jam pertama lewat.'
                                        : 'Tunggu respon dosen atau tarik pengajuan sebelum mengajukan ke dosen lain.'}
                                </p>
                            )}
                        </div>
                        <div className="pt-1 sm:pt-0">
                            {isTa04IssuedBooking ? (
                                <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">
                                    Penugasan TA-04 terkunci
                                </Badge>
                            ) : isTimeLocked ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Tarik Pengajuan ({lockCountdownText} lagi)
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>
                                                Window 72 jam sejak pengajuan dikirim dipakai untuk menghormati waktu review dosen. Setelah {lockCountdownText} lagi, tombol akan aktif dan Anda boleh menarik pengajuan kapan saja — termasuk dari status Sedang Ditinjau.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <AlertDialog
                                    open={withdrawDialogOpen}
                                    onOpenChange={(open) => {
                                        setWithdrawDialogOpen(open);
                                        if (!open) setWithdrawUnderReviewConfirmed(false);
                                    }}
                                >
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
                                            disabled={readOnly || withdrawMutation.isPending}
                                        >
                                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                            {withdrawMutation.isPending ? 'Menarik...' : 'Tarik Pengajuan'}
                                        </Button>
                                    </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {isUnderReview && !withdrawUnderReviewConfirmed
                                                        ? 'Dosen Sedang Meninjau'
                                                        : 'Tarik Pengajuan?'}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {isUnderReview && !withdrawUnderReviewConfirmed ? (
                                                        <>
                                                            Dosen sedang aktif meninjau pengajuan Anda. Tarik sekarang akan membatalkan review yang sedang berjalan dan menutup peluang menjadi mahasiswa bimbingan dosen ini. Yakin lanjut?
                                                        </>
                                                    ) : activeRequest.lecturerId ? (
                                                        <>
                                                            Pengajuan ke <strong>{activeRequest.lecturer?.user?.fullName}</strong> akan dibatalkan. Anda dapat langsung mengajukan ke dosen lain setelah penarikan.
                                                        </>
                                                    ) : (
                                                        <>
                                                            Pengajuan TA-02 ke departemen akan dibatalkan. Anda dapat langsung mengajukan ulang setelah penarikan.
                                                        </>
                                                    )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {isUnderReview && !withdrawUnderReviewConfirmed ? 'Batal, tunggu hasil review' : 'Batal'}
                                            </AlertDialogCancel>
                                            {isUnderReview && !withdrawUnderReviewConfirmed ? (
                                                <Button
                                                    type="button"
                                                    className="bg-amber-600 hover:bg-amber-700"
                                                    onClick={() => setWithdrawUnderReviewConfirmed(true)}
                                                >
                                                    Lanjut Konfirmasi
                                                </Button>
                                            ) : (
                                                <AlertDialogAction
                                                    onClick={() => withdrawMutation.mutate(activeRequest.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Ya, Tetap Tarik
                                                </AlertDialogAction>
                                            )}
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </Alert>

                <Card className="border-blue-200 bg-blue-50/20">
                    <CardContent className="p-4 text-sm text-blue-900 break-words">
                        {advisorAccess?.reason}
                    </CardContent>
                </Card>
            </>
        );
    } else if (advisorAccess?.hasBlockingRequest) {
        statusContent = (
            <>
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
            </>
        );
    } else if (revisionRequest) {
        statusContent = (
            <>
                <Alert className="border-amber-200 bg-amber-50/80">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        Pengajuan {revisionRequest.requestType === 'ta_02' ? 'TA-02' : 'TA-01'} Anda diminta revisi oleh KaDep. Edit draft yang sama lalu kirim ulang tanpa mengisi dari nol.
                    </AlertDescription>
                </Alert>
                {revisionRequest.kadepNotes && (
                    <Card className="border-amber-200 bg-amber-50/20">
                        <CardContent className="p-4 text-sm text-amber-900">
                            <p className="font-medium">Catatan revisi KaDep</p>
                            <p className="mt-1 whitespace-pre-wrap">{revisionRequest.kadepNotes}</p>
                        </CardContent>
                    </Card>
                )}
            </>
        );
    } else if (!canViewCatalog) {
        statusContent = (
            <>
                <Alert className="border-amber-200 bg-amber-50/80">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        {advisorAccess?.reason || 'Data TA/Metopen belum tersedia. Silakan hubungi admin atau Koordinator Metopen.'}
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

                <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/metopel')}>
                    Kembali ke Overview
                </Button>
            </>
        );
    } else if (statusContent === null) {
        statusContent = (
            <p className="text-sm text-muted-foreground">
                Anda dapat melihat riwayat pengajuan di bawah dan mencari dosen di tab Pilihan Dosen.
            </p>
        );
    }

    // Unique KBK list for filter
    const kbkList = [...new Set(catalog.map((l: LecturerCatalogItem) => l.scienceGroup?.name).filter((name): name is string => !!name))];

    // Filter pencarian/KBK menjadi basis angka; filter ketersediaan diterapkan
    // setelahnya agar setiap angka selalu sama dengan daftar hasil drill-down.
    const baseFiltered = catalog.filter((l: LecturerCatalogItem) => {
        const matchesSearch =
            !search ||
            l.fullName.toLowerCase().includes(search.toLowerCase()) ||
            l.identityNumber.includes(search);
        const matchesKbk = kbkFilter === 'all' || l.scienceGroup?.name === kbkFilter;
        return matchesSearch && matchesKbk;
    });

    const availabilityStats = {
        total: baseFiltered.length,
        green: baseFiltered.filter((l) => l.trafficLight === 'green').length,
        yellow: baseFiltered.filter((l) => l.trafficLight === 'yellow').length,
        red: baseFiltered.filter((l) => l.trafficLight === 'red').length,
    };
    const filtered = availabilityFilter === 'all'
        ? baseFiltered
        : baseFiltered.filter((lecturer) => lecturer.trafficLight === availabilityFilter);

    const applyAvailabilityFilter = (value: AvailabilityFilter) => {
        const nextValue = availabilityFilter === value ? 'all' : value;
        setAvailabilityFilter(nextValue);
        const next = new URLSearchParams(searchParams);
        if (nextValue === 'all') next.delete('availability');
        else next.set('availability', nextValue);
        setSearchParams(next, { replace: true });
    };

    const statusTabContent = (
        <div className="space-y-4">
            {statusContent}
            <RequestHistorySection />
        </div>
    );

    const catalogTabContent = canBrowseCatalog ? (
        <div className="space-y-5 sm:space-y-6">
            {/* P1-02 (BR-07): 2 CTA setara — TA-01 default lewat catalog di bawah,
                TA-02 jalur dept lewat banner di atas. Kedua jalur sah independen
                dari awal (canon §5.2 + Q4). */}
            <div className="rounded-lg border bg-card px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Belum punya calon dosen pembimbing?</p>
                            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                Gunakan TA-02 bila Anda ingin departemen menilai topik dan menetapkan pembimbing yang sesuai. TA-01 dan TA-02 adalah dua jalur awal yang setara.
                            </p>
                        </div>
                    </div>
                    <Button type="button" variant="outline" onClick={handleOpenDepartmentDialog} disabled={!canSubmitRequest} className="w-full shrink-0 sm:w-auto">
                        Gunakan jalur TA-02
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search, Filter, and quick summary */}
            <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
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

                <div className="flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        aria-pressed={availabilityFilter === 'all'}
                        onClick={() => applyAvailabilityFilter('all')}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {availabilityStats.total} dosen ditampilkan
                    </button>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <button
                            type="button"
                            aria-pressed={availabilityFilter === 'green'}
                            onClick={() => applyAvailabilityFilter('green')}
                            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', availabilityFilter === 'green' && 'bg-emerald-50 font-medium text-emerald-800')}
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {availabilityStats.green} tersedia
                        </button>
                        <button
                            type="button"
                            aria-pressed={availabilityFilter === 'yellow'}
                            onClick={() => applyAvailabilityFilter('yellow')}
                            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', availabilityFilter === 'yellow' && 'bg-amber-50 font-medium text-amber-800')}
                        >
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            {availabilityStats.yellow} hampir penuh
                        </button>
                        <button
                            type="button"
                            aria-pressed={availabilityFilter === 'red'}
                            onClick={() => applyAvailabilityFilter('red')}
                            className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', availabilityFilter === 'red' && 'bg-red-50 font-medium text-red-800')}
                        >
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            {availabilityStats.red} penuh
                        </button>
                    </div>
                </div>
            </div>

            {/* Card Grid */}
            {catalogLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loading size="lg" text="Memuat katalog dosen..." />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    size="sm"
                    title={search || kbkFilter !== 'all' || availabilityFilter !== 'all' ? 'Tidak ada dosen yang cocok' : 'Katalog dosen kosong'}
                    description={
                        search || kbkFilter !== 'all' || availabilityFilter !== 'all'
                            ? 'Coba ubah kata kunci, filter KBK, atau filter ketersediaan.'
                            : 'Belum ada data dosen pembimbing yang tersedia saat ini.'
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((lecturer) => {
                        const config = getTrafficLightConfig(lecturer.trafficLight);
                        const acceptsRequests = lecturer.acceptingRequests !== false;
                        const canApplyToLecturer = canSubmitRequest && acceptsRequests;
                        return (
                            <Card key={lecturer.lecturerId} className="flex h-full flex-col border-border/70 shadow-none transition-colors hover:border-primary/30">
                                <CardHeader className="flex flex-row items-start gap-3 pb-3">
                                    <Avatar className="h-10 w-10 ring-1 ring-border/60">
                                        <AvatarImage src={lecturer.avatarUrl ?? undefined} alt={lecturer.fullName} />
                                        <AvatarFallback className="text-sm font-medium">
                                            {lecturer.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm leading-tight truncate">{lecturer.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{lecturer.identityNumber}</p>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 gap-1.5 text-xs ${config.badgeClass}`}>
                                        <span className={cn('h-1.5 w-1.5 rounded-full', config.color)} />
                                        {config.label}
                                    </Badge>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4 pb-4 pt-0">
                                    {lecturer.scienceGroup && (
                                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{lecturer.scienceGroup.name}</span>
                                        </div>
                                    )}
                                    {/* P2-20 (audit Sprint 3): mahasiswa cukup lihat kuota max,
                                        beban aktif, dan sisa normal. Field "Booking" disembunyikan
                                        karena value bisnisnya rendah untuk mahasiswa (lebih relevan
                                        untuk dosen + KaDep di dialog kuota). */}
                                    <div className="rounded-lg bg-muted/35 px-3 py-3">
                                        <div className="grid grid-cols-2 divide-x divide-border">
                                            <div className="pr-3">
                                                <p className="text-[11px] text-muted-foreground">Beban aktif</p>
                                                <p className="mt-1 text-lg font-semibold tabular-nums">{lecturer.activeCount}</p>
                                            </div>
                                            <div className="pl-3">
                                                <p className="text-[11px] text-muted-foreground">Sisa normal</p>
                                                <p className="mt-1 text-lg font-semibold tabular-nums">{lecturer.normalAvailable}</p>
                                            </div>
                                        </div>
                                        <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">Batas kuota normal: {lecturer.quotaMax}</p>
                                    </div>
                                    {lecturer.normalAvailable === 0 && (
                                        <div className="border-l-2 border-amber-400 pl-3 text-xs leading-relaxed text-muted-foreground">
                                            Kuota normal penuh. Dosen meninjau justifikasi Anda terlebih dahulu; jika bersedia, dosen menambahkan proyeksi lulus sebelum meneruskan pengajuan ke KaDep.
                                        </div>
                                    )}
                                    {lecturer.supervisedTopics.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-medium text-muted-foreground">Topik bimbingan</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {lecturer.supervisedTopics.slice(0, 2).map((topic: string) => (
                                                    <Badge key={topic} variant="secondary" className="px-2 py-0.5 text-[10px] font-normal">
                                                        {topic}
                                                    </Badge>
                                                ))}
                                                {lecturer.supervisedTopics.length > 2 && (
                                                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-normal">
                                                        +{lecturer.supervisedTopics.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="border-t bg-muted/15 p-3">
                                    {/* P1-16 (canon §5.2 + Q4): Diferensiasikan secara visual.
                                        - trafficLight=red → escalated TA-01 (mahasiswa kokoh memilih
                                          dosen kuota merah; dosen memberi proyeksi lulus lalu
                                          KaDep yang putuskan). Variant outline + warna amber agar terbaca
                                          berbeda dari TA-01 normal dan TA-02 banner.
                                        - trafficLight=green/yellow → TA-01 normal ke inbox dosen. */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="w-full">
                                                    <Button
                                                        size="sm"
                                                        className={cn(
                                                            'w-full',
                                                            lecturer.trafficLight === 'red'
                                                                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                                                : '',
                                                        )}
                                                        variant={lecturer.trafficLight === 'red' ? 'outline' : 'default'}
                                                        disabled={!canApplyToLecturer}
                                                        onClick={() => handleOpenDialog(lecturer)}
                                                    >
                                                        {!acceptsRequests
                                                            ? 'Tidak menerima pengajuan'
                                                            : lecturer.trafficLight === 'red'
                                                              ? 'Ajukan dengan justifikasi'
                                                              : 'Ajukan TA-01'}
                                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                                {!canSubmitRequest ? (
                                                    <p>{advisorAccess?.reason ?? 'Anda belum memenuhi syarat untuk mengajukan.'}</p>
                                                ) : !acceptsRequests ? (
                                                    <p>Dosen ini sedang tidak menerima pengajuan pembimbing. Pilih dosen lain atau gunakan TA-02 jalur departemen.</p>
                                                ) : lecturer.trafficLight === 'red' ? (
                                                    <p>
                                                        Dosen ini kuotanya penuh. Pilih jalur ini hanya bila Anda <strong>tetap kokoh</strong> ingin dibimbing oleh dosen ini. Dosen meninjau lebih dulu dan KaDep memutuskan bila dosen bersedia meneruskan. Bila fleksibel, gunakan <strong>TA-02</strong>.
                                                    </p>
                                                ) : (
                                                    <p>
                                                        TA-01 normal akan dikirim ke inbox dosen. Dosen yang menerima/menolak.
                                                    </p>
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    ) : canViewCatalog ? (
        <div className="rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">
            {advisorAccess?.reason ?? 'Pencarian pembimbing belum terbuka untuk Anda.'}
        </div>
    ) : (
        <EmptyState
            size="sm"
            title="Data TA/Metopen belum tersedia"
            description="Silakan hubungi admin atau Koordinator Metopen untuk mengaktifkan data Tugas Akhir Anda."
        />
    );

    return (
        <div className="space-y-5 sm:space-y-6">
            <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === TAB_STATUS ? statusTabContent : catalogTabContent}

            {/* Submit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent className="grid h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-3rem)] sm:w-full sm:max-w-2xl md:h-[760px]">
                    <DialogHeader className="border-b px-4 py-4 pr-12 text-left sm:px-6 sm:py-5">
                        <DialogTitle className="leading-snug">
                            {!lecturerForDialog
                                ? 'Pengajuan Jalur Departemen (TA-02)'
                                : lecturerForDialog.trafficLight === 'red'
                                ? 'Pengajuan TA-01 di Atas Kuota Normal'
                                : 'Pengajuan Dosen Pembimbing (TA-01)'}
                        </DialogTitle>
                        <DialogDescription className="leading-relaxed">
                            {!lecturerForDialog ? (
                                <span>
                                    Gunakan formulir ini bila Anda belum memiliki calon dosen pembimbing. Departemen akan meninjau usulan judul dan menunjuk dosen pembimbing yang sesuai.
                                </span>
                            ) : (
                                <span>
                                    {lecturerForDialog.trafficLight === 'red' ? 'Usulan TA-01 di atas kuota normal untuk dosen ' : 'Mengajukan ke '}
                                    <strong>{lecturerForDialog.fullName}</strong>
                                    {lecturerForDialog.trafficLight === 'red' && (
                                        <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-700 border-red-200">
                                            Kuota Normal Penuh
                                        </Badge>
                                    )}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                        <div className="space-y-4 pb-2">
                        {draft?.source === 'latest_submission' && (
                            <Alert className="border-blue-200 bg-blue-50">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-sm text-blue-800">
                                    Draft diisi dari pengajuan terakhir.
                                </AlertDescription>
                            </Alert>
                        )}
                        {draft?.lastSubmittedAt && (
                            <p className="text-xs text-muted-foreground">
                                Draft kerja terakhir tersimpan dari submission pada {formatDateShort(draft.lastSubmittedAt)}.
                            </p>
                        )}
                        {lecturerForDialog && (
                            <div className="rounded-md border bg-muted/30 px-3 py-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Kuota maksimal</span>
                                    <span className="font-medium tabular-nums">{lecturerForDialog.quotaMax}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Beban aktif resmi</span>
                                    <span className="font-medium tabular-nums">{lecturerForDialog.activeCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Sisa kuota normal</span>
                                    <span className="font-medium tabular-nums">{lecturerForDialog.normalAvailable}</span>
                                </div>
                            </div>
                        )}
                        {lecturerForDialog?.trafficLight === 'red' && (
                            <Alert className="border-amber-200 bg-amber-50">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800 text-sm">
                                    <p>
                                        Kuota normal dosen ini penuh. Pengajuan dikirim ke dosen sebagai <strong>TA-01 di atas kuota</strong>, lalu diteruskan ke <strong>Kepala Departemen</strong> jika dosen menyetujui.
                                    </p>
                                    <p className="mt-2">
                                        Atau batalkan dan gunakan <strong>Ajukan TA-02 jalur departemen</strong>.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* P1-19 / BR-22 (canon §5.12): disclaimer 72 jam lock transparan
                            agar mahasiswa tahu hak withdraw mereka sebelum mengirim. */}
                        <Alert className="border-blue-200 bg-blue-50/70">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800 text-sm">
                                Setelah submit, pengajuan <strong>dikunci 72 jam pertama</strong>. Setelah itu Anda dapat menarik pengajuan, termasuk dari status <em>Sedang Ditinjau</em>.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label>Topik Penelitian *</Label>
                            <Select value={formData.topicId} onValueChange={(val) => setFormData((p) => ({ ...p, topicId: val }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih topik..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {topics.map((t) => (
                                        <SelectItem key={t.id} value={t.id} disabled={!t.scienceGroupId}>
                                            {t.name}
                                            {t.scienceGroup?.name ? ` - ${t.scienceGroup.name}` : ' - KBK belum dipetakan'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Judul Tugas Akhir *</Label>
                            <Input
                                placeholder="Judul rencana tugas akhir, contoh: Sistem Rekomendasi Topik TA"
                                value={formData.proposedTitle}
                                onChange={(e) => setFormData((p) => ({ ...p, proposedTitle: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Isi judul rencana penelitian yang spesifik. Jangan menyalin label topik/KBK dari dropdown di atas.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Latar Belakang Singkat *</Label>
                            <Textarea
                                placeholder="Ringkas latar belakang penelitian dalam 3-5 kalimat..."
                                value={formData.backgroundSummary}
                                onChange={(e) => setFormData((p) => ({ ...p, backgroundSummary: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tujuan / Permasalahan yang Ingin Dipecahkan *</Label>
                            <Textarea
                                placeholder="Jelaskan tujuan penelitian atau masalah utama yang ingin dipecahkan..."
                                value={formData.problemStatement}
                                onChange={(e) => setFormData((p) => ({ ...p, problemStatement: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Rencana Solusi atau Sistem yang Akan Dikembangkan *</Label>
                            <Textarea
                                placeholder="Jelaskan solusi, sistem, atau pendekatan yang direncanakan..."
                                value={formData.proposedSolution}
                                onChange={(e) => setFormData((p) => ({ ...p, proposedSolution: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Objek Penelitian (Instansi/Perusahaan) *</Label>
                            <Input
                                placeholder="Nama instansi, perusahaan, atau objek penelitian..."
                                value={formData.researchObject}
                                onChange={(e) => setFormData((p) => ({ ...p, researchObject: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status Izin Penelitian *</Label>
                            <Select
                                value={formData.researchPermitStatus}
                                onValueChange={(val: 'approved' | 'in_process' | 'not_approved') =>
                                    setFormData((p) => ({ ...p, researchPermitStatus: val }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih status izin penelitian..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">Sudah Disetujui</SelectItem>
                                    <SelectItem value="in_process">Dalam Proses</SelectItem>
                                    <SelectItem value="not_approved">Belum Disetujui</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {lecturerForDialog?.trafficLight === 'red' && (
                            <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/40 p-3">
                                <div className="space-y-1">
                                    <Label className="text-amber-800">Alasan Akademik Memilih Dosen Ini *</Label>
                                    <p className="text-xs text-amber-800/80">
                                        Pilih alasan yang paling sesuai terlebih dahulu. Opsi Lainnya dipakai hanya jika alasan Anda benar-benar spesifik.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {STUDENT_OVERQUOTA_REASON_OPTIONS.map((option) => {
                                        const selected = formData.justificationReasonCode === option.code;
                                        return (
                                            <label
                                                key={option.code}
                                                className={cn(
                                                    'flex cursor-pointer items-start gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors',
                                                    selected
                                                        ? 'border-amber-400 ring-1 ring-amber-300'
                                                        : 'border-border hover:bg-muted/40',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="student-overquota-reason"
                                                    className="mt-1"
                                                    checked={selected}
                                                    onChange={() =>
                                                        setFormData((p) => {
                                                            const leavingOther =
                                                                p.justificationReasonCode === 'other' &&
                                                                option.code !== 'other';
                                                            const enteringOther = option.code === 'other';
                                                            const nextOtherDraft = leavingOther
                                                                ? p.studentJustificationDetail
                                                                : p.otherJustificationDraft;
                                                            const nextDetail = enteringOther
                                                                ? nextOtherDraft
                                                                : '';
                                                            return {
                                                                ...p,
                                                                justificationReasonCode: option.code,
                                                                otherJustificationDraft: nextOtherDraft,
                                                                studentJustificationDetail: nextDetail,
                                                                studentJustification: composeStudentJustification(
                                                                    option.code,
                                                                    nextDetail,
                                                                ),
                                                            };
                                                        })
                                                    }
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {formData.justificationReasonCode === 'other' && (
                                    <div className="space-y-2">
                                        <Label className="text-amber-700">Jelaskan alasan konkret *</Label>
                                        <Textarea
                                            placeholder={`Tulis alasan akademik yang spesifik (minimal ${RED_QUOTA_JUSTIFICATION_MIN_LENGTH} karakter). Hindari jawaban generik.`}
                                            value={formData.studentJustificationDetail}
                                            onChange={(e) =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    studentJustificationDetail: e.target.value,
                                                    otherJustificationDraft: e.target.value,
                                                    studentJustification: composeStudentJustification(
                                                        'other',
                                                        e.target.value,
                                                    ),
                                                }))
                                            }
                                            rows={4}
                                            className="border-amber-200 focus-visible:ring-amber-400"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {formData.studentJustificationDetail.trim().length}/{RED_QUOTA_JUSTIFICATION_MIN_LENGTH} karakter minimal
                                        </p>
                                    </div>
                                )}
                                {formData.justificationReasonCode &&
                                    formData.justificationReasonCode !== 'other' && (
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Tambahan (opsional)</Label>
                                            <Textarea
                                                placeholder="Tambahkan detail singkat bila perlu, misalnya topik spesifik yang sudah didiskusikan."
                                                value={formData.studentJustificationDetail}
                                                onChange={(e) =>
                                                    setFormData((p) => ({
                                                        ...p,
                                                        studentJustificationDetail: e.target.value,
                                                        studentJustification: composeStudentJustification(
                                                            p.justificationReasonCode,
                                                            e.target.value,
                                                        ),
                                                    }))
                                                }
                                                rows={2}
                                            />
                                        </div>
                                    )}
                            </div>
                        )}
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
                        {/* P2-04 (audit Sprint 3): auto-save indicator agar mahasiswa
                            tahu draft tersimpan. */}
                        <div className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                            {saveDraftMutation.isPending ? (
                                <>
                                    <Spinner className="h-3 w-3" />
                                    <span>Menyimpan draft...</span>
                                </>
                            ) : isSameFormData(formData, lastSavedFormData) ? (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Draft tersimpan otomatis</span>
                                </>
                            ) : (
                                <span className="text-amber-700">Akan tersimpan dalam beberapa detik...</span>
                            )}
                        </div>
                        {/* P2-05: tombol reset draft */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto">
                                    Mulai Draft Baru
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Kosongkan draf?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Semua field substansi akan dikosongkan. Anda dapat menutup dialog tanpa simpan otomatis bila ingin mempertahankan draft sekarang.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetDraft}>Ya, kosongkan</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} className="w-full sm:w-auto">
                            Batal
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={readOnly || submitMutation.isPending || saveDraftMutation.isPending} className="w-full sm:w-auto">
                            {submitMutation.isPending ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Mengirim...
                                </>
                            ) : (
                                !lecturerForDialog
                                    ? 'Kirim TA-02 ke KaDep'
                                    : lecturerForDialog.trafficLight === 'red'
                                        ? 'Kirim Justifikasi ke Dosen'
                                        : 'Kirim Pengajuan'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
