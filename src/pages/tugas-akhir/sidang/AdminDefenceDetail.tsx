import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import {
  ThesisExaminerAvailabilityStatusBadge,
  type ThesisExaminerAvailabilityStatus,
} from '@/components/shared/ThesisExaminerAvailabilityStatusBadge';
import { DefenceValidationModal } from '@/components/sidang/DefenceValidationModal';
import { DefenceSchedulingSection } from '@/components/sidang/DefenceSchedulingSection';
import { useAdminDefenceDetail } from '@/hooks/defence';
import { toTitleCaseName, formatDateShortId, formatDateOnlyId, formatDateTimeId, formatRoleName } from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ArrowLeft,
} from 'lucide-react';
import type { DocumentSubmitStatus, AdminDefenceListItem } from '@/types/defence.types';

function extractTime(timeIso?: string | null): string {
  if (!timeIso) return '--';
  const d = new Date(timeIso);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function getDocStatusDisplay(status: DocumentSubmitStatus) {
  switch (status) {
    case 'approved':
      return { icon: CheckCircle, label: 'Disetujui', badge: 'success' as const };
    case 'declined':
      return { icon: XCircle, label: 'Ditolak', badge: 'destructive' as const };
    case 'submitted':
    default:
      return { icon: Clock, label: 'Menunggu', badge: 'warning' as const };
  }
}

export default function AdminDefenceDetail() {
  const { defenceId } = useParams<{ defenceId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { data: detail, isLoading } = useAdminDefenceDetail(defenceId);

  const [validationOpen, setValidationOpen] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang/admin' },
      { label: 'Detail' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Sidang');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail sidang..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Sidang tidak ditemukan.</div>
      </div>
    );
  }

  const defenceForModal: AdminDefenceListItem = {
    id: detail.id,
    thesisId: detail.thesis.id,
    studentName: detail.student.name,
    studentNim: detail.student.nim,
    thesisTitle: detail.thesis.title,
    supervisors: detail.supervisors,
    status: detail.status,
    registeredAt: detail.registeredAt,
    date: detail.date,
    startTime: detail.startTime,
    endTime: detail.endTime,
    documentSummary: {
      total: detail.documentTypes.length,
      submitted: detail.documents.filter((d) => d.status === 'submitted').length,
      approved: detail.documents.filter((d) => d.status === 'approved').length,
      declined: detail.documents.filter((d) => d.status === 'declined').length,
    },
  };

  return (
    <>
      <div className="p-4 space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tugas-akhir/sidang/admin')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {toTitleCaseName(detail.student.name)}
              </h1>
              <p className="text-gray-500">{detail.student.nim}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThesisEventStatusBadge 
              status={detail.status} 
              scheduledDate={detail.date} 
              startTime={detail.startTime} 
            />
              {detail.status === 'registered' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setValidationOpen(true)}
                >
                  <ClipboardCheck className="h-4 w-4 mr-1" />
                  Validasi Dokumen
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student & Thesis Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Informasi Tugas Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Judul:</span>
                <p className="font-medium mt-0.5">{detail.thesis.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pembimbing:</span>
                <div className="mt-1 space-y-1">
                  {detail.supervisors.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground text-xs min-w-[100px]">
                        {formatRoleName(s.role)}:
                      </span>
                      <span>{toTitleCaseName(s.name)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Defence Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informasi Sidang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Daftar:</span>
                <span>{detail.registeredAt ? formatDateTimeId(detail.registeredAt) : '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Tanggal Sidang:</span>
                <span className="text-right">
                  {detail.date
                    ? `${formatDateOnlyId(detail.date)}, ${extractTime(detail.startTime)} – ${extractTime(detail.endTime)}`
                    : 'Belum dijadwalkan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <span>{detail.room ? 'Luring' : (detail.meetingLink ? 'Daring' : '-')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ruangan:</span>
                <span>{detail.room?.name || '-'}</span>
              </div>
              {detail.meetingLink && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Link:</span>
                  <a
                    href={detail.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-[200px]"
                  >
                    {detail.meetingLink}
                  </a>
                </div>
              )}
              {detail.examiners.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Penguji:</span>
                  <div className="mt-1 space-y-1">
                    {detail.examiners.map((e) => (
                      <div key={e.id} className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{toTitleCaseName(e.lecturerName)}</span>
                        <span className="text-xs text-muted-foreground">
                          (Penguji {e.order})
                        </span>
                        <ThesisExaminerAvailabilityStatusBadge status={e.availabilityStatus as ThesisExaminerAvailabilityStatus} className="text-[10px] px-1 py-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detail.rejectedExaminers && detail.rejectedExaminers.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-xs">Riwayat Penolakan:</span>
                  <div className="mt-1 space-y-1">
                    {detail.rejectedExaminers.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 opacity-60">
                        <XCircle className="h-3 w-3 text-red-400" />
                        <span className="text-xs line-through">{toTitleCaseName(e.lecturerName)}</span>
                        <span className="text-xs text-muted-foreground">
                          (Penguji {e.order})
                        </span>
                        {e.respondedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            — {formatDateTimeId(e.respondedAt)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dokumen Sidang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detail.documentTypes.map((dt) => {
                const doc = detail.documents.find(
                  (d) => d.documentTypeId === dt.id
                );
                const statusDisplay = doc
                  ? getDocStatusDisplay(doc.status)
                  : null;
                const canDownload = !!doc?.filePath;

                return (
                  <div
                    key={dt.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{dt.name}</div>
                        {doc ? (
                          <div className="text-xs text-muted-foreground truncate">
                            {doc.fileName || 'File'} •{' '}
                            {formatDateShortId(doc.submittedAt)}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Belum diunggah
                          </div>
                        )}
                        {doc?.notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            Catatan: {doc.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusDisplay && (
                        <Badge variant={statusDisplay.badge}>
                          {statusDisplay.label}
                        </Badge>
                      )}
                      {canDownload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await openProtectedFile(doc!.filePath!, doc?.fileName || undefined);
                            } catch (error) {
                              toast.error((error as Error).message || 'Gagal membuka dokumen');
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Section */}
        {(detail.status === 'examiner_assigned' || detail.status === 'scheduled') && (
          <DefenceSchedulingSection
            defenceId={detail.id}
            isEditable={detail.status === 'examiner_assigned' || detail.status === 'scheduled'}
          />
        )}
      </div>

      {/* Validation Modal */}
      <DefenceValidationModal
        defence={defenceForModal}
        open={validationOpen}
        onOpenChange={setValidationOpen}
      />
    </>
  );
}
