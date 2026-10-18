import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/ui/empty-state";
import { Loader2, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { MilestoneTemplate } from "@/types/milestone.types";

interface TemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MilestoneTemplate[];
  /** K20: templates follow the thesis topic (set by Admin/Sekdep in the data master). */
  thesisTopicId: string | null;
  thesisTopicName?: string | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (templateIds: string[], topicId: string) => void;
  /** Proposal phase (K18): general templates without a topic; the thesis topic is not needed. */
  generalOnly?: boolean;
}

/**
 * K20: the student applies active TA-phase templates of the thesis topic (plus general
 * templates without a topic) while the milestones are still empty. The topic is never
 * chosen here; the backend uses the thesis topic.
 */
export function TemplateSelectorDialog({
  open,
  onOpenChange,
  templates,
  thesisTopicId,
  thesisTopicName,
  isLoading,
  isSubmitting,
  onSubmit,
  generalOnly = false,
}: TemplateSelectorDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const needsTopic = !generalOnly;
  const topicTemplates = useMemo(() => {
    if (generalOnly) {
      return templates.filter((t) => !t.topicId && t.isActive !== false).sort((a, b) => a.orderIndex - b.orderIndex);
    }
    if (!thesisTopicId) return [];
    return templates
      .filter((t) => (t.topicId === thesisTopicId || !t.topicId) && t.isActive !== false)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [templates, thesisTopicId, generalOnly]);

  // Pre-select every template of the topic when the dialog opens
  useEffect(() => {
    if (open) setSelectedIds(topicTemplates.map((t) => t.id));
  }, [open, topicTemplates]);

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allSelected = topicTemplates.length > 0 && topicTemplates.every((t) => selectedIds.includes(t.id));
  const someSelected = topicTemplates.some((t) => selectedIds.includes(t.id)) && !allSelected;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : topicTemplates.map((t) => t.id));

  const handleConfirmedSubmit = () => {
    if (selectedIds.length > 0 && (thesisTopicId || !needsTopic)) {
      onSubmit(selectedIds, thesisTopicId ?? '');
      setConfirmDialogOpen(false);
    }
  };

  const topicLabel = thesisTopicName || "topik tugas akhir Anda";
  // Paket P8 (5): the phase is written out in the dialog.
  const phaseLabel = generalOnly
    ? "Template fase Proposal"
    : `Template fase Penelitian · topik ${thesisTopicName || "belum diisi"}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pilih Template Milestone
            </DialogTitle>
            <p className="text-sm font-medium" data-testid="template-phase">{phaseLabel}</p>
            <DialogDescription>
              {generalOnly
                ? 'Template berlaku umum untuk semua mahasiswa fase proposal. Milestone yang dibuat dapat Anda ubah atau hapus setelahnya.'
                : `Template sesuai topik "${topicLabel}". Milestone fase proposal yang sudah ada tidak menghalangi. Milestone yang dibuat dapat Anda ubah atau hapus setelahnya.`}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : needsTopic && !thesisTopicId ? (
            <EmptyState
              size="sm"
              title="Topik Belum Diisi"
              description="Tugas akhir Anda belum memiliki topik. Topik diisi oleh Admin/Sekretaris Departemen melalui Data Master Tugas Akhir."
            />
          ) : topicTemplates.length === 0 ? (
            <EmptyState
              size="sm"
              title="Tidak Ada Template"
              description={generalOnly
                ? "Belum ada template milestone proposal yang aktif. Hubungi Sekretaris Departemen atau tambahkan milestone secara manual."
                : "Belum ada template aktif untuk topik ini. Hubungi Sekretaris Departemen atau tambahkan milestone secara manual."}
            />
          ) : (
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b cursor-pointer" onClick={toggleSelectAll}>
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected ? "indeterminate" : undefined}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="font-medium text-sm">Pilih Semua</span>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedIds.length}/{topicTemplates.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {topicTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIds.includes(template.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
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
                          <span className="font-medium text-sm">{template.name}</span>
                          {!template.topicId && (
                            <Badge variant="outline" className="text-xs">
                              Umum
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                        )}
                      </div>
                      {selectedIds.includes(template.id) && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{selectedIds.length} milestone dipilih</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                onClick={() => setConfirmDialogOpen(true)}
                disabled={isSubmitting || selectedIds.length === 0 || (needsTopic && !thesisTopicId)}
              >
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                Buat {selectedIds.length} Milestone
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Konfirmasi Pembuatan Milestone
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan membuat <strong>{selectedIds.length} milestone</strong> dari{" "}
              <strong>{generalOnly ? "template fase Proposal" : `template fase Penelitian (topik "${topicLabel}")`}</strong>. Template hanya
              dapat dipasang sekali per fase, saat milestone fase {generalOnly ? "proposal" : "penelitian"} masih kosong; setelah itu
              milestone ditambahkan satu per satu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                "Ya, Buat Milestone"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
