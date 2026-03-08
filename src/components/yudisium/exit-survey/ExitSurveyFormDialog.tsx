import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type { ExitSurveyForm } from '@/types/exitSurvey.types';
import type { CreateExitSurveyFormPayload, UpdateExitSurveyFormPayload } from '@/types/exitSurvey.types';

interface ExitSurveyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: ExitSurveyForm | null;
  onSubmit:
    | ((data: CreateExitSurveyFormPayload) => Promise<unknown>)
    | ((id: string, data: UpdateExitSurveyFormPayload) => Promise<unknown>);
}

export function ExitSurveyFormDialog({
  open,
  onOpenChange,
  editData,
  onSubmit,
}: ExitSurveyFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description ?? '');
    } else {
      setName('');
      setDescription('');
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null };
      if (isEdit && editData) {
        await (onSubmit as (id: string, data: UpdateExitSurveyFormPayload) => Promise<unknown>)(
          editData.id,
          payload
        );
      } else {
        await (onSubmit as (data: CreateExitSurveyFormPayload) => Promise<unknown>)(payload);
      }
      onOpenChange(false);
    } catch {
      // Error handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Form Exit Survey' : 'Tambah Form Exit Survey'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exit-survey-form-name">Nama</Label>
            <Input
              id="exit-survey-form-name"
              placeholder="Contoh: Exit Survey TA 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exit-survey-form-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="exit-survey-form-desc"
              placeholder="Deskripsi form..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {isEdit ? 'Menyimpan...' : 'Menambahkan...'}
                </>
              ) : isEdit ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
