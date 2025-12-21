import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface GuidanceNotesDialogProps {
  initialNotes?: string;
  onUpdate: (data: { studentNotes: string }) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function GuidanceNotesDialog({ initialNotes = '', onUpdate, trigger }: GuidanceNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onUpdate({ studentNotes: notes });
      if (success) {
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="secondary">Perbarui Catatan</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perbarui Catatan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Catatan</Label>
            <Input 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
