# Frontend Development Rules

## Context Awareness
Setiap kali memulai implementasi fitur atau perubahan, agent **HARUS** mengikuti prinsip clean code dan best practices berikut:

### 1. WAJIB Check Struktur Project Terlebih Dahulu
- **WAJIB** pahami struktur folder dan file yang sudah ada
- Identifikasi komponen yang bisa di-reuse
- Periksa services, hooks, dan stores yang sudah tersedia
- Jangan membuat ulang yang sudah ada

### 2. Clean Code Principles

#### a. **JANGAN** Buat Component Langsung di Pages
❌ **SALAH:**
```tsx
// pages/Dashboard.tsx
export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100">
        {/* sidebar code */}
      </aside>
      <main className="flex-1">
        <nav className="h-16 bg-white">
          {/* navbar code */}
        </nav>
        <div className="p-6">
          {/* content */}
        </div>
      </main>
    </div>
  );
}
```

✅ **BENAR:**
```tsx
// pages/Dashboard.tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
```

#### b. **WAJIB** Gunakan Reusable Components
- Pages hanya boleh berisi **composition** dari components
- Business logic ada di hooks atau services
- UI logic yang kompleks di components
- Gunakan layout components yang sudah ada (`AppLayout`, `DashboardLayout`, `ProtectedLayout`, dll)

### 3. Project Structure & Layer Architecture

```
src/
├── pages/               # HANYA composition, minimal logic
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Navbar, Sidebar, etc)
│   ├── ui/             # Shadcn UI base components
│   └── {feature}/      # Feature-specific components
├── services/            # API calls & external services
├── hooks/               # Custom React hooks
├── stores/              # Zustand state management
├── types/               # TypeScript types & interfaces
├── lib/                 # Utility functions & configurations
└── utils/               # Helper functions
```

#### Layer Responsibilities:

##### **Pages Layer** (`src/pages/`)
- **HANYA** composition dari components
- **MINIMAL** logic, hanya routing params handling
- Gunakan layout components
- Connect ke hooks untuk data fetching

**Contoh Structure:**
```tsx
// pages/admin/UserManagement.tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserTable } from '@/components/admin/UserTable';
import { UserFormDialog } from '@/components/admin/UserFormDialog';

export default function UserManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
          <UserFormDialog />
        </div>
        <UserTable />
      </div>
    </DashboardLayout>
  );
}
```

##### **Components Layer** (`src/components/`)
- Reusable UI components
- Bisa memiliki state internal (useState, useReducer)
- Menerima props untuk customization
- Gunakan composition pattern
- **WAJIB** typecheck dengan TypeScript

**Contoh Structure:**
```tsx
// components/admin/UserTable.tsx
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/stores/user.store';
import { adminService } from '@/services/admin.service';
import { CustomTable } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';

export function UserTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
  });

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    // ...
  ];

  return (
    <CustomTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      renderActions={(row) => (
        <Button variant="ghost" size="sm">Edit</Button>
      )}
    />
  );
}
```

##### **Services Layer** (`src/services/`)
- **HANYA** API calls dan external services
- Return typed data
- Handle error di sini atau lempar ke caller
- Gunakan axios instance dari config

**Contoh Structure:**
```tsx
// services/admin.service.ts
import { api } from '@/config/api';
import type { User, CreateUserDto } from '@/types/user.types';

export const adminService = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/admin/users');
    return data.data;
  },

  createUser: async (dto: CreateUserDto): Promise<User> => {
    const { data } = await api.post('/admin/users', dto);
    return data.data;
  },

  updateUser: async (id: string, dto: Partial<CreateUserDto>): Promise<User> => {
    const { data } = await api.put(`/admin/users/${id}`, dto);
    return data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },
};
```

##### **Hooks Layer** (`src/hooks/`)
- Custom React hooks untuk reusable logic
- Data fetching hooks (gunakan TanStack Query)
- State management hooks (gunakan Zustand)
- Side effects hooks

**Contoh Structure:**
```tsx
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import type { CreateUserDto } from '@/types/user.types';

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserDto> }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users,
    isLoading,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

##### **Stores Layer** (`src/stores/`)
- Zustand stores untuk global state
- **JANGAN** gunakan untuk server state (gunakan TanStack Query)
- Gunakan untuk UI state, auth state, user preferences
- Keep it simple dan minimal

**Contoh Structure:**
```tsx
// stores/ui.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

### 4. TanStack Query Best Practices

