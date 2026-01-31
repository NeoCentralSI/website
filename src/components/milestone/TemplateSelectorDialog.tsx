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
import { Loader2, FileText, CheckCircle2, ChevronLeft, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { MilestoneTemplate } from "@/types/milestone.types";
import { useTopics } from "@/hooks/milestone";

interface TemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MilestoneTemplate[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (templateIds: string[], topicId: string) => void;
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  templates,
  isLoading,
  isSubmitting,
  onSubmit,
}: TemplateSelectorDialogProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch topics
  const { data: topics = [], isLoading: isLoadingTopics } = useTopics();

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTopicId(null);
      setSelectedIds([]);
    }
  }, [open]);

  // Filter templates by selected topic
  const topicTemplates = useMemo(() => {
    if (!selectedTopicId) return [];
    return templates
      .filter((t) => t.topicId === selectedTopicId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [templates, selectedTopicId]);

  // Get selected topic name
  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId),
    [topics, selectedTopicId]
  );

  // Auto-select all templates when topic is selected
  useEffect(() => {
    if (selectedTopicId && topicTemplates.length > 0) {
      setSelectedIds(topicTemplates.map((t) => t.id));
    }
  }, [selectedTopicId, topicTemplates]);

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allIds = topicTemplates.map((t) => t.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleSubmitClick = () => {
    if (selectedIds.length > 0 && selectedTopicId) {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmedSubmit = () => {
    if (selectedIds.length > 0 && selectedTopicId) {
      onSubmit(selectedIds, selectedTopicId);
      setConfirmDialogOpen(false);
    }
  };

  const handleBack = () => {
    setSelectedTopicId(null);
    setSelectedIds([]);
  };

  const isLoadingAll = isLoading || isLoadingTopics;
  const allSelected =
    topicTemplates.length > 0 &&
    topicTemplates.every((t) => selectedIds.includes(t.id));
  const someSelected =
    topicTemplates.some((t) => selectedIds.includes(t.id)) && !allSelected;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedTopicId
                ? "Pilih Template Milestone"
                : "Pilih Topik Tugas Akhir"}
            </DialogTitle>
            <DialogDescription>
              {selectedTopicId
                ? `Pilih milestone untuk topik "${selectedTopic?.name}". Anda dapat mengedit setelah milestone dibuat.`
                : "Pilih topik tugas akhir Anda terlebih dahulu untuk melihat template milestone yang tersedia."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingAll ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedTopicId ? (
            // Step 1: Topic Selection
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-2">
                {topics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada topik tersedia
                  </div>
                ) : (
                  topics.map((topic) => {
                    const count = templates.filter(
                      (t) => t.topicId === topic.id
                    ).length;
                    return (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTopicId(topic.id)}
                      >
                        <div>
                          <p className="font-medium">{topic.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {count} template milestone
                          </p>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          ) : (
            // Step 2: Template Selection
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -mt-2 mb-2"
                onClick={handleBack}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Kembali pilih topik
              </Button>

              {topicTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada template untuk topik ini
                </div>
              ) : (
                <ScrollArea className="max-h-[45vh] pr-4">
                  <div className="space-y-3">
                    {/* Select All */}
                    <div
                      className="flex items-center gap-2 pb-2 border-b cursor-pointer"
                      onClick={toggleSelectAll}
                    >
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

                    {/* Template List */}
                    <div className="space-y-2">
                      {topicTemplates.map((template) => (
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
                </ScrollArea>
              )}
            </>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTopicId
                ? `${selectedIds.length} milestone dipilih`
                : `${topics.length} topik tersedia`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              {selectedTopicId && (
                <Button
                  onClick={handleSubmitClick}
                  disabled={isSubmitting || selectedIds.length === 0}
                >
                  {isSubmitting && (
                    <Spinner className="mr-2 h-4 w-4" />
                  )}
                  Buat {selectedIds.length} Milestone
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Konfirmasi Pembuatan Milestone
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Anda akan membuat <strong>{selectedIds.length} milestone</strong> dari
                template topik <strong>"{selectedTopic?.name}"</strong>.
              </p>
              <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                Pastikan Anda benar-benar memilih template sesuai topik Tugas Akhir
                yang Anda kerjakan. Topik ini akan diset sebagai topik tugas akhir Anda.
              </p>
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
