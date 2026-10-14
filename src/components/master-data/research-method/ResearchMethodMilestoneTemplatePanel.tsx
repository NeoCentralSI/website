import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useProposalMilestoneTemplateMutations, useProposalMilestoneTemplates } from '@/hooks/research-method/useMilestoneTemplates';
import type { ProposalMilestoneTemplate } from '@/services/research-method/milestone-template.service';

interface FormState {
  id: string | null;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY: FormState = { id: null, name: '', description: '', isActive: true };

/** Why the template form cannot be saved yet, or null. */
export function getTemplateFormProblem(form: Pick<FormState, 'name'>): string | null {
  if (form.name.trim().length < 3) return 'Nama template minimal 3 karakter.';
  return null;
}

/**
 * Tab "Template Milestone" di Kelola > Metode Penelitian (K18): template milestone fase proposal
 * yang berlaku umum (tanpa topik). Sekretaris Departemen mengelola; koordinator hanya membaca.
 */
export function ResearchMethodMilestoneTemplatePanel({ canEdit }: { canEdit: boolean }) {
  const { data: templates = [], isLoading, error } = useProposalMilestoneTemplates();
  const { create, update, remove, reorder } = useProposalMilestoneTemplateMutations();
  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<ProposalMilestoneTemplate | null>(null);
  const readOnlyReason = canEdit ? null : 'Template milestone proposal dikelola Sekretaris Departemen.';

  const move = (index: number, delta: number) => {
    const ids = templates.map((t) => t.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  const save = () => {
    if (!form || getTemplateFormProblem(form)) return;
    const dto = { name: form.name.trim(), description: form.description.trim() || null, isActive: form.isActive };
    const close = { onSuccess: () => setForm(null) };
    if (form.id) update.mutate({ id: form.id, dto }, close);
    else create.mutate(dto, close);
  };

  const formProblem = form ? getTemplateFormProblem(form) : null;
  const saving = create.isPending || update.isPending;

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Template Milestone Proposal</CardTitle>
          <CardDescription>
            Berlaku umum untuk semua mahasiswa fase proposal, tanpa topik. Mahasiswa memasang template saat milestone fase proposal masih kosong.
          </CardDescription>
        </div>
        <span title={readOnlyReason ?? undefined}>
          <Button size="sm" disabled={!canEdit} onClick={() => setForm(EMPTY)}>
            <Plus className="mr-2 h-4 w-4" />Tambah Template
          </Button>
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {readOnlyReason && <p className="text-xs text-muted-foreground">{readOnlyReason}</p>}
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : error ? (
          <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat template.'}</p>
        ) : templates.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada template milestone proposal." />
        ) : (
          <ol className="divide-y rounded-lg border">
            {templates.map((template, index) => (
              <li key={template.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">{index + 1}.</span>
                    <span className="font-medium break-words">{template.name}</span>
                    {template.isActive ? <Badge variant="success">Aktif</Badge> : <Badge variant="outline">Nonaktif</Badge>}
                  </div>
                  {template.description && <p className="text-sm text-muted-foreground break-words">{template.description}</p>}
                  <p className="text-xs text-muted-foreground">Dipakai {template.usedCount} milestone mahasiswa</p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Naikkan" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Turunkan" disabled={index === templates.length - 1 || reorder.isPending} onClick={() => move(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ubah"
                      onClick={() => setForm({ id: template.id, name: template.name, description: template.description ?? '', isActive: template.isActive })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => setToDelete(template)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? 'Ubah Template Milestone' : 'Tambah Template Milestone'}</DialogTitle>
            <DialogDescription>Template berlaku umum untuk fase proposal.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="proposal-template-name">Nama</Label>
                <Input id="proposal-template-name" value={form.name} maxLength={255} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proposal-template-description">Deskripsi</Label>
                <Textarea id="proposal-template-description" value={form.description} maxLength={5000} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="proposal-template-active" checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
                <Label htmlFor="proposal-template-active">Aktif (dapat dipasang mahasiswa)</Label>
              </div>
              {formProblem && <p className="text-xs text-muted-foreground">{formProblem}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Batal</Button>
            <Button disabled={Boolean(formProblem) || saving} onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.usedCount
                ? `Milestone mahasiswa yang dibuat dari template ini (${toDelete.usedCount}) tetap ada. `
                : ''}
              Template "{toDelete?.name}" tidak dapat dipasang lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && remove.mutate(toDelete.id)}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
