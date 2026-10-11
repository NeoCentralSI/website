import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DevToolsPasswordDialog({ userId, userName, open, onOpenChange, onSave, isSubmitting }: {
  userId: string | null; userName: string; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (id: string, pw: string) => Promise<unknown>; isSubmitting: boolean;
}) {
  const [pw, setPw] = useState('');
  useEffect(() => { if (open) setPw(''); }, [open]);
  if (!userId) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Ubah Password</DialogTitle>
          <DialogDescription>{userName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-pw">Password Baru</Label>
          <Input id="new-pw" type="text" placeholder="Minimal 4 karakter" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button onClick={async () => { const ok = await onSave(userId, pw); if (ok !== null) onOpenChange(false); }}
            disabled={isSubmitting || pw.length < 4}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
