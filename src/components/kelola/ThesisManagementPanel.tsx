import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import { CustomTable, type Column } from "@/components/layout/CustomTable";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [thesisToDelete, setThesisToDelete] = useState<ThesisItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // Query thesis list
  const thesisQuery = useQuery({
    queryKey: ["admin-thesis-list", page, pageSize, search],
    queryFn: () => getThesisList({ page, pageSize, search }),
  });

  const { refetch, isFetching } = thesisQuery;

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

  // Define columns for CustomTable
  const columns: Column<ThesisItem>[] = useMemo(() => [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      width: 200,
      render: (thesis) => (
        <div>
          <p className="font-medium">{toTitleCaseName(thesis.student.fullName)}</p>
          <p className="text-sm text-muted-foreground">{thesis.student.nim}</p>
        </div>
      ),
    },
    {
      key: 'judul',
      header: 'Judul',
      render: (thesis) => (
        <div>
          <p className="line-clamp-2">
            {thesis.title || <span className="text-muted-foreground italic">Belum ada judul</span>}
          </p>
          {thesis.topic && (
            <Badge variant="outline" className="mt-1">{thesis.topic}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (thesis) => (
        <Badge variant="secondary">{thesis.status || "Baru"}</Badge>
      ),
    },
    {
      key: 'pembimbing',
      header: 'Pembimbing',
      width: 200,
      render: (thesis) => (
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
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      width: 80,
      className: 'text-center',
      render: (thesis) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => openDeleteDialog(thesis)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ], []);

  return (
    <div className="space-y-4">
      <CustomTable
        columns={columns}
        data={thesisList}
        loading={thesisQuery.isLoading}
        isRefreshing={isFetching && !thesisQuery.isLoading}
        total={thesisQuery.data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        emptyText="Tidak ada data tugas akhir ditemukan"
        rowKey={(row) => row.id}
        actions={
          <RefreshButton 
            onClick={() => refetch()} 
            isRefreshing={isFetching && !thesisQuery.isLoading} 
          />
        }
      />

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
                    className="min-h-20"
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
    </div>
  );
}
