import { useParams } from 'react-router-dom';

import { ThesisSeminarAudienceTable } from '@/components/thesis-seminar/ThesisSeminarAudienceTable';
import { LecturerThesisSeminarDetailLayout } from '@/components/thesis-seminar/LecturerThesisSeminarDetailLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import {
  useSeminarAudiences,
  useApproveAudience,
  useUnapproveAudience,
} from '@/hooks/thesis-seminar/useLecturerSeminar';
import { Users } from 'lucide-react';

export default function LecturerThesisSeminarDetailAttendance() {
  const { seminarId } = useParams<{ seminarId: string }>();

  return (
    <LecturerThesisSeminarDetailLayout>
      {(detail) => {
        if (!detail.canOpenSupervisorFinalization || !seminarId) {
          return (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground text-sm">Anda tidak memiliki akses ke daftar hadir.</p>
            </div>
          );
        }

        return <AttendanceContent seminarId={seminarId} />;
      }}
    </LecturerThesisSeminarDetailLayout>
  );
}

function AttendanceContent({ seminarId }: { seminarId: string }) {
  const { data: audiences, isLoading } = useSeminarAudiences(seminarId);
  const approveMutation = useApproveAudience();
  const unapproveMutation = useUnapproveAudience();

  const rows = audiences ?? [];
  const approvingStudentId = approveMutation.variables?.studentId;
  const unapprovingStudentId = unapproveMutation.variables?.studentId;

  return (
    <div className="space-y-4">
      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Daftar Hadir Peserta ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex h-40 items-center justify-center">
              <Loading size="lg" text="Memuat daftar hadir..." />
            </div>
          )}
          {!isLoading && (
            <ThesisSeminarAudienceTable
              rows={rows}
              showAction
              approvingStudentId={approveMutation.isPending ? approvingStudentId : null}
              unapprovingStudentId={unapproveMutation.isPending ? unapprovingStudentId : null}
              onApprove={(row) => {
                if (!row.studentId) return;
                approveMutation.mutate({
                  seminarId,
                  studentId: row.studentId,
                });
              }}
              onUnapprove={(row) => {
                if (!row.studentId) return;
                unapproveMutation.mutate({
                  seminarId,
                  studentId: row.studentId,
                });
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
