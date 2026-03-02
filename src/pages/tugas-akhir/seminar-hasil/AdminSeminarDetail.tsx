import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import { ValidationModal } from '@/components/seminar/ValidationModal';
import { useAdminSeminarDetail } from '@/hooks/seminar/useAdminSeminar';
import { toTitleCaseName, formatDateId, formatRoleName } from '@/lib/text';
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
  CheckCircle2,
} from 'lucide-react';
import type { DocumentSubmitStatus, AdminSeminarListItem } from '@/types/seminar.types';
import { ENV } from '@/config/env';

function getDocStatusDisplay(status: DocumentSubmitStatus) {
  switch (status) {
    case 'approved':
      return { icon: CheckCircle, label: 'Disetujui', color: 'text-green-600', badge: 'success' as const };
    case 'declined':
      return { icon: XCircle, label: 'Ditolak', color: 'text-red-600', badge: 'destructive' as const };
    case 'submitted':
    default:
      return { icon: Clock, label: 'Menunggu', color: 'text-amber-600', badge: 'warning' as const };
  }
}

export default function AdminSeminarDetail() {
  const { seminarId } = useParams<{ seminarId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { data: detail, isLoading } = useAdminSeminarDetail(seminarId);

  const [validationOpen, setValidationOpen] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar/admin' },
      { label: 'Detail' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail seminar..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Seminar tidak ditemukan.</div>
      </div>
    );
  }

  // Build a minimal AdminSeminarListItem for ValidationModal
  const seminarForModal: AdminSeminarListItem = {
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
            onClick={() => navigate(-1)}
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
              <SeminarStatusBadge status={detail.status} />
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

          {/* Seminar Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informasi Seminar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Daftar:</span>
                <span>{detail.registeredAt ? formatDateId(detail.registeredAt) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Seminar:</span>
                <span>{detail.date ? formatDateId(detail.date) : 'Belum dijadwalkan'}</span>
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
                        {e.availabilityStatus === 'available' && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        {e.availabilityStatus === 'pending' && (
                          <Badge variant="warning" className="text-[10px] px-1 py-0">
                            Menunggu
                          </Badge>
                        )}
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
                            — {formatDateId(e.respondedAt)}
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
              Dokumen Seminar
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
                const downloadUrl = doc?.filePath
                  ? `${ENV.API_BASE_URL}/${doc.filePath}`
                  : null;

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
                            {formatDateId(doc.submittedAt)}
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
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling placeholder */}
        {(detail.status === 'examiner_assigned' || detail.status === 'verified') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Penjadwalan Seminar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-6">
                Fitur penjadwalan akan segera tersedia.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Validation Modal */}
      <ValidationModal
        seminar={seminarForModal}
        open={validationOpen}
        onOpenChange={setValidationOpen}
      />
    </>
  );
}
