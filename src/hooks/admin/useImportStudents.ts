import { useState } from 'react';
import { toast } from 'sonner';
import { importStudentsCsvAPI } from '@/services/admin.service';

export const useImportStudents = (onSuccess: () => void) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportCsv = async () => {
    if (!selectedFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importStudentsCsvAPI(selectedFile);
      toast.success(`Berhasil import ${result.summary?.created || 0} mahasiswa`);
      setImportDialogOpen(false);
      setSelectedFile(null);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal import CSV');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importDialogOpen,
    setImportDialogOpen,
    selectedFile,
    setSelectedFile,
    handleImportCsv,
    isImporting,
  };
};
