import { useEffect } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PageHeading } from '@/components/shared/PageHeading';
import { StudentSupervisorRequestForm } from '@/components/thesis-proposal/StudentSupervisorRequestForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useMySupervisorRequests } from '@/hooks/thesis-proposal/useSupervisorRequests';

const PROPOSAL_PATH = '/tugas-akhir/proposal';

/**
 * Tugas Akhir › Proposal › Pengajuan Pembimbing (Paket P9, 2): the request form on its own page,
 * because the form is long and the lecturer catalog does not fit in a modal. A student with an
 * active request goes back to the Proposal page.
 */
export default function StudentSupervisorRequestPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useMySupervisorRequests();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir', href: '/tugas-akhir' }, { label: 'Proposal', href: PROPOSAL_PATH }, { label: 'Pengajuan Pembimbing' }]);
    setTitle('Pengajuan Pembimbing');
  }, [setBreadcrumbs, setTitle]);

  if (isLoading) return <div className="flex justify-center p-10"><Spinner className="h-6 w-6" /></div>;
  if (error || !data) return <p className="p-6 text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat pengajuan pembimbing.'}</p>;
  if (data.activeRequest) return <Navigate to={PROPOSAL_PATH} replace />;

  const { submission, draft } = data;
  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Pengajuan Pembimbing" subtitle={submission.academicYear ? `Semester ${submission.academicYear.label}` : undefined} />
      {submission.canSubmit ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            {submission.revisionRequested && (
              <Alert><AlertDescription>Ketua Departemen meminta revisi. Perbarui isian sesuai catatan lalu ajukan ulang.</AlertDescription></Alert>
            )}
            <StudentSupervisorRequestForm draft={draft} onClose={() => navigate(PROPOSAL_PATH)} onSubmitted={() => navigate(PROPOSAL_PATH)} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Alert><AlertDescription>{submission.blockedReason}</AlertDescription></Alert>
          <Button variant="outline" onClick={() => navigate(PROPOSAL_PATH)}>Kembali</Button>
        </div>
      )}
    </div>
  );
}
