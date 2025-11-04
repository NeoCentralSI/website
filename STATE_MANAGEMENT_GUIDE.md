# 🎯 State Management Guide - Frontend

## 📋 Prinsip State Management

Proyek ini menggunakan **3 jenis state management** yang berbeda sesuai dengan use case-nya:

### 1. **TanStack Query (React Query)** - Server State
**Gunakan untuk:** Data fetching, caching, synchronization dengan server

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ CORRECT: Fetching data dari server
const { data, isLoading, error } = useQuery({
  queryKey: ['students', { page, pageSize, search }],
  queryFn: () => getStudentsAPI({ page, pageSize, search }),
  placeholderData: (previousData) => previousData, // Keep previous data while fetching
  staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
});

// ✅ CORRECT: Mutation dengan cache invalidation
const mutation = useMutation({
  mutationFn: createUserAPI,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('User created successfully');
  },
});
```

**Keuntungan:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Deduplication of requests
- ✅ Loading & error states built-in

### 2. **Zustand** - Global App State
**Gunakan untuk:** State yang perlu diakses di banyak komponen

```typescript
import { create } from 'zustand';

// ✅ CORRECT: Global auth state
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: () => get().user !== null,
}));

// Usage
const { user, setUser } = useAuthStore();
```

**Gunakan untuk:**
- Authentication state
- UI preferences (theme, sidebar state)
- Multi-step form data
- Shopping cart
- Global notifications

### 3. **useState** - Local Component State
**Gunakan untuk:** State yang hanya dibutuhkan dalam satu komponen

```typescript
// ✅ CORRECT: Local UI state
const [isOpen, setIsOpen] = useState(false);
const [searchValue, setSearchValue] = useState('');
const [page, setPage] = useState(1);
```

**Gunakan untuk:**
- Modal/dialog open state
- Form input values
- Pagination controls
- Local filter states
- UI toggles

---

## 🚫 Anti-Patterns (HINDARI)

### ❌ DON'T: Client-side pagination untuk data besar
```typescript
// ❌ BAD: Fetching 1000+ records and filtering client-side
const [allData, setAllData] = useState([]);
const [filteredData, setFilteredData] = useState([]);

const fetchData = async () => {
  const response = await getAPI({ page: 1, pageSize: 1000 }); // BAD!
  setAllData(response.data);
};

useEffect(() => {
  // Client-side filtering and pagination - SLOW!
  const filtered = allData.filter(/* ... */);
  setFilteredData(filtered.slice(start, end));
}, [allData, filters, page]);
```

### ✅ DO: Server-side pagination dengan React Query
```typescript
// ✅ GOOD: Server-side pagination
const { data, isLoading } = useQuery({
  queryKey: ['data', { page, pageSize, search }],
  queryFn: () => getAPI({ page, pageSize, search }),
  placeholderData: (previousData) => previousData,
});

const items = data?.items || [];
const total = data?.meta?.total || 0;
```

---

### ❌ DON'T: Duplicate state untuk caching
```typescript
// ❌ BAD: Manual caching with duplicate state
const [allUsers, setAllUsers] = useState([]);
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);

const fetchUsers = async () => {
  setLoading(true);
  const response = await getUsersAPI();
  setAllUsers(response.users); // Duplicate!
  setUsers(response.users);     // Duplicate!
  setLoading(false);
};
```

### ✅ DO: Let React Query handle caching
```typescript
// ✅ GOOD: React Query manages cache
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: getUsersAPI,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});

const users = data?.users || [];
```

---

### ❌ DON'T: Manual refetch after mutations
```typescript
// ❌ BAD: Manual refetch
const handleCreate = async () => {
  await createUserAPI(data);
  fetchUsers(); // Manual refetch!
};
```

### ✅ DO: Invalidate query cache
```typescript
// ✅ GOOD: Automatic refetch via invalidation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createUserAPI,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