#### ✅ DO's:
```tsx
// Gunakan untuk semua server state
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters], // Include dependencies
  queryFn: () => adminService.getUsers(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
});

// Gunakan mutation untuk write operations
const mutation = useMutation({
  mutationFn: adminService.createUser,
  onSuccess: (data) => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['users'] });
    // Or optimistically update
    queryClient.setQueryData(['users'], (old) => [...old, data]);
  },
  onError: (error) => {
    // Handle error
    toast.error(error.message);
  },
});

// Prefetch untuk better UX
const prefetchUser = () => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => adminService.getUser(userId),
  });
};
```

#### ❌ DON'T's:
```tsx
// JANGAN gunakan useState untuk server data
const [users, setUsers] = useState([]);
useEffect(() => {
  adminService.getUsers().then(setUsers);
}, []);

// JANGAN fetch di useEffect jika bisa pakai useQuery
// JANGAN simpan server state di Zustand
```

### 5. Zustand Best Practices

#### ✅ DO's:
```tsx
// Gunakan HANYA untuk client state
const useUIStore = create((set) => ({
  // UI state
  sidebarOpen: true,
  modal: null,
  
  // Actions
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));

// Gunakan selectors untuk performa
const sidebarOpen = useUIStore((state) => state.sidebarOpen);

// Gunakan persist untuk state yang perlu disimpan
const usePreferencesStore = create(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'preferences' }
  )
);
```

#### ❌ DON'T's:
```tsx
// JANGAN simpan server data di Zustand
const useUserStore = create((set) => ({
  users: [], // ❌ Gunakan TanStack Query
  fetchUsers: async () => {}, // ❌
}));

// JANGAN subscribe ke seluruh store jika tidak perlu
const store = useUIStore(); // ❌ Re-render di setiap perubahan
```

### 6. Component Organization

#### Feature-based Structure:
```
components/
├── layout/              # Global layouts
│   ├── AppLayout.tsx
│   ├── DashboardLayout.tsx
│   ├── Navbar.tsx
│   └── sidebar/
├── ui/                  # Shadcn base components
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
└── {feature}/           # Feature components
    ├── FeatureList.tsx
    ├── FeatureForm.tsx
    ├── FeatureDetail.tsx
    └── index.ts         # Export barrel
```

#### Component File Structure:
```tsx
// 1. Imports (grouped logically)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/user.service';
import type { User } from '@/types/user.types';

// 2. Types/Interfaces
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

// 3. Component
export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  // 3a. Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 3b. Handlers
  const handleEdit = () => {
    onEdit?.(user);
  };
  
  // 3c. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 4. Sub-components (if needed, prefer separate files)
```

### 7. TypeScript Best Practices

#### ✅ DO's:
```tsx
// Define types untuk semua props
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

// Gunakan type inference
const [count, setCount] = useState(0); // type inferred as number

// Extract types ke file terpisah untuk reusability
// types/user.types.ts
export interface User {
  id: string;
  fullName: string;
  email: string;
}

export type CreateUserDto = Omit<User, 'id'>;
```

#### ❌ DON'T's:
```tsx
// JANGAN gunakan any
const data: any = await api.get('/users'); // ❌

// JANGAN skip type definitions untuk props
export function Button(props) { // ❌
  return <button {...props} />;
}
```

### 8. Styling Guidelines

#### Gunakan Tailwind CSS dengan Konsisten:
```tsx
// ✅ Gunakan utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// ✅ Gunakan cn() helper untuk conditional classes
import { cn } from '@/lib/utils';

<button className={cn(
  "px-4 py-2 rounded",
  variant === 'primary' && "bg-blue-500 text-white",
  variant === 'secondary' && "bg-gray-200 text-gray-800",
  disabled && "opacity-50 cursor-not-allowed"
)}>

// ❌ JANGAN gunakan inline styles kecuali dynamic values
<div style={{ color: 'red' }}> // ❌
```

#### Text Formatting Utilities:
**WAJIB** gunakan text utilities dari `@/lib/text` untuk formatting text:

```tsx
import { toTitleCaseName, formatRoleName, formatDateId } from '@/lib/text';

// ✅ Format nama (dari KAPITAL ke Title Case)
<div>{toTitleCaseName(user.fullName)}</div>  // "JOHN DOE" → "John Doe"

// ✅ Format role name (pembimbing1 → Pembimbing 1)
<div>{formatRoleName(role)}</div>  // "pembimbing1" → "Pembimbing 1"

// ✅ Format tanggal Indonesia
<div>{formatDateId(data.createdAt)}</div>  // "Senin, 07/12/2025, 15:30"

// ❌ JANGAN tampilkan nama/role langsung tanpa format
<div>{user.fullName}</div>  // ❌ Akan tampil "JOHN DOE"
<div>{role}</div>  // ❌ Akan tampil "pembimbing1"
```

