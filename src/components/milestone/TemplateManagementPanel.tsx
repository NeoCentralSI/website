import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash, MoveVertical, GripVertical, Trash2, AlertCircle, RotateCw, Check, ChevronsUpDown } from "lucide-react";
import {
  useTemplates,
  useTopics,
  useTemplateTopics,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useBulkDeleteTemplates,
} from "@/hooks/milestone/useMilestone";
import {
  useProposalMilestoneTemplateMutations,
  useProposalMilestoneTemplates,
} from "@/hooks/research-method/useMilestoneTemplates";
import type { CreateTemplateDto, MilestoneTemplate, TemplateTopic, ThesisTopic, UpdateTemplateDto } from "@/types/milestone.types";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import EmptyState from "@/components/ui/empty-state";

type TemplateFormState = {
  id?: string;
  name: string;
  description: string;
  topicId: string | null;
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

/** A template as the panel shows it; proposal templates also carry their usage count. */
type PanelTemplate = MilestoneTemplate & { usedCount?: number };

type QueryLike<T> = {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
};

type Done = { onSuccess?: () => void };

/**
 * Where the panel reads and writes its templates (Paket P8, 3.1): the thesis templates per topic,
 * or the general proposal templates (no topic picker). The view is the same for both.
 */
interface TemplateSource {
  phase: "thesis" | "proposal";
  templatesQuery: QueryLike<PanelTemplate[]>;
  /** Thesis phase only: the topic picker and the topic of a template. */
  topics?: {
    topicsQuery: QueryLike<ThesisTopic[]>;
    templateTopicsQuery: QueryLike<TemplateTopic[]>;
    topicFilter: string | null;
    setTopicFilter: (id: string | null) => void;
  };
  create: (payload: CreateTemplateDto, done: Done) => void;
  update: (templateId: string, data: UpdateTemplateDto, done: Done) => void;
  remove: (templateId: string, done: Done) => void;
  bulkRemove: (templateIds: string[], done: Done) => void;
  /** Saves the order shown, first to last. */
  saveOrder: (ordered: PanelTemplate[]) => Promise<void>;
  isPending: { create: boolean; update: boolean; remove: boolean; bulkRemove: boolean };
  /** The shortest name the server accepts. */
  minNameLength: number;
}

/**
 * Kelola template milestone. `phase="thesis"` (default): Kelola Tugas Akhir > Milestone, template
 * per topik. `phase="proposal"` (K18; Paket P8, 3.1): Kelola > Metode Penelitian > Template
 * Milestone, template fase proposal yang berlaku umum, tanpa pemilih topik.
 */
export function TemplateManagementPanel({ phase = "thesis" }: { phase?: "thesis" | "proposal" }) {
  return phase === "proposal" ? <ProposalTemplateManagementPanel /> : <ThesisTemplateManagementPanel />;
}

function ThesisTemplateManagementPanel() {
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  // Management view: include deactivated templates so they can be re-activated.
  // The list and the per-topic count use the same filter (phase "thesis" on the backend).
  const templatesQuery = useTemplates(topicFilter || undefined, { includeInactive: true });
  const topicsQuery = useTopics();
  const templateTopicsQuery = useTemplateTopics({ includeInactive: true });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const bulkDeleteTemplates = useBulkDeleteTemplates();

  const source: TemplateSource = {
    phase: "thesis",
    templatesQuery,
    topics: { topicsQuery, templateTopicsQuery, topicFilter, setTopicFilter },
    create: (payload, done) => createTemplate.mutate(payload, done),
    update: (templateId, data, done) => updateTemplate.mutate({ templateId, data }, done),
    remove: (templateId, done) => deleteTemplate.mutate(templateId, done),
    bulkRemove: (templateIds, done) => bulkDeleteTemplates.mutate(templateIds, done),
    saveOrder: async (ordered) => {
      await Promise.all(
        ordered.map((t, idx) => {
          if (t.orderIndex === idx) return Promise.resolve();
          return updateTemplate.mutateAsync({ templateId: t.id, data: { orderIndex: idx } });
        })
      );
    },
    isPending: {
      create: createTemplate.isPending,
      update: updateTemplate.isPending,
      remove: deleteTemplate.isPending,
      bulkRemove: bulkDeleteTemplates.isPending,
    },
    minNameLength: 1,
  };
  return <TemplateManagementView source={source} />;
}

function ProposalTemplateManagementPanel() {
  const query = useProposalMilestoneTemplates();
  const { create, update, remove, removeMany, reorder } = useProposalMilestoneTemplateMutations();
  const data = useMemo<PanelTemplate[] | undefined>(
    () => query.data?.map((t) => ({ ...t, topicId: null, topic: null, createdAt: t.updatedAt })),
    [query.data]
  );

  const source: TemplateSource = {
    phase: "proposal",
    templatesQuery: { ...query, data },
    create: (payload, done) =>
      create.mutate({ name: payload.name, description: payload.description, isActive: payload.isActive, orderIndex: payload.orderIndex }, done),
    update: (templateId, dto, done) =>
      update.mutate({ id: templateId, dto: { name: dto.name, description: dto.description, isActive: dto.isActive, orderIndex: dto.orderIndex } }, done),
    remove: (templateId, done) => remove.mutate(templateId, done),
    bulkRemove: (templateIds, done) => removeMany.mutate(templateIds, done),
    saveOrder: async (ordered) => {
      await reorder.mutateAsync(ordered.map((t) => t.id));
    },
    isPending: { create: create.isPending, update: update.isPending, remove: remove.isPending, bulkRemove: removeMany.isPending },
    minNameLength: 3,
  };
  return <TemplateManagementView source={source} />;
}

/** The proposal source has no topic picker; a stable no-op keeps the effect below quiet. */
const NO_TOPIC_FILTER = () => {};

function TemplateManagementView({ source }: { source: TemplateSource }) {
  const isProposal = source.phase === "proposal";
  const topicFilter = source.topics?.topicFilter ?? null;
  const setTopicFilter = source.topics?.setTopicFilter ?? NO_TOPIC_FILTER;
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TemplateFormState>(emptyForm);
  const [orderedTemplates, setOrderedTemplates] = useState<PanelTemplate[]>([]);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasReordered, setHasReordered] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PanelTemplate | null>(null);

  const templatesQuery = source.templatesQuery;
  const topicsQuery = source.topics?.topicsQuery;
  const templateTopicsQuery = source.topics?.templateTopicsQuery;

  // Stable references: a fresh `[]` on every render (while loading or after an error)
  // would re-trigger the ordering effect below on each render.
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const topics = useMemo(() => topicsQuery?.data ?? [], [topicsQuery?.data]);
  const templateTopics = useMemo(() => templateTopicsQuery?.data ?? [], [templateTopicsQuery?.data]);

  useEffect(() => {
    const sorted = [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    setOrderedTemplates(sorted);
    if (!reorderEnabled) {
      setDraggingId(null);
      setHasReordered(false);
    }
  }, [templates, reorderEnabled]);

  // Select the first topic only when nothing valid is selected (initial load, or the
  // selected topic no longer exists). A refetch never overrides the user's choice.
  useEffect(() => {
    if (isProposal || templateTopics.length === 0) return;
    const stillExists = topicFilter && templateTopics.some((t) => t.id === topicFilter);
    if (!stillExists) {
      setTopicFilter(templateTopics[0].id);
    }
  }, [isProposal, templateTopics, topicFilter, setTopicFilter]);

  const selectedTopic = templateTopics.find((t) => t.id === topicFilter) ?? null;
  const searchTerm = search.trim();

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    // orderedTemplates is filled by an effect (one render behind the query data);
    // fall back to the sorted query data so a fresh load never flashes as "empty".
    const source =
      orderedTemplates.length === templates.length
        ? orderedTemplates
        : [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    if (!term) return source;
    return source.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.description ?? "").toLowerCase().includes(term) ||
        (t.topic?.name ?? "").toLowerCase().includes(term)
    );
  }, [search, orderedTemplates, templates]);

  const isBusy =
    templatesQuery.isLoading ||
    Boolean(topicsQuery?.isLoading) ||
    Boolean(templateTopicsQuery?.isLoading) ||
    source.isPending.create ||
    source.isPending.update ||
    source.isPending.remove ||
    source.isPending.bulkRemove;

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
    source.bulkRemove(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteDialogOpen(false);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    source.remove(templateToDelete.id, {
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

  const startEdit = (template: PanelTemplate) => {
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
      topicId: isProposal ? null : formState.topicId || null,
      orderIndex:
        formState.orderIndex === undefined || formState.orderIndex === null
          ? undefined
          : Number(formState.orderIndex),
      isActive: formState.isActive,
    };

    if (formState.id) {
      source.update(formState.id, payload, { onSuccess: () => setDialogOpen(false) });
    } else {
      source.create(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (template: PanelTemplate) => {
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
      await source.saveOrder(orderedTemplates);
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
              {isProposal
                ? "Buat, perbarui, atau hapus template milestone fase proposal. Template berlaku umum untuk semua mahasiswa fase proposal, tanpa topik."
                : "Buat, perbarui, atau hapus template milestone untuk tugas akhir."}
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
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            {!isProposal && (
            <div className="w-full space-y-2 md:max-w-md">
              <Label>Topik</Label>
              <Popover open={topicPickerOpen} onOpenChange={setTopicPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={topicPickerOpen}
                    aria-label="Pilih topik"
                    disabled={isBusy || templateTopics.length === 0}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{selectedTopic?.name ?? "Pilih topik"}</span>
                    <span className="ml-2 flex shrink-0 items-center gap-2">
                      {selectedTopic && <Badge variant="secondary">{selectedTopic.count}</Badge>}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari topik..." />
                    <CommandList>
                      <CommandEmpty>Topik tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {templateTopics.map((topic) => (
                          <CommandItem
                            key={topic.id}
                            value={topic.name}
                            onSelect={() => {
                              setTopicFilter(topic.id);
                              setTopicPickerOpen(false);
                            }}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Check className={cn("h-4 w-4 shrink-0", topicFilter === topic.id ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{topic.name}</span>
                            </span>
                            <Badge variant="secondary" className="shrink-0">{topic.count}</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            )}
            <div className="w-full space-y-2 md:w-64">
              <Label htmlFor="search">Cari template</Label>
              <Input
                id="search"
                placeholder={isProposal ? "Cari nama/deskripsi" : "Cari nama/topik"}
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

          {templateTopicsQuery?.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal memuat daftar topik</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{(templateTopicsQuery.error as Error)?.message || "Terjadi kesalahan saat memuat topik."}</span>
                <Button size="sm" variant="outline" onClick={() => void templateTopicsQuery.refetch()}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Coba lagi
                </Button>
              </AlertDescription>
            </Alert>
          ) : templatesQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal memuat template</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{(templatesQuery.error as Error)?.message || "Terjadi kesalahan saat memuat template."}</span>
                <Button size="sm" variant="outline" onClick={() => void templatesQuery.refetch()}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Coba lagi
                </Button>
              </AlertDescription>
            </Alert>
          ) : templateTopicsQuery?.isLoading || templatesQuery.isLoading || (!isProposal && templateTopics.length > 0 && !topicFilter) ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat template...
            </div>
          ) : !isProposal && templateTopics.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada topik tugas akhir. Tambahkan topik di tab Topik terlebih dahulu.
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              size="sm"
              title="Belum Ada Template"
              description={isProposal
                ? "Belum ada template milestone fase proposal. Tambahkan template baru untuk memulai."
                : `Belum ada template milestone untuk topik ${selectedTopic?.name ?? "ini"}. Tambahkan template baru untuk memulai.`}
              showButton
              buttonText="Tambah Template"
              buttonIcon={<Plus className="h-4 w-4" />}
              onButtonClick={startCreate}
            />
          ) : filteredTemplates.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Tidak ada template yang cocok dengan pencarian “{searchTerm}”.
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
                        {typeof template.usedCount === "number" && ` · Dipakai ${template.usedCount} milestone mahasiswa`}
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
              {isProposal
                ? "Template fase Proposal, berlaku umum tanpa topik. Mahasiswa memasangnya saat milestone fase proposal masih kosong."
                : "Template akan digunakan mahasiswa untuk membuat milestone awal."}
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
            {!isProposal && (
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
            )}
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
          {source.minNameLength > 1 && formState.name.trim().length < source.minNameLength && (
            <p className="text-xs text-muted-foreground">Nama template minimal {source.minNameLength} karakter.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isBusy}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isBusy || formState.name.trim().length < source.minNameLength}>
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
              Milestone mahasiswa yang sudah dibuat dari template ini tetap ada. Untuk berhenti menawarkan
              template tanpa menghapusnya, nonaktifkan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={source.isPending.bulkRemove}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={source.isPending.bulkRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {source.isPending.bulkRemove ? (
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
              Hapus template "{templateToDelete?.name}"? Tindakan ini tidak dapat dibatalkan. Milestone
              mahasiswa yang sudah dibuat dari template ini tetap ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={source.isPending.remove}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={source.isPending.remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {source.isPending.remove ? (
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
