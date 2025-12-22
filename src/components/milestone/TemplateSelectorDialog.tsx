import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import type { MilestoneTemplate } from "@/types/milestone.types";

interface TemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MilestoneTemplate[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (templateIds: string[]) => void;
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  templates,
  isLoading,
  isSubmitting,
  onSubmit,
}: TemplateSelectorDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      // Select all by default
      setSelectedIds(templates.map((t) => t.id));
    }
  }, [open, templates]);

  // Group templates by category
  const groupedTemplates = templates.reduce(
    (acc, template) => {
      const category = template.category || "Lainnya";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {} as Record<string, MilestoneTemplate[]>
  );

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryTemplates = groupedTemplates[category];
    const categoryIds = categoryTemplates.map((t) => t.id);
    const allSelected = categoryIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !categoryIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...categoryIds])]);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length > 0) {
      onSubmit(selectedIds);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pilih Template Milestone
          </DialogTitle>
          <DialogDescription>
            Pilih template milestone yang ingin Anda gunakan untuk tugas akhir.
            Anda dapat mengedit setelah milestone dibuat.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada template tersedia
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
                const categoryIds = categoryTemplates.map((t) => t.id);
                const allSelected = categoryIds.every((id) =>
                  selectedIds.includes(id)
                );
                const someSelected =
                  categoryIds.some((id) => selectedIds.includes(id)) && !allSelected;

                return (
                  <div key={category} className="space-y-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      <Checkbox
                        checked={allSelected}
                        // indeterminate state not available, use data attribute
                        data-state={someSelected ? "indeterminate" : undefined}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <h3 className="font-semibold text-sm">{category}</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryTemplates.filter((t) =>
                          selectedIds.includes(t.id)
                        ).length}
                        /{categoryTemplates.length}
                      </Badge>
                    </div>

                    <div className="space-y-2 ml-6">
                      {categoryTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedIds.includes(template.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleTemplate(template.id)}
                        >
                          <Checkbox
                            checked={selectedIds.includes(template.id)}
                            onCheckedChange={() => toggleTemplate(template.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {template.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                #{template.orderIndex + 1}
                              </Badge>
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                          {selectedIds.includes(template.id) && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} milestone dipilih
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedIds.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat {selectedIds.length} Milestone
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
