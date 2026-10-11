import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDevToolsRoles } from '@/hooks/dev-tools/useDevTools';
import type { CreateUserDto } from '@/types/devTools.types';

const EMPTY_FORM: CreateUserDto = { fullName: '', identityNumber: '', password: '', identityType: 'NIM', roles: [] };

export function DevToolsCreateUserDialog({ open, onOpenChange, onSave, isSubmitting }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (data: CreateUserDto) => Promise<unknown>; isSubmitting: boolean;
}) {
  const { data: roles } = useDevToolsRoles();
  const [form, setForm] = useState<CreateUserDto>(EMPTY_FORM);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setEmail(''); }
  }, [open]);

  const toggleRole = (name: string) => {
    const current = form.roles || [];
    setForm({ ...form, roles: current.includes(name) ? current.filter((r) => r !== name) : [...current, name] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Buat User Baru</DialogTitle>
          <DialogDescription>User otomatis diverifikasi dan bisa langsung login</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label htmlFor="cu-name">Nama Lengkap *</Label>
              <Input id="cu-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="cu-id">NIM / NIP *</Label>
              <Input id="cu-id" value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="cu-type">Tipe Identitas</Label>
              <Select value={form.identityType} onValueChange={(v) => setForm({ ...form, identityType: v as 'NIM' | 'NIP' | 'OTHER' })}>
                <SelectTrigger id="cu-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="NIM">NIM (Mahasiswa)</SelectItem><SelectItem value="NIP">NIP (Dosen)</SelectItem><SelectItem value="OTHER">Lainnya</SelectItem></SelectContent>
              </Select></div>
            <div className="space-y-2"><Label htmlFor="cu-email">Email (opsional)</Label>
              <Input id="cu-email" type="email" placeholder="user@unand.ac.id" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="cu-pw">Password *</Label>
              <Input id="cu-pw" type="text" placeholder="Minimal 4 karakter" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Roles (kosongkan = default berdasarkan tipe)</Label>
            <div className="grid grid-cols-2 gap-2">
              {roles?.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Checkbox id={`role-${r.id}`} checked={form.roles?.includes(r.name)} onCheckedChange={() => toggleRole(r.name)} />
                  <Label htmlFor={`role-${r.id}`} className="text-sm font-normal cursor-pointer">{r.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button disabled={isSubmitting || !form.fullName.trim() || !form.identityNumber.trim() || form.password.length < 4}
            onClick={async () => {
              const payload = { ...form, email: email.trim() || undefined };
              const ok = await onSave(payload);
              if (ok !== null) onOpenChange(false);
            }}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Membuat...</> : 'Buat User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
