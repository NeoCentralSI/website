import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";
import {
  useTemplates,
  useTemplateCategories,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type TemplateFormState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  orderIndex?: number;
  isActive: boolean;
};

const emptyForm: TemplateFormState = {
  name: "",
  description: "",
  category: "",
  orderIndex: undefined,
  isActive: true,
};

export function TemplateManagementPanel() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TemplateFormState>(emptyForm);

  const templatesQuery = useTemplates(categoryFilter || undefined);
  const categoriesQuery = useTemplateCategories();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const templates = templatesQuery.data || [];
  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.description ?? "").toLowerCase().includes(term) ||
        (t.category ?? "").toLowerCase().includes(term)
    );
  }, [search, templates]);

  const isBusy =
    templatesQuery.isLoading ||
    categoriesQuery.isLoading ||
    createTemplate.isPending ||
    updateTemplate.isPending ||
    deleteTemplate.isPending;

  const startCreate = () => {
    setFormState({
      ...emptyForm,
      orderIndex: templates.length,
    });
    setDialogOpen(true);
  };

  const startEdit = (template: MilestoneTemplate) => {
    setFormState({
      id: template.id,
      name: template.name,
      description: template.description || "",
      category: template.category || "",
      orderIndex: template.orderIndex,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      category: formState.category.trim() || null,
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
    const ok = window.confirm(
      `Hapus template "${template.name}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!ok) return;
    deleteTemplate.mutate(template.id);
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
          <Button onClick={startCreate} disabled={isBusy}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Template
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!categoryFilter ? "secondary" : "outline"}
                onClick={() => setCategoryFilter(null)}
                disabled={isBusy}
              >
                Semua Kategori
              </Button>
              {categoriesQuery.data?.map((cat) => (
                <Button
                  key={cat.name}
                  size="sm"
                  variant={categoryFilter === cat.name ? "secondary" : "outline"}
                  onClick={() => setCategoryFilter(cat.name)}
                  disabled={isBusy}
                >
                  {cat.name} <Badge className="ml-2">{cat.count}</Badge>
                </Button>
              ))}
            </div>
            <div className="w-full md:w-64">
              <Label htmlFor="search">Cari template</Label>
              <Input
                id="search"
                placeholder="Cari nama/kategori"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Separator />

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
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm md:text-base">{template.name}</p>
                      {template.category && (
                        <Badge variant="outline" className="text-xs">
                          {template.category}
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(template)}
                      disabled={isBusy}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      disabled={isBusy}
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
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={formState.category}
                onChange={(e) => setFormState((s) => ({ ...s, category: e.target.value }))}
                placeholder="Mis. Proposal, Sidang, dll (opsional)"
              />
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
    </div>
  );
}
