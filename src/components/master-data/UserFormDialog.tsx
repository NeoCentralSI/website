import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/services/admin.service';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  formData: CreateUserRequest | UpdateUserRequest;
  setFormData: (data: CreateUserRequest | UpdateUserRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  roleOptions: Array<{ value: string; label: string }>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  formData,
  setFormData,
  onSubmit,
  roleOptions,
}: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Ubah informasi user yang sudah ada'
                : 'Buat user baru dengan mengisi form di bawah'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="identityType">Tipe Identitas</Label>
                <Select
                  value={formData.identityType}
                  onValueChange={(value: any) => {
                    // Auto-set role to student if identity type is NIM
                    if (value === 'NIM') {
                      setFormData({ ...formData, identityType: value, roles: ['student'] });
                    } else {
                      setFormData({ ...formData, identityType: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIM">NIM</SelectItem>
                    <SelectItem value="NIP">NIP</SelectItem>
                    <SelectItem value="OTHER">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="identityNumber">Nomor Identitas</Label>
                <Input
                  id="identityNumber"
                  value={formData.identityNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, identityNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="roles">Role</Label>
              <Select
                value={typeof formData.roles?.[0] === 'string' ? formData.roles[0] : ''}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, roles: [value] })
                }
                disabled={formData.identityType === 'NIM'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions
                    .filter(role => {
                      // Filter admin jika edit mode
                      if (editingUser && role.value === 'admin') return false;
                      // Filter student jika identity type adalah NIP
                      if (formData.identityType === 'NIP' && role.value === 'student') return false;
                      // Only show student if identity type is NIM
                      if (formData.identityType === 'NIM' && role.value !== 'student') return false;
                      return true;
                    })
                    .map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formData.identityType === 'NIM' && (
                <p className="text-xs text-muted-foreground">
                  Note: User dengan NIM hanya dapat memiliki role Mahasiswa
                </p>
              )}
              {editingUser && formData.identityType !== 'NIM' && (
                <p className="text-xs text-muted-foreground">
                  Note: Role admin tidak dapat diubah melalui form ini
                </p>
              )}
              {formData.identityType === 'NIP' && (
                <p className="text-xs text-muted-foreground">
                  Note: User dengan NIP tidak dapat menjadi mahasiswa
                </p>
              )}
            </div>

            {editingUser && 'isVerified' in formData && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isVerified">Status Verifikasi</Label>
                <Switch
                  id="isVerified"
                  checked={formData.isVerified}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isVerified: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              {editingUser ? 'Simpan Perubahan' : 'Buat User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
