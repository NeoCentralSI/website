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
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/services/admin.service';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  formData: CreateUserRequest | UpdateUserRequest;
  setFormData: (data: CreateUserRequest | UpdateUserRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  roleOptions: Array<{ value: string; label: string }>;
  isSubmitting?: boolean;
}

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  formData,
  setFormData,
  onSubmit,
  roleOptions,
  isSubmitting = false,
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
                    // Auto-set role to Mahasiswa if identity type is NIM
                    if (value === 'NIM') {
                      setFormData({ ...formData, identityType: value, roles: ['Mahasiswa'] });
                    } else {
                      // Clear roles if changing from NIM to NIP/OTHER
                      const currentRoles = Array.isArray(formData.roles) 
                        ? formData.roles.filter((r): r is string => typeof r === 'string' && r !== 'Mahasiswa')
                        : [];
                      setFormData({ ...formData, identityType: value, roles: currentRoles });
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
              <Label>Role</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {formData.identityType === 'NIM' ? (
                  // For NIM, only show Mahasiswa and it's auto-selected
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-mahasiswa"
                      checked={true}
                      disabled
                    />
                    <label
                      htmlFor="role-mahasiswa"
                      className="text-sm font-medium leading-none text-muted-foreground"
                    >
                      Mahasiswa (otomatis untuk NIM)
                    </label>
                  </div>
                ) : (
                  // For NIP/OTHER, show all roles except Mahasiswa
                  roleOptions
                    .filter(role => {
                      // Filter admin role when editing
                      if (editingUser && role.value === 'Admin') return false;
                      // Filter Mahasiswa for NIP/OTHER
                      if (role.value === 'Mahasiswa') return false;
                      return true;
                    })
                    .map((role) => {
                      const isChecked = Array.isArray(formData.roles) && 
                        formData.roles.some(r => 
                          typeof r === 'string' ? r === role.value : r?.name === role.value
                        );
                      return (
                        <div key={role.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentRoles = Array.isArray(formData.roles) 
                                ? formData.roles.filter((r): r is string => typeof r === 'string')
                                : [];
                              if (checked) {
                                setFormData({ ...formData, roles: [...currentRoles, role.value] });
                              } else {
                                setFormData({ ...formData, roles: currentRoles.filter(r => r !== role.value) });
                              }
                            }}
                          />
                          <label
                            htmlFor={`role-${role.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {role.label}
                          </label>
                        </div>
                      );
                    })
                )}
              </div>
              {formData.identityType !== 'NIM' && (!formData.roles || formData.roles.length === 0) && (
                <p className="text-xs text-muted-foreground">Pilih minimal satu role</p>
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
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Menyimpan...
                </>
              ) : editingUser ? (
                'Simpan Perubahan'
              ) : (
                'Buat User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