**Available Text Utilities:**
- `toTitleCaseName(name)` - Convert nama dari UPPERCASE/lowercase ke Title Case
- `formatRoleName(role)` - Format role name ke readable format (pembimbing1 → Pembimbing 1)
- `formatDateId(date)` - Format tanggal dalam bahasa Indonesia dengan timezone Jakarta

**Kapan Menggunakan:**
- **SEMUA nama** (fullName, studentName, lecturerName, dll) → gunakan `toTitleCaseName()`
- **SEMUA role/peran** (pembimbing1, penguji1, dll) → gunakan `formatRoleName()`
- **SEMUA tanggal/waktu** (createdAt, updatedAt, scheduledAt, dll) → gunakan `formatDateId()`

#### Shadcn UI Components:
Project ini menggunakan **Shadcn UI** untuk base components. Berikut cara penggunaannya:

**✅ WAJIB Check Komponen yang Sudah Ada:**
```
src/components/ui/
├── button.tsx          ✅ Available
├── dialog.tsx          ✅ Available
├── input.tsx           ✅ Available
├── label.tsx           ✅ Available
├── card.tsx            ✅ Available
├── table.tsx           ✅ Available
├── dropdown-menu.tsx   ✅ Available
├── select.tsx          ✅ Available
├── checkbox.tsx        ✅ Available
├── badge.tsx           ✅ Available
├── alert.tsx           ✅ Available
├── avatar.tsx          ✅ Available
├── calendar.tsx        ✅ Available
├── sheet.tsx           ✅ Available
├── toast.tsx           ✅ Available
└── ... (dan lainnya)
```

**Sebelum membuat component baru, CHECK DULU `src/components/ui/`!**

**✅ Jika Komponen Belum Ada, Install via CLI:**
```bash
# Cek daftar komponen yang tersedia
npx shadcn@latest add

# Install komponen tertentu (contoh: tabs)
npx shadcn@latest add tabs

# Install multiple components sekaligus
npx shadcn@latest add tabs accordion switch

# Install dengan custom path (jika diperlukan)
npx shadcn@latest add tabs --path src/components/ui
```

**Komponen yang Sering Dibutuhkan:**
```bash
# Form components
npx shadcn@latest add form textarea radio-group switch select

# Layout components  
npx shadcn@latest add tabs accordion separator sheet

# Feedback components
npx shadcn@latest add toast alert-dialog progress skeleton

# Data display
npx shadcn@latest add table data-table pagination

# Navigation
npx shadcn@latest add breadcrumb navigation-menu

# Overlay
npx shadcn@latest add popover tooltip hover-card
```

**✅ Cara Menggunakan Shadcn Components:**
```tsx
// 1. Import dari @/components/ui
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 2. Gunakan langsung dengan props
export function UserForm() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter name" />
          </div>
          <Button type="submit">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 3. Extend component jika perlu customization
import { Button, type ButtonProps } from '@/components/ui/button';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export function LoadingButton({ isLoading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading ? 'Loading...' : children}
    </Button>
  );
}
```

**❌ JANGAN:**
```tsx
// ❌ JANGAN install shadcn components yang sudah ada
// Check dulu di src/components/ui/

// ❌ JANGAN modify langsung file di src/components/ui/
// Buat wrapper component jika perlu customization

// ❌ JANGAN buat component manual yang sudah ada di shadcn
// Gunakan shadcn components yang sudah di-install
```

**Workflow Install Shadcn Component:**
1. Check apakah component sudah ada di `src/components/ui/`
2. Jika belum ada, jalankan `npx shadcn@latest add <component-name>`
3. Component akan otomatis ditambahkan ke `src/components/ui/`
4. Import dan gunakan di aplikasi
5. Jika perlu customization, buat wrapper component

### 9. Performance Optimization

```tsx
// ✅ Memoize expensive computations
const sortedUsers = useMemo(
  () => users?.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// ✅ Memoize callbacks yang di-pass sebagai props
const handleDelete = useCallback(
  (id: string) => deleteUser(id),
  [deleteUser]
);

// ✅ Code splitting untuk routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// ✅ Zustand selectors
const sidebarOpen = useUIStore((state) => state.sidebarOpen);

// ❌ JANGAN premature optimization
// Gunakan memo/callback hanya jika ada performance issue
```

