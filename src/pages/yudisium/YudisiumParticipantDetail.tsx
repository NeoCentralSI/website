import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import {
  ArrowLeft, FileText, CheckCircle,
  Eye,
  Check, Plus, CheckCircle2,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  useYudisiumParticipantDetail,
  useParticipantCplScores,
  useVerifyCplScore,
  useRepairCplScore,
} from '@/hooks/yudisium/useYudisiumParticipants';
import { useRole } from '@/hooks/shared';
import { openProtectedFile } from '@/lib/protected-file';
import { formatDateId, toTitleCaseName } from '@/lib/text';
import type { CplScoreItem } from '@/types/admin-yudisium.types';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered:    { label: 'Menunggu Validasi Dokumen', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  verified:      { label: 'Menunggu Validasi CPL',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  cpl_validated: { label: 'Calon Peserta Yudisium',   className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  appointed:     { label: 'Peserta Yudisium',          className: 'bg-purple-50 text-purple-700 border-purple-200' },
  finalized:     { label: 'Lulus',                     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:      { label: 'Belum Lulus',               className: 'bg-red-50 text-red-700 border-red-200' },
};



export default function YudisiumParticipantDetail() {
  const { id: yudisiumId, yudisiumParticipantId } = useParams<{ id: string; yudisiumParticipantId: string }>();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { isGkm } = useRole();
  const canPerformActions = isGkm();

  const { data, isLoading } = useYudisiumParticipantDetail(yudisiumId!, yudisiumParticipantId!);
  const { data: cplData, isLoading: loadingCpl, isFetching, refetch } = useParticipantCplScores(yudisiumId!, yudisiumParticipantId!);

  const verifyMutation = useVerifyCplScore(yudisiumId!, yudisiumParticipantId!);
  const repairMutation = useRepairCplScore(yudisiumId!, yudisiumParticipantId!);

  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [viewModalOpen,   setViewModalOpen]   = useState(false);
  const [selectedCpl,     setSelectedCpl]     = useState<CplScoreItem | null>(null);
  
  const [newScore,      setNewScore]      = useState<number>(0);
  const [recFile,       setRecFile]       = useState<File | null>(null);
  const [setFile,       setSetFile]       = useState<File | null>(null);
  
  const [verifyConfirmId, setVerifyConfirmId] = useState<string | null>(null);
  const [cplSearch,       setCplSearch]       = useState('');

  const handleDownloadCplReport = () => {
    if (!cplData?.cplScores || cplData.cplScores.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS DAN TEKNOLOGI', pageWidth / 2, 15, { align: 'center' });
    doc.text('UNIVERSITAS ANDALAS', pageWidth / 2, 20, { align: 'center' });
    doc.text('FAKULTAS TEKNOLOGI INFORMASI', pageWidth / 2, 25, { align: 'center' });
    doc.text('DEPARTEMEN SISTEM INFORMASI', pageWidth / 2, 30, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Kampus Universitas Andalas, Limau Manis, Padang, Kode Pos 25163', pageWidth / 2, 35, { align: 'center' });
    doc.text('Email: jurusan_si@fti.unand.ac.id dan website: http://si.fti.unand.ac.id', pageWidth / 2, 40, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(margin, 43, pageWidth - margin, 43);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMULIR PENILAIAN CAPAIAN PEMBELAJARAN LULUSAN (CPL)', pageWidth / 2, 52, { align: 'center' });

    // A. Student Data
    doc.setFontSize(10);
    doc.text('A. DATA MAHASISWA', margin, 62);
    doc.setFont('helvetica', 'normal');
    doc.text('Nama Lengkap', margin, 69);
    doc.text(`: ${data?.studentName || '-'}`, margin + 40, 69);
    doc.text('NIM', margin, 75);
    doc.text(`: ${data?.studentNim || '-'}`, margin + 40, 75);

    // B. CPL Assessment Table
    doc.setFont('helvetica', 'bold');
    doc.text('B. PENILAIAN CAPAIAN PEMBELAJARAN LULUSAN (CPL)', margin, 85);

    const tableData = cplData.cplScores.map((sc) => [
      sc.code,
      sc.description,
      sc.score ?? '-',
      sc.passed ? 'Tercapai' : 'Tidak Tercapai'
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Kode CPL', 'Deskripsi CPL', 'Nilai', 'Status Capaian']],
      body: tableData,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
      }
    });

    // C. Conclusion
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.text('C. KESIMPULAN ASESMEN', margin, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const allPassed = cplData.cplScores.every(sc => sc.passed);
    doc.rect(margin, finalY + 4, 3, 3);
    if (allPassed) doc.text('x', margin + 0.8, finalY + 6.5);
    doc.text('Seluruh CPL telah dicapai sesuai standar minimum kelulusan', margin + 6, finalY + 7);
    
    doc.rect(margin, finalY + 11, 3, 3);
    if (!allPassed) doc.text('x', margin + 0.8, finalY + 13.5);
    doc.text(`Ada CPL yang belum tercapai (sebutkan): ${allPassed ? '-' : '...' }`, margin + 6, finalY + 14);
    
    doc.rect(margin, finalY + 18, 3, 3);
    doc.text('Perlu tindak lanjut: -', margin + 6, finalY + 21);

    // D. Signature
    const validator = cplData.cplScores.find(sc => sc.validatedBy);
    const validatorName = validator?.validatedBy || '...';
    const validatorNip = validator?.validatedByNip || '...';
    const validatedDate = validator?.validatedAt ? new Date(validator.validatedAt) : new Date();

    const signY = finalY + 40;
    doc.setFontSize(10);
    doc.text(`Padang, ${formatDateId(validatedDate)}`, pageWidth - margin - 65, signY);
    doc.text('Koordinator Asesmen CPL', pageWidth - margin - 65, signY + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text(validatorName, pageWidth - margin - 65, signY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP: ${validatorNip}`, pageWidth - margin - 65, signY + 33);

    doc.save(`Form_Penilaian_CPL_${data?.studentNim || 'Mhs'}.pdf`);
  };

  const baseDetailPath = `/yudisium/${yudisiumId}`;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: data?.yudisium?.name ?? 'Detail', href: baseDetailPath },
      { label: data?.studentName ?? 'Detail Peserta' },
    ]);
    setTitle(data?.studentName ?? 'Detail Peserta');
  }, [setBreadcrumbs, setTitle, data, baseDetailPath]);

  const cplScores = useMemo(() => {
    const scores = cplData?.cplScores ?? [];
    if (!cplSearch) return scores;
    return scores.filter(s => 
      (s.code?.toLowerCase().includes(cplSearch.toLowerCase())) || 
      (s.description?.toLowerCase().includes(cplSearch.toLowerCase()))
    );
  }, [cplData?.cplScores, cplSearch]);



  const cplColumns = useMemo<Column<CplScoreItem>[]>(() => {
    const cols: Column<CplScoreItem>[] = [
      {
        key: 'no',
        header: 'No',
        width: 50,
        className: 'text-center',
        render: (_, idx) => <span className="text-sm text-muted-foreground">{idx + 1}</span>
      },
      {
        key: 'code',
        header: 'Kode CPL',
        width: 100,
        render: (row) => <span className="font-medium">{row.code ?? '-'}</span>
      },
      {
        key: 'description',
        header: 'Deskripsi',
        className: 'whitespace-normal',
        render: (row) => <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{row.description}</p>
      },
      {
        key: 'score',
        header: 'Nilai',
        width: 80,
        className: 'text-center',
        render: (row) => <span className="font-semibold">{row.score ?? '-'}</span>
      },
      {
        key: 'minimalScore',
        header: 'Minimal',
        width: 80,
        className: 'text-center',
        accessor: 'minimalScore'
      },
      {
        key: 'status',
        header: 'Status',
        width: 130,
        className: 'text-center',
        render: (row) => (
          <Badge variant="outline" className={row.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
            {row.passed ? 'Lulus' : 'Tidak Lulus'}
          </Badge>
        )
      },
    ];

    cols.push({
      key: 'actions',
      header: 'Aksi',
      width: 140,
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end items-center gap-1">
          {/* Eye (view repair detail) — visible to ALL roles */}
          {(row.oldScore !== null || row.recommendationDocument) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                setSelectedCpl(row);
                setViewModalOpen(true);
              }}
              title="Lihat Detail Perbaikan"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {/* Verified badge — visible to ALL roles */}
          {row.status === 'verified' && (
            <div className="flex items-center justify-center h-8 w-8" title={`Tervalidasi oleh ${row.verifiedBy ?? '-'}`}>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          )}

          {/* Verify / Repair actions — GKM only */}
          {canPerformActions && row.status !== 'verified' && (
            <>
              {row.passed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setVerifyConfirmId(row.cplId)}
                  disabled={verifyMutation.isPending}
                  title="Validasi CPL"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {!row.passed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setSelectedCpl(row);
                    setNewScore(row.minimalScore);
                    setRecFile(null);
                    setSetFile(null);
                    setRepairModalOpen(true);
                  }}
                  title="Remedial / Perbaikan"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      )
    });

    return cols;
  }, [verifyMutation.isPending, canPerformActions]);



  if (isLoading || loadingCpl) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail peserta..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Data peserta tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = PARTICIPANT_STATUS_MAP[data.status] || PARTICIPANT_STATUS_MAP.registered;

  return (
    <div className="p-6 space-y-12 max-w-full overflow-x-hidden">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(baseDetailPath)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{toTitleCaseName(data.studentName)}</h1>
            <p className="text-muted-foreground truncate">{data.studentNim}</p>
          </div>
        </div>
        <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
      </div>

      {/* ── Identity + Documents ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informasi Mahasiswa Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">
            Informasi Mahasiswa
          </h2>
          <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="pt-6 space-y-4 flex-1">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nama Mahasiswa</p>
                  <p className="text-sm font-medium mt-0.5 leading-snug">{toTitleCaseName(data.studentName)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NIM</p>
                  <p className="text-sm font-medium mt-0.5">{data.studentNim}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Judul Tugas Akhir</p>
                  <p className="text-sm font-medium mt-0.5 leading-snug">{data.thesisTitle || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {data.supervisors.map((s: any, i: number) => (
                    <div key={i}>
                      <p className="text-xs text-muted-foreground">{s.role}</p>
                      <p className="text-sm font-medium mt-0.5">{toTitleCaseName(s.name)}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Daftar Yudisium</p>
                  <p className="text-sm font-medium mt-0.5">{data.registeredAt ? formatDateId(data.registeredAt) : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dokumen Persyaratan Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">
            Dokumen Persyaratan
          </h2>
          <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="pt-6 space-y-3 flex-1">
              {data.documents.map((doc: any) => (
                <div
                  key={doc.requirementId}
                  className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl shadow-sm hover:border-border transition-colors gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2.5 rounded-lg shrink-0 ${doc.document ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-sm text-foreground block truncate">{doc.requirementName}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                        {doc.document ? `${doc.document.fileName || 'File'} • ${formatDateId(doc.document.createdAt)}` : 'Belum diunggah'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'destructive' : 'warning'}
                      className="rounded-md font-medium px-2.5 py-0.5 whitespace-nowrap"
                    >
                      {doc.status === 'approved' ? 'Disetujui' : doc.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </Badge>
                    {doc.document?.filePath && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-9 w-9 border rounded-lg hover:bg-accent shrink-0"
                        onClick={() => openProtectedFile(doc.document.filePath, doc.document.fileName)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── CPL Table Section ── */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold px-1">
          Capaian Pembelajaran Lulusan (CPL)
        </h2>
        <CustomTable
          columns={cplColumns}
          data={cplScores}
          loading={loadingCpl}
          isRefreshing={isFetching && !loadingCpl}
          total={cplScores.length}
          page={1}
          pageSize={100}
          onPageChange={() => {}}
          searchValue={cplSearch}
          onSearchChange={setCplSearch}
          emptyText="Tidak ada data CPL"
          actions={
            <div className="flex items-center gap-2">
              {['cpl_validated', 'appointed', 'finalized'].includes(data?.status || '') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                  onClick={handleDownloadCplReport}
                >
                  <Download className="h-4 w-4" />
                  Download Hasil
                </Button>
              )}
              <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !loadingCpl} />
            </div>
          }
        />
      </div>



      {/* ── Modals ── */}
      
      {/* Repair Modal */}
      <Dialog open={repairModalOpen} onOpenChange={setRepairModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perbaikan / Remedial CPL</DialogTitle>
            <DialogDescription>Masukkan nilai baru dan unggah dokumen pendukung untuk {selectedCpl?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skor Lama</Label>
                <Input value={selectedCpl?.score ?? '-'} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Skor Baru</Label>
                <Input
                  type="number"
                  min={selectedCpl?.minimalScore ?? 0}
                  max={100}
                  value={newScore}
                  onChange={(e) => setNewScore(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Dokumen Rekomendasi (PDF)</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setRecFile(e.target.files?.[0] || null)}
              />
              <p className="text-[10px] text-muted-foreground italic">* Dokumen yang berisi detail perbaikan/quiz</p>
            </div>

            <div className="space-y-2">
              <Label>Dokumen Penyelesaian (PDF)</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setSetFile(e.target.files?.[0] || null)}
              />
              <p className="text-[10px] text-muted-foreground italic">* Jawaban atau bukti perbaikan dari mahasiswa</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepairModalOpen(false)}>Batal</Button>
            <Button
              onClick={() => {
                if (selectedCpl) {
                  repairMutation.mutate(
                    { 
                      cplId: selectedCpl.cplId, 
                      payload: {
                        newScore,
                        oldScore: selectedCpl.score ?? 0,
                        recommendation: recFile,
                        settlement: setFile
                      }
                    },
                    { onSuccess: () => setRepairModalOpen(false) },
                  );
                }
              }}
              disabled={repairMutation.isPending || !recFile || !setFile}
            >
              {repairMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Simpan Perbaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Perbaikan CPL</DialogTitle>
            <DialogDescription>{selectedCpl?.code} - {selectedCpl?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="text-center flex-1 border-r">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skor Lama</p>
                <p className="text-lg font-bold text-red-600">{selectedCpl?.oldScore ?? '-'}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skor Baru</p>
                <p className="text-lg font-bold text-emerald-600">{selectedCpl?.score ?? '-'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Dokumen Pendukung</p>
              {selectedCpl?.recommendationDocument && (
                <div className="flex items-center justify-between p-3 border rounded-lg group hover:border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Rekomendasi</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{selectedCpl.recommendationDocument.fileName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => openProtectedFile(selectedCpl.recommendationDocument!.filePath, selectedCpl.recommendationDocument!.fileName)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {selectedCpl?.settlementDocument && (
                <div className="flex items-center justify-between p-3 border rounded-lg group hover:border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">Penyelesaian</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{selectedCpl.settlementDocument.fileName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => openProtectedFile(selectedCpl.settlementDocument!.filePath, selectedCpl.settlementDocument!.fileName)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-[10px] text-muted-foreground">Tervalidasi oleh:</p>
              <p className="text-sm font-medium">{selectedCpl?.validatedBy ?? '-'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{selectedCpl?.validatedAt ? formatDateId(selectedCpl.validatedAt) : '-'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Verify Confirmation Dialog */}
      <AlertDialog open={!!verifyConfirmId} onOpenChange={(open) => !open && setVerifyConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Validasi Nilai CPL?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan memvalidasi nilai CPL mahasiswa ini. Pastikan nilai sudah sesuai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (verifyConfirmId) {
                  verifyMutation.mutate(verifyConfirmId, {
                    onSuccess: () => setVerifyConfirmId(null)
                  });
                }
              }}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Validasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
