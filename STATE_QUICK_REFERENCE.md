# 🎯 State Management Quick Reference

## 📌 Kapan Menggunakan Apa?

### 🟢 TanStack Query - Server State
**✅ GUNAKAN UNTUK:**
- Fetching data dari API
- Caching API responses
- Pagination
- Real-time data synchronization
- Background refetching

**📝 CONTOH:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users', { page, pageSize }],
  queryFn: () => getUsersAPI({ page, pageSize }),
  staleTime: 5 * 60 * 1000,
});
```

---

### 🟡 Zustand - Global App State
**✅ GUNAKAN UNTUK:**
- Authentication state
- User preferences (theme, language)
- Shopping cart
- Multi-step form wizard
- Sidebar open/close state

**📝 CONTOH:**
```typescript
const { user, setUser } = useAuthStore();
const { theme, toggleTheme } = useUIStore();
```

---

### 🔵 useState - Local Component State
**✅ GUNAKAN UNTUK:**
- Modal open/close
- Form input values
- Local filters
- Accordion expand/collapse
- Tab selection

**📝 CONTOH:**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [email, setEmail] = useState('');
```

---

## 🚫 Anti-Patterns (JANGAN LAKUKAN!)

### ❌ BAD: Client-side Pagination untuk Data Besar
```typescript
// ❌ JANGAN INI
const response = await getAPI({ pageSize: 1000 });
const filtered = response.data.filter(...);
const paginated = filtered.slice(start, end);
```

### ✅ GOOD: Server-side Pagination
```typescript
// ✅ LAKUKAN INI
const { data } = useQuery({
  queryKey: ['data', { page, pageSize, search }],
  queryFn: () => getAPI({ page, pageSize, search }),
});
```

---

### ❌ BAD: Duplicate State
```typescript
// ❌ JANGAN INI
const [allData, setAllData] = useState([]);
const [filteredData, setFilteredData] = useState([]);
const [loading, setLoading] = useState(false);
```

### ✅ GOOD: React Query (Single Source)
```typescript
// ✅ LAKUKAN INI
const { data, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});
```

---

### ❌ BAD: Manual Refetch
```typescript
// ❌ JANGAN INI
await createUser(data);
fetchUsers(); // Manual refetch
```

### ✅ GOOD: Cache Invalidation
```typescript
// ✅ LAKUKAN INI
await createUser(data);
queryClient.invalidateQueries({ queryKey: ['users'] });
```

---

### ❌ BAD: Inconsistent Naming
```typescript
// ❌ JANGAN INI
const [loading, setLoading] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [saving, setSaving] = useState(false);
```

### ✅ GOOD: Consistent Naming
```typescript
// ✅ LAKUKAN INI
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

---

### ❌ BAD: Missing useEffect Dependencies
```typescript
// ❌ JANGAN INI
useEffect(() => {
  setBreadcrumbs([...]);
  setTitle('Title');
}, []); // Missing dependencies!
```

### ✅ GOOD: All Dependencies Included
```typescript
// ✅ LAKUKAN INI
const breadcrumbs = useMemo(() => [...], []);
useEffect(() => {
  setBreadcrumbs(breadcrumbs);
  setTitle('Title');
}, [setBreadcrumbs, setTitle, breadcrumbs]);
```

---

## 📖 Common Patterns

### Pattern 1: Basic Data Fetching
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', params],
  queryFn: () => fetchResource(params),
  staleTime: 5 * 60 * 1000,
});

useEffect(() => {
  if (error) toast.error(error.message);
}, [error]);

const items = data?.items || [];
```

---

### Pattern 2: Create/Update with Cache Invalidation
```typescript
const queryClient = useQueryClient();

const handleCreate = async (data) => {
  try {
    await createAPI(data);
    queryClient.invalidateQueries({ queryKey: ['resource'] });
    toast.success('Created!');
    onClose();
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

### Pattern 3: Pagination with Search
```typescript
const [page, setPage] = useState(1);
const [search, setSearch] = useState('');

const { data } = useQuery({
  queryKey: ['data', { page, pageSize: 10, search }],
  queryFn: () => fetchData({ page, pageSize: 10, search }),
});

// Reset page when search changes
useEffect(() => {
  setPage(1);
}, [search]);
```

---

### Pattern 4: Memoized Breadcrumbs
```typescript
const breadcrumbs = useMemo(() => [
  { label: 'Home', href: '/' },
  { label: 'Current Page' },
], []);

useEffect(() => {
  setBreadcrumbs(breadcrumbs);
}, [setBreadcrumbs, breadcrumbs]);
```

---

## 🎨 File Structure Pattern

```typescript
// pages/MyPage.tsx
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

export default function MyPage() {
  // 1. Context & Hooks
  const { setBreadcrumbs } = useOutletContext();
  const queryClient = useQueryClient();
  
  // 2. Local UI State
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // 3. Memoized Values
  const breadcrumbs = useMemo(() => [...], []);
  
  // 4. Server State (React Query)
  const { data, isLoading } = useQuery({
    queryKey: ['data', { page }],
    queryFn: () => fetchData({ page }),
  });
  
  // 5. Effects
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
  }, [setBreadcrumbs, breadcrumbs]);
  
  // 6. Handlers
  const handleAction = () => { ... };
  
  // 7. Render
  return ( ... );
}
```

---

## 🔧 Query Client Configuration

```typescript
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute default
    },
  },
});
```

---

## 📊 Decision Tree

```
Apakah data dari server (API)?
├─ YA → React Query
│  └─ Apakah perlu optimistic update?
│     ├─ YA → Gunakan onMutate callback
│     └─ TIDAK → Gunakan invalidateQueries
│
└─ TIDAK → Apakah perlu di banyak komponen?
   ├─ YA → Zustand (global)
   └─ TIDAK → useState (local)
```

---

## ⚡ Performance Tips

1. **Use staleTime wisely:**
   - Frequently changing: `1 * 60 * 1000` (1 min)
   - Occasionally changing: `5 * 60 * 1000` (5 min)
   - Rarely changing: `30 * 60 * 1000` (30 min)

2. **Use placeholderData for smooth UX:**
   ```typescript
   placeholderData: (previousData) => previousData
   ```

3. **Memoize expensive computations:**
   ```typescript
   const filtered = useMemo(() => 
     data.filter(item => item.active),
     [data]
   );
   ```

4. **Use code splitting:**
   ```typescript
   const Heavy = React.lazy(() => import('./Heavy'));
   ```

---

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React Hooks Docs](https://react.dev/reference/react)

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