### ❌ DON'T: useEffect with missing dependencies
```typescript
// ❌ BAD: Missing dependencies
useEffect(() => {
  setBreadcrumbs([...]);
  setTitle('Page Title');
}, []); // Missing: setBreadcrumbs, setTitle
```

### ✅ DO: Include all dependencies or use useMemo
```typescript
// ✅ GOOD: All dependencies included
const breadcrumbs = useMemo(() => [
  { label: 'Master Data' },
  { label: 'Users' },
], []);

useEffect(() => {
  setBreadcrumbs(breadcrumbs);
  setTitle('Users');
}, [setBreadcrumbs, setTitle, breadcrumbs]);
```

---

### ❌ DON'T: Inconsistent loading state names
```typescript
// ❌ BAD: Inconsistent naming
const [loading, setLoading] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

### ✅ DO: Consistent naming convention
```typescript
// ✅ GOOD: Consistent with 'is' prefix
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

---

## 📝 Migration Checklist

### Files yang sudah diperbaiki:
- [x] `pages/master-data/Mahasiswa.tsx` - Menggunakan React Query
- [x] `pages/master-data/Dosen.tsx` - Menggunakan React Query
- [x] `pages/master-data/UserManagement.tsx` - Menggunakan React Query (partial)
- [ ] `pages/master-data/AcademicYear.tsx` - Perlu diperbaiki
- [ ] `pages/profil/Profil.tsx` - Perlu review
- [ ] `pages/Notifikasi.tsx` - Remove useEffect alias

### Pattern yang perlu diikuti:

#### 1. Page dengan Data Fetching
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

export default function MyPage() {
  // Local UI state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Memoized static values
  const breadcrumbs = useMemo(() => [
    { label: 'Section' },
    { label: 'Page' },
  ], []);

  // Server state with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['myData', { page, pageSize, search }],
    queryFn: () => fetchMyData({ page, pageSize, search }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search]);

  const items = data?.items || [];
  const total = data?.meta?.total || 0;

  return (/* JSX */);
}
```

#### 2. Mutations (Create/Update/Delete)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function MyForm() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createItemAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item created');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

---

## 🎨 Best Practices

### 1. Query Keys Structure
```typescript
// ✅ GOOD: Hierarchical and descriptive
['users'] // All users
['users', userId] // Specific user
['users', { page, search }] // Users with params
['users', userId, 'posts'] // User's posts
```

### 2. Stale Time Configuration
```typescript
// Short-lived data (frequently changing)
staleTime: 1 * 60 * 1000 // 1 minute

// Medium-lived data (occasionally changing)
staleTime: 5 * 60 * 1000 // 5 minutes

// Long-lived data (rarely changing)
staleTime: 30 * 60 * 1000 // 30 minutes

// Static data (never changing)
staleTime: Infinity
```

### 3. Error Boundaries
```typescript
// Add to App.tsx or root
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          Error: {error.message}
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### 4. Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateUserAPI,
  onMutate: async (newUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['users']);

    // Optimistically update
    queryClient.setQueryData(['users'], (old) => ({
      ...old,
      users: old.users.map(u => 
        u.id === newUser.id ? newUser : u
      ),
    }));

    return { previous };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users'], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

## 🔧 Setup QueryClient

Ensure your `lib/queryClient.ts` has proper defaults:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
      staleTime: 60 * 1000, // Default: 1 minute
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});
```

---

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

## 🎯 Summary

**State Management Decision Tree:**

```
Is it server data? (API response)
  └─ YES → Use TanStack Query
  └─ NO → Is it needed across many components?
      └─ YES → Use Zustand
      └─ NO → Use useState (local)
```

**Golden Rules:**
1. ✅ Server state = React Query
2. ✅ Global app state = Zustand
3. ✅ Local UI state = useState
4. ✅ No duplicate state
5. ✅ No client-side pagination for large datasets
6. ✅ Always invalidate cache after mutations
7. ✅ Consistent naming (isLoading, isSaving, etc.)
8. ✅ Include all useEffect dependencies
