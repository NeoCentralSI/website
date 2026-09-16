import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";
import type {
  CreateMetopenCpmkPayload,
  MetopenCpmk,
  UpdateMetopenCpmkPayload,
} from "@/services/rubricMetopen.service";
import { cn } from "@/lib/utils";

export const CPMK_CODE_PATTERN = /^CPMK[- ]?\d{1,2}$/i;

export function normalizeMetopenCpmkCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function isValidCpmkForm(code: string, description: string) {
  return CPMK_CODE_PATTERN.test(code.trim()) && description.trim().length >= 10;
}

interface MetopenCpmkCatalogProps {
  items: MetopenCpmk[];
  onCreate: (data: Omit<CreateMetopenCpmkPayload, "academicYearId">) => Promise<unknown>;
  onUpdate: (id: string, data: UpdateMetopenCpmkPayload) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function MetopenCpmkCatalog({
  items,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}: MetopenCpmkCatalogProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MetopenCpmk | null>(null);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.code.localeCompare(b.code)),
    [items],
  );
  const invalidCount = sorted.filter((item) => !CPMK_CODE_PATTERN.test(item.code)).length;
  const deleteTarget = sorted.find((item) => item.id === deleteId) ?? null;
  const formValid = isValidCpmkForm(code, description);
  const isEdit = Boolean(editItem);

  const openCreate = () => {
    setEditItem(null);
    setCode("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (item: MetopenCpmk) => {
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
      code: normalizeMetopenCpmkCode(code),
      description: description.trim(),
    };
    if (editItem) {
      await onUpdate(editItem.id, payload);
    } else {
      await onCreate(payload);
    }
    closeForm();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Daftar capaian pembelajaran</p>
            <p className="text-xs text-muted-foreground max-w-xl">
              Ini adalah master CPMK Metode Penelitian. Setelah ada di sini, CPMK dapat
              dimasukkan ke rubrik TA-03A atau TA-03B.
            </p>
          </div>
          <Button type="button" onClick={openCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Tambah CPMK
          </Button>
        </div>

        {invalidCount > 0 ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {invalidCount} entri memakai kode tidak resmi. Perbaiki atau hapus agar export
            nilai SIA tetap akurat.
          </div>
        ) : null}

        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed px-6 py-10 text-center">
            <p className="text-sm font-medium">Belum ada CPMK</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mulai dengan menambahkan CPMK-01, CPMK-02, dan CPMK-03 sesuai bobot penilaian.
            </p>
            <Button type="button" className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah CPMK pertama
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Deskripsi</th>
                  <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Pemakaian</th>
                  <th className="px-4 py-2.5 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((item) => {
                  const criteriaCount = item._count?.metopenAssessmentCriterias ?? 0;
                  const looksInvalid = !CPMK_CODE_PATTERN.test(item.code);
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{item.code}</span>
                          {looksInvalid ? (
                            <Badge variant="destructive" className="w-fit text-[10px]">
                              Perlu diperbaiki
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p className="line-clamp-2 max-w-md">{item.description}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {criteriaCount > 0
                          ? `${criteriaCount} kriteria terpasang`
                          : "Belum dipakai di rubrik"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(item)}
                            aria-label={`Ubah ${item.code}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(item.id)}
                            aria-label={`Hapus ${item.code}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Ubah CPMK" : "Tambah CPMK"}</DialogTitle>
            <DialogDescription>
              Gunakan kode resmi seperti CPMK-01. Deskripsi minimal 10 karakter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="catalog-cpmk-code">Kode</Label>
              <Input
                id="catalog-cpmk-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CPMK-01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catalog-cpmk-desc">Deskripsi</Label>
              <Input
                id="catalog-cpmk-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Presentasi proposal"
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
              ) : isEdit ? (
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
            <AlertDialogTitle>Hapus CPMK?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Menghapus <span className="font-medium text-foreground">{deleteTarget.code}</span>{" "}
                  dari katalog.
                  {deleteTarget._count?.metopenAssessmentCriterias
                    ? " Kriteria/rubrik terkait yang belum dipakai penilaian juga akan dihapus."
                    : ""}{" "}
                  Penghapusan ditolak jika CPMK sudah dipakai nilai mahasiswa.
                </>
              ) : (
                "CPMK akan dihapus dari katalog."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              onClick={async () => {
                if (!deleteId) return;
                await onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