### 10. Error Handling

```tsx
// ✅ Handle errors di TanStack Query
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: userService.getUsers,
});

if (isError) {
  return <ErrorState error={error} />;
}

// ✅ Error boundaries untuk runtime errors
// App.tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Router />
</ErrorBoundary>

// ✅ Toast notifications untuk user feedback
import { toast } from 'sonner';

const mutation = useMutation({
  mutationFn: userService.createUser,
  onSuccess: () => toast.success('User created successfully'),
  onError: (error) => toast.error(error.message),
});
```

## Checklist Implementasi Fitur

Sebelum menganggap fitur selesai, pastikan:

- [ ] **TIDAK** ada component langsung di pages
- [ ] Menggunakan layout components yang sudah ada
- [ ] Component bersifat reusable dan modular
- [ ] Server state menggunakan TanStack Query
- [ ] Client state menggunakan Zustand (jika perlu)
- [ ] Semua props dan return types ter-define dengan TypeScript
- [ ] Menggunakan Tailwind CSS dengan konsisten
- [ ] Error handling sudah proper
- [ ] Loading states ditangani dengan baik
- [ ] Component ter-export dengan benar
- [ ] Code sudah di-test manual dan tidak ada error

## Best Practices Checklist

### Component Creation:
- [ ] Single Responsibility Principle
- [ ] Props dengan TypeScript interface
- [ ] Reusable dan composable
- [ ] Proper naming (PascalCase)
- [ ] Export from index.ts jika feature component

### Data Fetching:
- [ ] Gunakan TanStack Query untuk server state
- [ ] Proper query keys (include dependencies)
- [ ] Handle loading, error, success states
- [ ] Invalidate queries setelah mutations

### State Management:
- [ ] TanStack Query untuk server state
- [ ] Zustand untuk global UI state
- [ ] useState/useReducer untuk local component state
- [ ] Zustand selectors untuk performance

### Styling:
- [ ] Tailwind utility classes
- [ ] Responsive design (sm:, md:, lg:)
- [ ] Consistent spacing dan colors
- [ ] Gunakan cn() untuk conditional classes

### TypeScript:
- [ ] No `any` types
- [ ] Props interfaces defined
- [ ] API response types defined
- [ ] Proper type inference

## File Naming Conventions

```
Components:     PascalCase.tsx      (UserCard.tsx)
Services:       camelCase.service.ts (user.service.ts)
Hooks:          camelCase.ts/tsx    (useUsers.ts)
Stores:         camelCase.store.ts  (auth.store.ts)
Types:          camelCase.types.ts  (user.types.ts)
Utils:          camelCase.ts        (cookies.ts)
Pages:          PascalCase.tsx      (Dashboard.tsx)
```

## Import Order

```tsx
// 1. React & external libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal components
import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/users/UserCard';

// 3. Hooks
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';

// 4. Services
import { userService } from '@/services/user.service';

// 5. Stores
import { useAuthStore } from '@/stores/auth.store';

// 6. Types
import type { User } from '@/types/user.types';

// 7. Utils & lib
import { cn } from '@/lib/utils';

// 8. Styles (if any)
import './styles.css';
```

## PENTING: Prinsip Utama

1. **Pages = Composition Only** - No business logic, no complex UI
2. **Components = Reusable** - Modular, single responsibility
3. **TanStack Query = Server State** - All API data fetching
4. **Zustand = Client State** - UI state, auth, preferences
5. **TypeScript = Type Everything** - Props, responses, state
6. **Clean Code = Readable** - Self-documenting, consistent

**Remember: Write code that your future self will thank you for! 🚀**

## DILARANG: Membuat File Summary/Changelog

❌ **JANGAN PERNAH** membuat file markdown untuk summary setelah implementasi selesai, seperti:
- `IMPLEMENTATION.md`
- `CHANGES.md`
- `SUMMARY.md`
- `CHANGELOG.md`
- `COMPONENT_GUIDE.md`
- atau file dokumentasi perubahan lainnya

✅ **YANG BENAR:**
- Langsung implementasi code
- Components sudah self-documented dengan TypeScript
- Berikan penjelasan singkat di chat jika diperlukan
- Code dengan proper types dan naming adalah satu-satunya output yang diperlukan

**Prinsip:** Clean code is self-documenting. TypeScript types dan component structure sudah cukup jelas.
