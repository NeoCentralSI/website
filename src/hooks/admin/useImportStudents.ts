import { useState } from 'react';
import { toast } from 'sonner';
import { importStudentsCsvAPI } from '@/services/admin.service';

export const useImportStudents = (onSuccess: () => void) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImportCsv = async () => {
    if (!selectedFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    try {
      const result = await importStudentsCsvAPI(selectedFile);
      toast.success(`Berhasil import ${result.summary?.created || 0} mahasiswa`);
      setImportDialogOpen(false);
      setSelectedFile(null);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal import CSV');
    }
  };

  return {
    importDialogOpen,
    setImportDialogOpen,
    selectedFile,
    setSelectedFile,
    handleImportCsv,
  };
};
