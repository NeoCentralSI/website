import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { roleOptions } from '@/lib/roles';
import type { User, UpdateUserRequest } from '@/services/admin.service';
import { UserFormDialog } from './UserFormDialog';

// Radix checkbox and switch measure themselves with ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const user = { id: 'u1', fullName: 'Admin SI', email: 'admin_si@x.test', identityType: 'NIP', identityNumber: '1', isVerified: true, roles: [] } as unknown as User;

function open(formData: UpdateUserRequest, isSelf = false) {
  render(
    <UserFormDialog
      open
      onOpenChange={vi.fn()}
      editingUser={user}
      formData={formData}
      setFormData={vi.fn()}
      onSubmit={vi.fn()}
      roleOptions={roleOptions}
      isSelf={isSelf}
    />,
  );
}

const base: UpdateUserRequest = { fullName: 'Admin SI', email: 'admin_si@x.test', identityType: 'NIP', identityNumber: '1', isVerified: true, roles: [] };

describe('UserFormDialog: Admin account rules', () => {
  it('locks the roles and the activation of the own account', () => {
    open({ ...base, roles: ['Admin'] }, true);
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeDisabled();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByText('Peran dan status akun Anda sendiri tidak dapat diubah')).toBeInTheDocument();
  });

  it('an Admin account holds no other role, and a lecturer cannot also be Admin', () => {
    open({ ...base, roles: ['Admin'] });
    expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Penguji' })).toBeDisabled();
  });

  it('a lecturer role disables Admin', () => {
    open({ ...base, roles: ['Penguji'] });
    expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Pembimbing 1' })).toBeEnabled();
  });
});
