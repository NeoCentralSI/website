import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

export interface ChangeDecisionDialogState {
  approve: boolean;
  title: string;
  description: string;
  /** Notes are always required to reject; set this to require them to approve too. */
  notesRequired?: boolean;
  notesHint?: string;
}

/** Approve / reject confirmation with notes, shared by lecturer steps and the department. */
export function ThesisChangeRequestDecisionDialog({ state, isSubmitting, onClose, onSubmit }: {
  state: ChangeDecisionDialogState | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (decision: { approve: boolean; notes: string | null }) => void;
}) {
  const [notes, setNotes] = useState('');
  useEffect(() => { if (state) setNotes(''); }, [state]);

  if (!state) return null;
  const required = !state.approve || !!state.notesRequired;
  const missing = required && !notes.trim();
  const label = state.approve ? (required ? 'Alasan' : 'Catatan (opsional)') : 'Alasan penolakan';

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          <DialogDescription>{state.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="change-decision-notes">{label}</Label>
          <Textarea
            id="change-decision-notes"
            value={notes}
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={state.approve ? 'Catatan untuk pengaju' : 'Jelaskan alasannya'}
          />
          {state.notesHint && <p className="text-xs text-muted-foreground">{state.notesHint}</p>}
          {missing && <p className="text-xs text-muted-foreground">{label} wajib diisi.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button
            variant={state.approve ? 'default' : 'destructive'}
            disabled={isSubmitting || missing}
            onClick={() => onSubmit({ approve: state.approve, notes: notes.trim() || null })}
          >
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            {state.approve ? 'Setujui' : 'Tolak'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
