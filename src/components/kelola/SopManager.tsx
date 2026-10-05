import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Eye, Edit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as sopService from "@/services/sop.service";
import type { SopFile, SopType } from "@/types/sop.types";
import DocumentPreviewDialog from "@/components/thesis/DocumentPreviewDialog";
import { CustomTable, type Column } from "@/components/layout/CustomTable";
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type Category = 'SOP' | 'TEMPLATE';
type Subject = 'TA' | 'KP' | 'UMUM';

const CATEGORY_OPTIONS: { label: string; value: Category }[] = [
  { label: "Panduan (SOP)", value: "SOP" },
  { label: "Template Dokumen", value: "TEMPLATE" },
];

const SUBJECT_OPTIONS: { label: string; value: Subject }[] = [
  { label: "Tugas Akhir", value: "TA" },
  { label: "Kerja Praktik", value: "KP" },
  { label: "Umum", value: "UMUM" },
];

export function SopManager() {
  const qc = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ name?: string; path?: string }>({});

  // Table state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state for adding/editing
  const [selectedCategory, setSelectedCategory] = useState<Category>("SOP");
  const [selectedSubject, setSelectedSubject] = useState<Subject>("TA");
  const [docTitle, setDocTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editingSop, setEditingSop] = useState<SopFile | null>(null);

  const { data: allData = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["sop-files"],
    queryFn: () => sopService.getSopFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: (payload: { type: SopType; file: File; title?: string }) => sopService.uploadSop(payload),
    onSuccess: () => {
      toast.success("Dokumen berhasil ditambahkan");
      qc.invalidateQueries({ queryKey: ["sop-files"] });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan dokumen");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; type: SopType; title?: string; file?: File | null }) => sopService.updateSop(payload.id, { type: payload.type, title: payload.title, file: payload.file }),
    onSuccess: () => {
      toast.success("Dokumen berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["sop-files"] });
      setEditDialogOpen(false);
      setEditingSop(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui dokumen");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sopService.deleteSop(id),
    onSuccess: () => {
      toast.success("Dokumen berhasil dihapus");
      qc.invalidateQueries({ queryKey: ["sop-files"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus dokumen");
    },
  });

  const resetForm = () => {
    setFile(null);
    setDocTitle("");
    setSelectedCategory("SOP");
    setSelectedSubject("TA");
  };

  const handleEditClick = (row: SopFile) => {
    setEditingSop(row);
    setDocTitle(row.fileName);

    // Parse category and subject from type string (e.g. SOP_TA)
    const parts = row.type.split('_');
    if (parts.length >= 2) {
      setSelectedCategory(parts[0] as Category);
      setSelectedSubject(parts[1] as Subject);
    }
    setEditDialogOpen(true);
  };

  const filteredData = useMemo(() => {
    let result = allData;
    if (q) {
      const lowerQ = q.toLowerCase();
      result = result.filter(item =>
        item.fileName.toLowerCase().includes(lowerQ) ||
        item.typeName.toLowerCase().includes(lowerQ)
      );
    }
    return result;
  }, [allData, q]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns: Column<SopFile>[] = useMemo(
    () => [
      {
        header: "Nama Dokumen",
        key: "fileName",
        render: (row) => (
          <span className="font-medium">{row.fileName}</span>
        )
      },
      {
        header: "Kategori",
        key: "typeName",
        className: "text-center",
        render: (row) => {
          const isTemplate = row.type.startsWith('TEMPLATE');
          return (
            <div className="flex justify-center">
              <Badge variant="outline">
                {isTemplate ? 'Template' : 'SOP'}
              </Badge>
            </div>
          );
        }
      },
      {
        header: "Subjek",
        key: "subject",
        className: "text-center",
        render: (row) => {
          const parts = row.type.split('_');
          const subject = parts[parts.length - 1];
          return (
            <div className="flex justify-center">
              <Badge variant="outline">
                {SUBJECT_OPTIONS.find((option) => option.value === subject)?.label ?? subject}
              </Badge>
            </div>
          );
        }
      },
      {
        header: "File",
        key: "file",
        className: "text-center",
        render: (row) => {
          const url = row.url;
          const isDocx = url.toLowerCase().endsWith(".docx") || url.toLowerCase().endsWith(".doc");

          return (
            <div className="flex justify-center">
              {isDocx ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={sopService.getSopDownloadUrl(url)} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    <span>Unduh</span>
                  </a>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setPreviewData({ name: row.fileName, path: row.url });
                    setPreviewOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span>Lihat</span>
                </Button>
              )}
            </div>
          );
        }
      },
      {
        header: "Aksi",
        key: "actions",
        className: "text-center",
        render: (row) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Dokumen"
              aria-label={`Edit dokumen ${row.fileName}`}
              onClick={() => handleEditClick(row)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Hapus Dokumen"
                  aria-label={`Hapus dokumen ${row.fileName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dokumen "{row.fileName}" akan dihapus secara permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteMutation.mutate(row.id)}
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    ],
    [deleteMutation]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih file panduan (PDF)");
      return;
    }

    // Construct SopType: CATEGORY_SUBJECT
    const type = `${selectedCategory}_${selectedSubject}` as SopType;
    uploadMutation.mutate({ type, file, title: docTitle });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSop) return;

    const type = `${selectedCategory}_${selectedSubject}` as SopType;
    updateMutation.mutate({ id: editingSop.id, type, title: docTitle, file });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Panduan & Template</h1>
        <p className="text-muted-foreground">Kelola panduan dan template dokumen akademik</p>
      </div>

      <CustomTable
        columns={columns}
        data={paginatedData}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        enableColumnFilters
        searchValue={q}
        onSearchChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        emptyText={q ? 'Pencarian tidak menemukan hasil. Coba kata kunci lain.' : 'Belum ada data dokumen.'}
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={() => refetch()}
              isRefreshing={isFetching && !isLoading}
            />
            {/* <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 text-muted-foreground" title="Panduan Placeholder">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm leading-none">Panduan Template Logbook</h4>
                  <p className="text-xs text-muted-foreground">
                    Gunakan tag berikut (dengan satu kurung kurawal `{ }`) di file DOCX Anda agar data terisi otomatis:
                  </p>
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <span className="font-bold">Instansi:</span> <span>{'{instansi}'}</span>
                    <span className="font-bold">Nama:</span> <span>{'{nama}'}</span>
                    <span className="font-bold">NIM:</span> <span>{'{nim}'}</span>
                    <span className="font-bold">Tgl Cetak:</span> <span>{'{tanggal_cetak}'}</span>
                    <span className="font-bold">Pembimbing:</span> <span>{'{pembimbing}'}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Tabel (Looping):</p>
                    <code className="text-[10px] bg-muted p-1 block rounded">
                      #a ... {'{no}'} | {'{kegiatan}'} | {'{tanggal}'} ... /a
                    </code>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      *Buka baris dengan {'{#a}'} dan tutup baris terakhir dengan {'{/a}'}.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover> */}
            <Dialog open={addDialogOpen} onOpenChange={(open) => {
              setAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Dokumen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Tambah Dokumen Baru</DialogTitle>
                    <DialogDescription>
                      Isi detail dokumen dan unggah file PDF.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title" className="text-xs font-bold uppercase text-muted-foreground">Judul Dokumen (Opsional)</Label>
                      <Input
                        id="title"
                        placeholder="Contoh: Template Cover TA"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category" className="text-xs font-bold uppercase text-muted-foreground">Kategori</Label>
                        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)}>
                          <SelectTrigger id="category" className="h-9">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="subject" className="text-xs font-bold uppercase text-muted-foreground">Subjek</Label>
                        <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as Subject)}>
                          <SelectTrigger id="subject" className="h-9">
                            <SelectValue placeholder="Pilih subjek" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Label htmlFor="file" className="text-xs font-bold uppercase text-muted-foreground">
                      File Dokumen (PDF/DOCX)
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      required
                      className="h-9 text-xs file:text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-full file:px-3 file:mr-2 cursor-pointer pt-1.5"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        const allowedTypes = [
                          "application/pdf",
                          "application/msword",
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        ];

                        if (f && !allowedTypes.includes(f.type) && !f.name.endsWith('.docx') && !f.name.endsWith('.doc')) {
                          toast.error("File harus PDF, DOC, atau DOCX");
                          e.target.value = "";
                          setFile(null);
                        } else {
                          setFile(f || null);
                        }
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={uploadMutation.isPending || !file} size="sm">
                      {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {uploadMutation.isPending ? 'Mengunggah...' : 'Simpan Dokumen'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingSop(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Detail Dokumen</DialogTitle>
              <DialogDescription>
                Ubah judul, kategori, atau subjek dokumen.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title" className="text-xs font-bold uppercase text-muted-foreground">Judul Dokumen</Label>
                <Input
                  id="edit-title"
                  placeholder="Contoh: Template Cover TA"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category" className="text-xs font-bold uppercase text-muted-foreground">Kategori</Label>
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)}>
                    <SelectTrigger id="edit-category" className="h-9">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-subject" className="text-xs font-bold uppercase text-muted-foreground">Subjek</Label>
                  <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as Subject)}>
                    <SelectTrigger id="edit-subject" className="h-9">
                      <SelectValue placeholder="Pilih subjek" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-file" className="text-xs font-bold uppercase text-muted-foreground">
                  Ganti File (Opsional)
                </Label>
                <Input
                  id="edit-file"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="h-9 text-xs file:text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded-full file:px-3 file:mr-2 cursor-pointer pt-1.5"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    const allowedTypes = [
                      "application/pdf",
                      "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ];

                    if (f && !allowedTypes.includes(f.type) && !f.name.endsWith('.docx') && !f.name.endsWith('.doc')) {
                      toast.error("File harus PDF, DOC, atau DOCX");
                      e.target.value = "";
                      setFile(null);
                    } else {
                      setFile(f || null);
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground">Biarkan kosong jika tidak ingin mengganti file.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={updateMutation.isPending} size="sm">
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fileName={previewData.name}
        filePath={previewData.path}
        mode="fullscreen"
      />
    </div>
  );
}
