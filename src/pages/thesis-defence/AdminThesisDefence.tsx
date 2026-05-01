import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { AdminThesisDefenceTable } from '@/components/thesis-defence/AdminThesisDefenceTable';
import { AdminThesisDefenceValidationModal } from '@/components/thesis-defence/AdminThesisDefenceValidationModal';
import type { AdminDefenceListItem } from '@/types/defence.types';

export default function AdminThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [selectedDefence, setSelectedDefence] = useState<AdminDefenceListItem | null>(null);
  const [validationOpen, setValidationOpen] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Sidang' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang Tugas Akhir');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const handleValidate = (defence: AdminDefenceListItem) => {
    setSelectedDefence(defence);
    setValidationOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sidang Tugas Akhir</h1>
          <p className="text-gray-500">Validasi berkas dan manajemen sidang mahasiswa</p>
        </div>
      </div>

      <AdminThesisDefenceTable onValidate={handleValidate} />

      <AdminThesisDefenceValidationModal
        defence={selectedDefence}
        open={validationOpen}
        onOpenChange={setValidationOpen}
      />
    </div>
  );
}
