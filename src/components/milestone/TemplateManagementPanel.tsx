import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash, MoveVertical, GripVertical, Trash2 } from "lucide-react";
import {
  useTemplates,
  useTopics,
  useTemplateTopics,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useBulkDeleteTemplates,
} from "@/hooks/milestone/useMilestone";
import type { MilestoneTemplate } from "@/types/milestone.types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type TemplateFormState = {
  id?: string;
  name: string;
  description: string;
  topicId: string;
  orderIndex?: number;
  isActive: boolean;
};

const emptyForm: TemplateFormState = {
  name: "",
  description: "",
  topicId: "",
  orderIndex: undefined,
  isActive: true,
};

export function TemplateManagementPanel() {
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TemplateFormState>(emptyForm);
  const [orderedTemplates, setOrderedTemplates] = useState<MilestoneTemplate[]>([]);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasReordered, setHasReordered] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<MilestoneTemplate | null>(null);

  const templatesQuery = useTemplates(topicFilter || undefined);
  const topicsQuery = useTopics();
  const templateTopicsQuery = useTemplateTopics();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const bulkDeleteTemplates = useBulkDeleteTemplates();

  const templates = templatesQuery.data || [];
  const topics = topicsQuery.data || [];
  const templateTopics = templateTopicsQuery.data || [];

  useEffect(() => {
    const sorted = [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    setOrderedTemplates(sorted);
    if (!reorderEnabled) {
      setDraggingId(null);
      setHasReordered(false);
    }
  }, [templates, reorderEnabled]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source = orderedTemplates;
    if (!term) return source;
    return source.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.description ?? "").toLowerCase().includes(term) ||
        (t.topic?.name ?? "").toLowerCase().includes(term)
    );
  }, [search, orderedTemplates]);

  const isBusy =
    templatesQuery.isLoading ||
    topicsQuery.isLoading ||
    templateTopicsQuery.isLoading ||
    createTemplate.isPending ||
    updateTemplate.isPending ||
    deleteTemplate.isPending ||
    bulkDeleteTemplates.isPending;

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
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map((t) => t.id)));
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteTemplates.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteDialogOpen(false);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    deleteTemplate.mutate(templateToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
      },
    });
  };

  const startCreate = () => {
    setFormState({
      ...emptyForm,
      orderIndex: orderedTemplates.length,
    });
    setDialogOpen(true);
  };

  const startEdit = (template: MilestoneTemplate) => {
    setFormState({
      id: template.id,
      name: template.name,
      description: template.description || "",
      topicId: template.topicId || "",
      orderIndex: template.orderIndex,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      topicId: formState.topicId || null,
      orderIndex:
        formState.orderIndex === undefined || formState.orderIndex === null
          ? undefined
          : Number(formState.orderIndex),
      isActive: formState.isActive,
    };

    if (formState.id) {
      updateTemplate.mutate(
        { templateId: formState.id, data: payload },
        {
          onSuccess: () => setDialogOpen(false),
        }
      );
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (template: MilestoneTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDragStart = (id: string) => {
    if (!reorderEnabled) return;
    setDraggingId(id);
  };

  const handleDragOver = (event: React.DragEvent, targetId: string) => {
    if (!reorderEnabled) return;
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setOrderedTemplates((prev) => {
      const currentIndex = prev.findIndex((t) => t.id === draggingId);
      const targetIndex = prev.findIndex((t) => t.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setHasReordered(true);
  };

  const handleSaveOrder = async () => {
    if (!hasReordered) return;
    setIsSavingOrder(true);
    try {
      await Promise.all(
        orderedTemplates.map((t, idx) => {
          if (t.orderIndex === idx) return Promise.resolve();
          return updateTemplate.mutateAsync({ templateId: t.id, data: { orderIndex: idx } });
        })
      );
      setHasReordered(false);
      setReorderEnabled(false);
    } catch (err) {
      toast.error((err as Error).message || "Gagal menyimpan urutan");
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kelola Template Milestone</CardTitle>
            <CardDescription>
              Buat, perbarui, atau hapus template milestone untuk tugas akhir.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && !reorderEnabled && (
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
            {reorderEnabled && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveOrder}
                disabled={!hasReordered || isSavingOrder}
              >
                {isSavingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Urutan
              </Button>
            )}
            <Button
              variant={reorderEnabled ? "outline" : "default"}
              size="sm"
              onClick={() => setReorderEnabled((prev) => !prev)}
              disabled={isBusy || isSavingOrder}
            >
              <MoveVertical className="mr-2 h-4 w-4" />
              {reorderEnabled ? "Selesai Atur Urutan" : "Atur Urutan"}
            </Button>
            <Button onClick={startCreate} disabled={isBusy || reorderEnabled}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={!topicFilter ? "secondary" : "outline"}
                onClick={() => setTopicFilter(null)}
                disabled={isBusy}
              >
                Semua Topik
              </Button>
              {templateTopics.map((topic) => (
                <Button
                  key={topic.id}
                  size="sm"
                  variant={topicFilter === topic.id ? "secondary" : "outline"}
                  onClick={() => setTopicFilter(topic.id)}
                  disabled={isBusy}
                >
                  {topic.name} <Badge className="ml-2">{topic.count}</Badge>
                </Button>
              ))}
            </div>
            <div className="w-full md:w-64">
              <Label htmlFor="search">Cari template</Label>
              <Input
                id="search"
                placeholder="Cari nama/topik"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {reorderEnabled && (
            <p className="text-xs text-muted-foreground">
              Drag & drop kartu untuk mengubah urutan. Klik “Simpan Urutan” untuk menyimpan perubahan.
            </p>
          )}

          {!reorderEnabled && filteredTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                Pilih semua ({filteredTemplates.length} template)
              </Label>
            </div>
          )}

          {templatesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat template...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Tidak ada template. Tambahkan template baru untuk memulai.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  draggable={reorderEnabled}
                  onDragStart={() => handleDragStart(template.id)}
                  onDragOver={(e) => handleDragOver(e, template.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggingId(null);
                  }}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-start md:justify-between",
                    reorderEnabled && "cursor-grab",
                    draggingId === template.id && "opacity-75",
                    selectedIds.has(template.id) && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!reorderEnabled && (
                      <Checkbox
                        checked={selectedIds.has(template.id)}
                        onCheckedChange={() => toggleSelect(template.id)}
                        className="mt-1"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {reorderEnabled && (
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        )}
                        <p className="font-semibold text-sm md:text-base">{template.name}</p>
                        {template.topic && (
                          <Badge variant="outline" className="text-xs">
                            {template.topic.name}
                          </Badge>
                        )}
                        <Badge
                          variant={template.isActive ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            !template.isActive && "bg-gray-200 text-gray-700"
                          )}
                        >
                          {template.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      {template.description ? (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Urutan: #{template.orderIndex + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(template)}
                      disabled={isBusy || reorderEnabled}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      disabled={isBusy || reorderEnabled}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formState.id ? "Edit Template Milestone" : "Tambah Template Milestone"}
            </DialogTitle>
            <DialogDescription>
              Template akan digunakan mahasiswa untuk membuat milestone awal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                placeholder="Contoh: Bab I - Pendahuluan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topicId">Topik</Label>
              <Select
                value={formState.topicId ?? "none"}
                onValueChange={(val) =>
                  setFormState((s) => ({ ...s, topicId: val === "none" ? null : val }))
                }
              >
                <SelectTrigger id="topicId">
                  <SelectValue placeholder="Pilih topik (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada topik</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pilih topik tugas akhir untuk template ini (opsional).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                placeholder="Penjelasan singkat milestone"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Urutan</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  min={0}
                  value={formState.orderIndex ?? ""}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      orderIndex: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Jika kosong, urutan otomatis ditempatkan di akhir.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                  <Switch
                    id="isActive"
                    checked={formState.isActive}
                    onCheckedChange={(checked) =>
                      setFormState((s) => ({ ...s, isActive: Boolean(checked) }))
                    }
                  />
                  <span className="text-sm">{formState.isActive ? "Aktif" : "Nonaktif"}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isBusy}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isBusy || !formState.name.trim()}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua template yang dipilih akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteTemplates.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteTemplates.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteTemplates.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus template "{templateToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTemplate.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteTemplate.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
