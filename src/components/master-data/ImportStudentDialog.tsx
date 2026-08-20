import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  isImporting?: boolean;
}

const IMPORT_STAGES = [
  { threshold: 15, text: 'Membaca dan memvalidasi struktur file...' },
  { threshold: 45, text: 'Mengunggah data & menyiapkan transaksi database...' },
  { threshold: 75, text: 'Membuat akun pengguna & menyelaraskan role...' },
  { threshold: 92, text: 'Menghubungkan profil entitas & finalisasi data...' },
  { threshold: 100, text: 'Menyelesaikan pembaruan data sistem...' },
];

export function ImportStudentDialog({
  open,
  onOpenChange,
  selectedFile,
  onFileChange,
  onImport,
  isImporting = false,
}: ImportStudentDialogProps) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isImporting) {
      setProgress(10);
      setStageText('Mempersiapkan proses import...');

      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev; // Hold at 92% until server finishes
          const next = prev + Math.floor(Math.random() * 8) + 4;
          const capped = Math.min(next, 92);
          
          const currentStage = IMPORT_STAGES.find((s) => capped <= s.threshold);
          if (currentStage) {
            setStageText(currentStage.text);
          }
          return capped;
        });
      }, 450);
    } else {
      if (progress > 0) {
        setProgress(100);
        setStageText('Selesai!');
        const resetTimer = setTimeout(() => {
          setProgress(0);
          setStageText('');
        }, 1200);
        return () => clearTimeout(resetTimer);
      }
      setProgress(0);
      setStageText('');
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isImporting]);

  const handleDownloadExcelTemplate = () => {
    // 1. Sheet Utama Template
    const templateData = [
      {
        'NIM/NIP': '2211522001',
        'Nama Lengkap': 'Ahmad Fauzi',
        'Email': 'ahmad@student.unand.ac.id',
        'Role': 'Mahasiswa',
        'Status Mahasiswa': 'active',
      },
      {
        'NIM/NIP': '198501012010011001',
        'Nama Lengkap': 'Dr. Contoh Dosen, M.T.',
        'Email': 'dosen@fti.unand.ac.id',
        'Role': 'Pembimbing 1, Pembimbing 2, Penguji',
        'Status Mahasiswa': '',
      },
      {
        'NIM/NIP': '198410062012121001',
        'Nama Lengkap': 'Contoh Ketua Departemen, M.Kom',
        'Email': 'kadep@fti.unand.ac.id',
        'Role': 'Ketua Departemen, Pembimbing 1, Penguji',
        'Status Mahasiswa': '',
      },
      {
        'NIM/NIP': '199011032019032008',
        'Nama Lengkap': 'Contoh Dosen GKM, M.Kom',
        'Email': 'gkm@fti.unand.ac.id',
        'Role': 'GKM, Pembimbing 2, Penguji',
        'Status Mahasiswa': '',
      },
    ];

    // 2. Sheet Panduan
    const guideData = [
      { 'Kolom': 'NIM/NIP', 'Keterangan': 'Nomor Induk Mahasiswa (NIM) atau Nomor Induk Pegawai (NIP). Wajib diisi.' },
      { 'Kolom': 'Nama Lengkap', 'Keterangan': 'Nama lengkap user beserta gelar jika ada.' },
      { 'Kolom': 'Email', 'Keterangan': 'Email user yang unik (contoh: @student.unand.ac.id atau @fti.unand.ac.id). Wajib diisi.' },
      { 'Kolom': 'Role', 'Keterangan': 'Role user. Jika memiliki multiple role, pisahkan dengan koma (contoh: "Pembimbing 1, Penguji", "Ketua Departemen, Pembimbing 1"). Pilihan role baku: Mahasiswa, Pembimbing 1, Pembimbing 2, Penguji, Ketua Departemen, Sekretaris Departemen, GKM, Koordinator Matkul Metopen, Koordinator Yudisium, Tim Pengelola CPL, Admin.' },
      { 'Kolom': 'Status Mahasiswa', 'Keterangan': 'Status mahasiswa (khusus mahasiswa). Pilihan: active, bss, lulus, dropout, mengundurkan_diri. Default: active. Kosongkan untuk Dosen.' },
    ];

    const wb = XLSX.utils.book_new();
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    const wsGuide = XLSX.utils.json_to_sheet(guideData);

    // Styling column width
    wsTemplate['!cols'] = [
      { wch: 22 }, // NIM/NIP
      { wch: 35 }, // Nama Lengkap
      { wch: 35 }, // Email
      { wch: 40 }, // Role
      { wch: 20 }, // Status Mahasiswa
    ];

    wsGuide['!cols'] = [
      { wch: 20 },
      { wch: 90 },
    ];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template User');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

    XLSX.writeFile(wb, 'template_import_user.xlsx');
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = 'NIM/NIP,Nama Lengkap,Email,Role,Status Mahasiswa\n2211522001,Ahmad Fauzi,ahmad@student.unand.ac.id,Mahasiswa,active\n198501012010011001,Dr. Contoh Dosen M.T.,dosen@fti.unand.ac.id,"Pembimbing 1, Pembimbing 2, Penguji",\n198410062012121001,Contoh Ketua Departemen M.Kom,kadep@fti.unand.ac.id,"Ketua Departemen, Pembimbing 1, Penguji",';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_import_user.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isImporting && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import User (Mahasiswa & Dosen)</DialogTitle>
          <DialogDescription>
            Upload file Excel (.xlsx) atau CSV untuk import data user secara massal
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="user-file">File Excel / CSV</Label>
            <Input
              id="user-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              disabled={isImporting}
            />

            {selectedFile && (
              <div className="flex items-center gap-2 p-2 mt-1 rounded-md bg-muted/60 border text-xs">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium truncate flex-1">{selectedFile.name}</span>
                <span className="text-muted-foreground shrink-0">{formatFileSize(selectedFile.size)}</span>
              </div>
            )}

            {/* Loading Indicator & Progress Stage */}
            {isImporting && (
              <div className="mt-3 p-3.5 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 space-y-2.5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Sedang Memproses Data...</span>
                  </div>
                  <span className="font-bold text-blue-800 dark:text-blue-200">{progress}%</span>
                </div>

                <Progress value={progress} className="h-2 bg-blue-100 dark:bg-blue-900/40" />

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="italic">{stageText}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 mt-2">
              <p className="text-xs text-muted-foreground">
                Kolom: <strong>NIM/NIP</strong>, <strong>Nama Lengkap</strong>, <strong>Email</strong>, <strong>Role</strong> (bisa multi-role pisah koma), <strong>Status Mahasiswa</strong>
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadExcelTemplate} disabled={isImporting} className="h-8 flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 border-green-200 hover:bg-green-50">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download Template Excel (.xlsx)
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleDownloadCsvTemplate} disabled={isImporting} className="h-8 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Download className="w-3.5 h-3.5" />
                  Format CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Batal
          </Button>
          <Button onClick={onImport} disabled={!selectedFile || isImporting}>
            {isImporting ? (
              <>
                <Spinner className="mr-2" />
                Mengimport ({progress}%)...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

