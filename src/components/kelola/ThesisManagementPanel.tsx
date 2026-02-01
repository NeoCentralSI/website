import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Search, AlertTriangle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Spinner, Loading } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toTitleCaseName, formatRoleName } from "@/lib/text";
import { getApiUrl } from "@/config/api";
import { apiRequest } from "@/services/auth.service";

// Types
interface ThesisSupervisor {
  name: string;
  role: string;
}

interface ThesisStudent {
  id: string;
  fullName: string;
  nim: string;
  email: string;
}

interface ThesisItem {
  id: string;
  title: string | null;
  status: string | null;
  topic: string | null;
  student: ThesisStudent;
  supervisors: ThesisSupervisor[];
  createdAt: string;
  updatedAt: string;
}

interface ThesisListResponse {
  thesis: ThesisItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API functions
async function getThesisList(params: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<ThesisListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.pageSize) query.set("pageSize", params.pageSize.toString());
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);

  const response = await apiRequest(getApiUrl(`/adminfeatures/thesis?${query.toString()}`));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil data thesis");
  }
  const result = await response.json();
  return result;
}

async function deleteThesis(id: string, reason: string): Promise<void> {
  const response = await apiRequest(getApiUrl(`/adminfeatures/thesis/${id}`), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus thesis");
  }
}

export function ThesisManagementPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [thesisToDelete, setThesisToDelete] = useState<ThesisItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // Query thesis list
  const thesisQuery = useQuery({
    queryKey: ["admin-thesis-list", page, search],
    queryFn: () => getThesisList({ page, pageSize: 10, search }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteThesis(id, reason),
    onSuccess: () => {
      toast.success("Tugas akhir berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin-thesis-list"] });
      setDeleteDialogOpen(false);
      setThesisToDelete(null);
      setDeleteReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus tugas akhir");
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const openDeleteDialog = (thesis: ThesisItem) => {
    setThesisToDelete(thesis);
    setDeleteReason("");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!thesisToDelete) return;
    if (!deleteReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    deleteMutation.mutate({ id: thesisToDelete.id, reason: deleteReason });
  };

  const thesisList = thesisQuery.data?.thesis || [];
  const totalPages = thesisQuery.data?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Kelola Data Tugas Akhir
        </CardTitle>
        <CardDescription>
          Kelola data tugas akhir mahasiswa. Hapus data TA untuk kasus pergantian topik/pembimbing.
          <br />
          <span className="text-destructive font-medium">
            ⚠️ Penghapusan bersifat permanen dan tidak dapat dibatalkan.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama mahasiswa, NIM, atau judul..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>Cari</Button>
        </div>

        {/* Table */}
        {thesisQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loading text="Memuat data..." />
          </div>
        ) : thesisList.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
            <GraduationCap className="h-10 w-10 mb-2 opacity-50" />
            <p>Tidak ada data tugas akhir ditemukan</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Mahasiswa</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[200px]">Pembimbing</TableHead>
                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thesisList.map((thesis) => (
                    <TableRow key={thesis.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{toTitleCaseName(thesis.student.fullName)}</p>
                          <p className="text-sm text-muted-foreground">{thesis.student.nim}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="line-clamp-2">{thesis.title || <span className="text-muted-foreground italic">Belum ada judul</span>}</p>
                          {thesis.topic && (
                            <Badge variant="outline" className="mt-1">{thesis.topic}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{thesis.status || "Baru"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {thesis.supervisors.length > 0 ? (
                            thesis.supervisors.map((sup, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{toTitleCaseName(sup.name)}</span>
                                <span className="text-muted-foreground text-xs ml-1">({formatRoleName(sup.role)})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Belum ada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(thesis)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {thesisList.length} dari {thesisQuery.data?.total || 0} data
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Data Tugas Akhir
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan menghapus <strong>SEMUA DATA</strong> tugas akhir berikut secara permanen:
                </p>
                {thesisToDelete && (
                  <div className="rounded-md border p-3 bg-muted/50">
                    <p><strong>Mahasiswa:</strong> {toTitleCaseName(thesisToDelete.student.fullName)} ({thesisToDelete.student.nim})</p>
                    <p><strong>Judul:</strong> {thesisToDelete.title || "-"}</p>
                    <p><strong>Topik:</strong> {thesisToDelete.topic || "-"}</p>
                    <p><strong>Status:</strong> {thesisToDelete.status || "Baru"}</p>
                  </div>
                )}
                <p className="text-destructive font-medium">
                  Data yang akan dihapus meliputi: milestone, bimbingan, dokumen, jadwal seminar & sidang.
                </p>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="delete-reason">Alasan Pembatalan <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="delete-reason"
                    placeholder="Contoh: Pergantian topik dan pembimbing atas persetujuan Kadep"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending || !deleteReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
