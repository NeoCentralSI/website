import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, BookOpen, FileText } from "lucide-react";
import * as topicService from "@/services/topic.service";
import EmptyState from "@/components/ui/empty-state";
import type { Topic, CreateTopicDto, UpdateTopicDto } from "@/types/topic.types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner, Loading } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateId } from "@/lib/text";

type TopicFormState = {
  id?: string;
  name: string;
};

const emptyForm: TopicFormState = {
  name: "",
};

export function TopicManagementPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TopicFormState>(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  // Queries
  const topicsQuery = useQuery({
    queryKey: ["topics"],
    queryFn: topicService.getTopics,
  });

  // Mutations
  const createTopic = useMutation({
    mutationFn: (data: CreateTopicDto) => topicService.createTopic(data),
    onSuccess: () => {
      toast.success("Topik berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setDialogOpen(false);
      setFormState(emptyForm);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat topik");
    },
  });

  const updateTopic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTopicDto }) =>
      topicService.updateTopic(id, data),
    onSuccess: () => {
      toast.success("Topik berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setDialogOpen(false);
      setFormState(emptyForm);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui topik");
    },
  });

  const deleteTopic = useMutation({
    mutationFn: (id: string) => topicService.deleteTopic(id),
    onSuccess: () => {
      toast.success("Topik berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setDeleteDialogOpen(false);
      setTopicToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus topik");
    },
  });

  const bulkDeleteTopics = useMutation({
    mutationFn: (ids: string[]) => topicService.bulkDeleteTopics(ids),
    onSuccess: (result) => {
      if (result.failed > 0) {
        toast.warning(
          `${result.deleted} topik berhasil dihapus. ${result.failed} topik gagal dihapus karena masih digunakan.`
        );
      } else {
        toast.success(`${result.deleted} topik berhasil dihapus`);
      }
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus topik");
    },
  });

  const topics = topicsQuery.data || [];

  const filteredTopics = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return topics;
    return topics.filter((t) => t.name.toLowerCase().includes(term));
  }, [search, topics]);

  const isBusy =
    topicsQuery.isLoading ||
    createTopic.isPending ||
    updateTopic.isPending ||
    deleteTopic.isPending ||
    bulkDeleteTopics.isPending;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTopics.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTopics.map((t) => t.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteTopics.mutate(Array.from(selectedIds));
  };

  const handleDeleteConfirm = () => {
    if (!topicToDelete) return;
    deleteTopic.mutate(topicToDelete.id);
  };

  const startCreate = () => {
    setFormState(emptyForm);
    setDialogOpen(true);
  };

  const startEdit = (topic: Topic) => {
    setFormState({
      id: topic.id,
      name: topic.name,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formState.name.trim()) {
      toast.error("Nama topik wajib diisi");
      return;
    }

    const payload = {
      name: formState.name.trim(),
    };

    if (formState.id) {
      updateTopic.mutate({ id: formState.id, data: payload });
    } else {
      createTopic.mutate(payload);
    }
  };

  const handleDelete = (topic: Topic) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  // Loading state
  if (topicsQuery.isLoading && topics.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" text="Memuat data topik..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kelola Topik Tugas Akhir</CardTitle>
            <CardDescription>
              Buat, perbarui, atau hapus topik tugas akhir. Topik digunakan untuk mengelompokkan template milestone.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={isBusy}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus ({selectedIds.size})
              </Button>
            )}
            <Button onClick={startCreate} disabled={isBusy}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Topik
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {topics.length} topik tersedia
            </div>
            <div className="w-full md:w-64">
              <Input
                id="search"
                placeholder="Cari topik..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {filteredTopics.length === 0 ? (
            <EmptyState
              title={search.trim() ? "Tidak Ditemukan" : "Belum Ada Topik"}
              description={search.trim()
                ? "Tidak ada topik yang cocok dengan pencarian."
                : "Klik 'Tambah Topik' untuk membuat topik baru."}
              size="sm"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedIds.size === filteredTopics.length &&
                          filteredTopics.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Nama Topik</TableHead>
                    <TableHead className="text-center">Tugas Akhir</TableHead>
                    <TableHead className="text-center">Template</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(topic.id)}
                          onCheckedChange={() => toggleSelect(topic.id)}
                          aria-label={`Select ${topic.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{topic.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          {topic.thesisCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {topic.templateCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateId(topic.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(topic)}
                            disabled={isBusy}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(topic)}
                            disabled={
                              isBusy ||
                              topic.thesisCount > 0 ||
                              topic.templateCount > 0
                            }
                            title={
                              topic.thesisCount > 0 || topic.templateCount > 0
                                ? "Topik tidak dapat dihapus karena masih digunakan"
                                : "Hapus topik"
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formState.id ? "Edit Topik" : "Tambah Topik Baru"}
            </DialogTitle>
            <DialogDescription>
              {formState.id
                ? "Perbarui nama topik tugas akhir."
                : "Buat topik baru untuk mengelompokkan template milestone."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Topik</Label>
              <Input
                id="name"
                placeholder="Contoh: Machine Learning"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={createTopic.isPending || updateTopic.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createTopic.isPending || updateTopic.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formState.name.trim() ||
                createTopic.isPending ||
                updateTopic.isPending
              }
            >
              {(createTopic.isPending || updateTopic.isPending) && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              {formState.id ? "Simpan Perubahan" : "Tambah Topik"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Topik?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus topik "{topicToDelete?.name}"? Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTopic.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteTopic.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTopic.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Topik?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus {selectedIds.size} topik yang dipilih?
              Topik yang masih digunakan oleh tugas akhir atau template tidak
              akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteTopics.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteTopics.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteTopics.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
