import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, CheckCircle2, XCircle } from 'lucide-react';
import { toTitleCaseName } from '@/lib/text';
import { formatRoleName, ROLES } from '@/lib/roles';
import type { User } from '@/services/admin.service';

interface GetUserTableColumnsOptions {
  identityTypeFilter: string;
  setIdentityTypeFilter: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onEdit: (user: User) => void;
}

export const getUserTableColumns = (options: GetUserTableColumnsOptions) => {
  const {
    identityTypeFilter,
    setIdentityTypeFilter,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    onEdit,
  } = options;

  return [
    {
      key: 'fullName',
      header: 'Nama Lengkap',
      sortable: true,
      render: (row: any) => (
        <span className="font-medium">{toTitleCaseName(row.fullName)}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      key: 'identityNumber',
      header: 'NIM/NIP',
      render: (row: any) => (
        <div>
          <div className="font-medium">{row.identityNumber || '-'}</div>
          {row.identityType && (
            <div className="text-xs text-muted-foreground">{row.identityType}</div>
          )}
        </div>
      ),
      filter: {
        type: 'select',
        value: identityTypeFilter,
        onChange: setIdentityTypeFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'NIM', value: 'NIM' },
          { label: 'NIP', value: 'NIP' },
          { label: 'OTHER', value: 'OTHER' },
        ],
      },
    },
    {
      key: 'roles',
      header: 'Role',
      render: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role: any) => (
            <Badge
              key={role.id}
              variant={role.status === 'active' ? 'default' : 'secondary'}
            >
              {formatRoleName(role.name)}
            </Badge>
          ))}
        </div>
      ),
      filter: {
        type: 'select',
        value: roleFilter,
        onChange: setRoleFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'Admin', value: ROLES.ADMIN },
          { label: 'GKM', value: ROLES.GKM },
          { label: 'Ketua Departemen', value: ROLES.KETUA_DEPARTEMEN },
          { label: 'Sekretaris Departemen', value: ROLES.SEKRETARIS_DEPARTEMEN },
          { label: 'Pembimbing 1', value: ROLES.PEMBIMBING_1 },
          { label: 'Pembimbing 2', value: ROLES.PEMBIMBING_2 },
          { label: 'Mahasiswa', value: ROLES.MAHASISWA },
          { label: 'Penguji', value: ROLES.PENGUJI },
        ],
      },
    },
    {
      key: 'isVerified',
      header: 'Status',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.isVerified ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Terverifikasi</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Belum Verifikasi</span>
            </>
          )}
        </div>
      ),
      filter: {
        type: 'select',
        value: statusFilter,
        onChange: setStatusFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'Terverifikasi', value: 'verified' },
          { label: 'Belum Verifikasi', value: 'unverified' },
        ],
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row as User)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      ),
    },
  ];
};
