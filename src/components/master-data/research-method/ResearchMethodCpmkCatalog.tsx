import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import CustomTable, { type Column } from "@/components/layout/CustomTable";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Spinner } from "@/components/ui/spinner";
import type {
  CreateResearchMethodCpmkPayload,
  ResearchMethodCpmk,
  UpdateResearchMethodCpmkPayload,
} from "@/services/researchMethodAssessment.service";

export const CPMK_CODE_PATTERN = /^CPMK[- ]?\d{1,2}$/i;

export function normalizeResearchMethodCpmkCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function isValidCpmkForm(code: string, description: string) {
  return CPMK_CODE_PATTERN.test(code.trim()) && description.trim().length >= 10;
}

interface ResearchMethodCpmkCatalogProps {
  items: ResearchMethodCpmk[];
  isLoading: boolean;
  isFetching: boolean;
  onCreate: (data: Omit<CreateResearchMethodCpmkPayload, "academicYearId">) => Promise<unknown>;
  onUpdate: (id: string, data: UpdateResearchMethodCpmkPayload) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onRefresh: () => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function ResearchMethodCpmkCatalog({
  items,
  isLoading,
  isFetching,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  isCreating,
  isUpdating,
  isDeleting,
}: ResearchMethodCpmkCatalogProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ResearchMethodCpmk | null>(null);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.code.localeCompare(b.code)),
    [items],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  }, [search, sorted]);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const deleteTarget = sorted.find((item) => item.id === deleteId) ?? null;
  const formValid = isValidCpmkForm(code, description);

  const openCreate = () => {
    setEditItem(null);
    setCode("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (item: ResearchMethodCpmk) => {
    setEditItem(item);
    setCode(item.code);
    setDescription(item.description);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
    setCode("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!formValid) return;
    const payload = {
      code: normalizeResearchMethodCpmkCode(code),
      description: description.trim(),
    };
    try {
      if (editItem) await onUpdate(editItem.id, payload);
      else await onCreate(payload);
      closeForm();
    } catch {
      // Mutation hook menampilkan pesan kegagalan.
    }
  };

  const columns = useMemo<Column<ResearchMethodCpmk>[]>(
    () => [
      {
        key: "no",
        header: "No",
        width: 50,
        className: "text-center",
        render: (_item, index) => (
          <span className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode CPMK",
        width: 140,
        render: (item) => (
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium">{item.code}</span>
            {!CPMK_CODE_PATTERN.test(item.code) ? (
              <Badge variant="destructive" className="text-[10px]">
                Perlu diperbaiki
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: "description",
        header: "Deskripsi",
        className: "max-w-md whitespace-normal",
        render: (item) => <span className="text-sm">{item.description}</span>,
      },
      {
        key: "usage",
        header: "Kriteria",
        width: 130,
        render: (item) => (
          <span className="text-sm text-muted-foreground">
            {item.criteriaCount ?? 0} kriteria
          </span>
        ),
      },
      {
        key: "actions",
        header: "Aksi",
        width: 90,
        className: "text-right",
        render: (item) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => openEdit(item)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setDeleteId(item.id)}
              disabled={isDeleting}
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [isDeleting, page, pageSize],
  );

  return (
    <>
      <CustomTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        emptyText="Belum ada data CPMK Metode Penelitian"
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
            <RefreshButton
              onClick={onRefresh}
              isRefreshing={isFetching && !isLoading}
            />
          </div>
        }
      />

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Ubah CPMK" : "Tambah CPMK"}</DialogTitle>
            <DialogDescription>
              Gunakan kode resmi seperti CPMK-01. Deskripsi minimal 10 karakter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="research-method-cpmk-code">Kode</Label>
              <Input
                id="research-method-cpmk-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="CPMK-01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="research-method-cpmk-description">Deskripsi</Label>
              <Input
                id="research-method-cpmk-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contoh: Mampu menyusun proposal penelitian"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!formValid || isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : editItem ? (
                "Simpan"
              ) : (
                "Tambah"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data CPMK</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Menghapus <span className="font-medium text-foreground">{deleteTarget.code}</span>{" "}
                  akan menghapus seluruh konfigurasi kriteria dan rubrik terkait. Lanjutkan?
                </>
              ) : (
                "CPMK akan dihapus. Lanjutkan?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await onDelete(deleteId);
                  setDeleteId(null);
                } catch {
                  // Mutation hook menampilkan pesan kegagalan.
                }
              }}
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
