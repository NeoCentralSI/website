import { RequirementDocumentRow } from '@/components/shared/RequirementDocumentRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  toTitleCaseName,
  formatDateOnlyId,
  formatRoleName,
} from '@/lib/text';
import { useDocumentViewer } from '@/components/thesis/useDocumentViewer';
import type { DocumentSubmitStatus } from '@/types/seminar.types';
import { BookOpen, Calendar, FileText } from 'lucide-react';

function extractSeminarTime(timeIso?: string | null): string {
  if (!timeIso) return '--:--';
  const d = new Date(timeIso);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}



interface Props {
  detail: any;
}

interface SeminarRequirement {
  id: string;
  name: string;
}

interface SeminarRequirementDocument {
  id?: string;
  requirementId?: string;
  requirementName?: string;
  documentTypeId?: string;
  documentTypeName?: string;
  fileName?: string | null;
  filePath?: string | null;
  status: DocumentSubmitStatus;
  submittedAt?: string | null;
  notes?: string | null;
}

export function ThesisSeminarDetailIdentityPanel({ detail }: Props) {
  const supervisors: any[] = [...(detail.supervisors || (detail.thesis?.supervisors || []).map((s: any) => ({
    name: s.lecturerName || s.name,
    role: s.role,
  })))].sort((a, b) => (a.role || '').localeCompare(b.role || ''));

  const examiners: any[] = detail.examiners ?? [];
  const documents = (detail.documents ?? []) as SeminarRequirementDocument[];
  const requirements: SeminarRequirement[] = detail.requirements?.length
    ? detail.requirements
    : detail.documentTypes?.length
      ? detail.documentTypes
      : Array.from(
        new Map(
          documents.map((document) => {
            const requirementId = document.requirementId || document.documentTypeId || document.id || '';
            return [
              requirementId,
              { id: requirementId, name: document.requirementName || document.documentTypeName || 'Dokumen' },
            ];
          }),
        ).values(),
      );

  const { openDocument, viewer } = useDocumentViewer();
  const handleDownload = (filePath: string, fileName?: string | null) => openDocument(filePath, fileName);

  return (
    <div className="space-y-6">
      {viewer}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Informasi Seminar */}
        <Card className="lg:col-span-1 h-full gap-4 py-6">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Informasi Seminar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Mahasiswa</p>
                <p className="text-sm font-medium mt-0.5 leading-snug">{toTitleCaseName(detail.student?.name)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NIM</p>
                <p className="text-sm font-medium mt-0.5">{detail.student?.nim}</p>
              </div>

              {examiners.map((e: any, index: number) => (
                <div key={e.id || index}>
                  <p className="text-xs text-muted-foreground">Penguji {e.order || index + 1}</p>
                  <p className="text-sm font-medium mt-0.5">{toTitleCaseName(e.lecturerName)}</p>
                </div>
              ))}

              <div>
                <p className="text-xs text-muted-foreground">Tanggal</p>
                <p className="text-sm font-medium mt-0.5">
                  {detail.date ? formatDateOnlyId(detail.date) : 'Belum dijadwalkan'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waktu</p>
                <p className="text-sm font-medium mt-0.5">
                  {!detail.startTime || !detail.endTime
                    ? detail.date ? formatDateOnlyId(detail.date) : '--:--'
                    : `${extractSeminarTime(detail.startTime)} – ${extractSeminarTime(detail.endTime)} WIB`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ruangan</p>
                <div className="text-sm font-medium mt-0.5 leading-snug">
                  {detail.room?.name || '-'}
                  {detail.meetingLink && (
                    <a
                      href={detail.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs font-normal block mt-1 truncate max-w-xs"
                    >
                      {detail.meetingLink}
                    </a>
                  )}
                </div>
              </div>
              {detail.scheduledAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Jadwal Ditetapkan Pada</p>
                  <p className="text-sm font-medium mt-0.5">{formatDateOnlyId(detail.scheduledAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Informasi Tugas Akhir & Dokumen Seminar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Tugas Akhir */}
          <Card className="gap-4 py-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Informasi Tugas Akhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Judul</p>
                <p className="text-sm font-medium mt-0.5 leading-snug">{detail.thesis?.title}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supervisors.map((s: any, index: number) => (
                  <div key={index}>
                    <p className="text-xs text-muted-foreground">
                      {s.role ? formatRoleName(s.role) : `Dosen Pembimbing ${index + 1}`}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{toTitleCaseName(s.name)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dokumen Seminar */}
          {requirements.length > 0 && (
            <Card className="gap-4 py-6">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Dokumen Seminar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {requirements.map((dt) => {
                  const doc = documents.find((d) => (d.requirementId || d.documentTypeId) === dt.id);
                  return (
                    <RequirementDocumentRow
                      key={dt.id}
                      name={dt.name}
                      status={doc?.status}
                      fileName={doc?.fileName}
                      submittedAt={doc?.submittedAt}
                      notes={doc?.notes}
                      onView={doc?.filePath ? () => handleDownload(doc.filePath!, doc.fileName) : undefined}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
