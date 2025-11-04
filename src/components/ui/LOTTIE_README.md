# Lottie Animation Components

Komponen untuk menampilkan animasi Lottie di aplikasi frontend.

## Komponen

### 1. EmptyState

Komponen **pure/standalone** untuk menampilkan empty state dengan animasi Lottie ketika tidak ada data. Tidak bergantung pada layout global seperti sidebar atau header.

#### Props

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `title` | `string` | `"Tidak Ada Data"` | Judul empty state |
| `description` | `string` | `"Belum ada data untuk ditampilkan"` | Deskripsi empty state |
| `className` | `string` | `""` | Class CSS tambahan |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Ukuran animasi |
| `showButton` | `boolean` | `false` | Tampilkan tombol action |
| `buttonText` | `string` | `"Muat Ulang"` | Text tombol |
| `onButtonClick` | `() => void` | `undefined` | Handler untuk tombol |
| `buttonIcon` | `ReactNode` | `undefined` | Icon untuk tombol |

#### Penggunaan

```tsx
import EmptyState from '@/components/ui/empty-state';
import { RefreshCw } from 'lucide-react';

// Basic usage
<EmptyState />

// Custom text
<EmptyState 
  title="Tidak Ada Notifikasi"
  description="Notifikasi akan muncul di sini"
/>

// With button
<EmptyState 
  title="Tidak Ada Bimbingan"
  description="Belum ada data bimbingan"
  size="sm"
  showButton
  buttonText="Muat Ulang"
  buttonIcon={<RefreshCw className="w-4 h-4" />}
  onButtonClick={() => refetch()}
/>
```

### 2. NotFound

Komponen **pure/standalone** untuk menampilkan halaman 404 dengan animasi Lottie. Tidak memerlukan router atau layout global, semua handler diberikan via props.

#### Props

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `title` | `string` | `"Halaman Tidak Ditemukan"` | Judul error |
| `description` | `string` | `"Maaf, halaman yang Anda cari tidak dapat ditemukan."` | Deskripsi error |
| `showButtons` | `boolean` | `true` | Tampilkan tombol-tombol |
| `primaryButtonText` | `string` | `"Ke Dashboard"` | Text tombol utama |
| `secondaryButtonText` | `string` | `"Kembali"` | Text tombol sekunder |
| `onPrimaryClick` | `() => void` | `undefined` | Handler tombol utama |
| `onSecondaryClick` | `() => void` | `undefined` | Handler tombol sekunder |
| `primaryButtonIcon` | `ReactNode` | `undefined` | Icon tombol utama |
| `secondaryButtonIcon` | `ReactNode` | `undefined` | Icon tombol sekunder |

#### Penggunaan

```tsx
import NotFound from '@/components/ui/not-found';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

// Basic usage dengan custom handlers
const navigate = useNavigate();

<NotFound 
  onPrimaryClick={() => navigate('/dashboard')}
  onSecondaryClick={() => navigate(-1)}
/>

// Custom text dan icons
<NotFound 
  title="Data Tidak Ditemukan"
  description="Data yang Anda cari tidak tersedia"
  primaryButtonText="Beranda"
  secondaryButtonText="Kembali"
  primaryButtonIcon={<Home className="w-4 h-4" />}
  secondaryButtonIcon={<ArrowLeft className="w-4 h-4" />}
  onPrimaryClick={() => navigate('/dashboard')}
  onSecondaryClick={() => navigate(-1)}
/>

// Without buttons
<NotFound showButtons={false} />
```

### 3. NotFoundPage

Halaman 404 lengkap yang sudah terintegrasi dengan layout.

#### Penggunaan

```tsx
// Di App.tsx
<Route path="*" element={<NotFoundPage />} />
```

## Integrasi Otomatis

Komponen-komponen ini sudah terintegrasi secara otomatis di:

1. **CustomTable** - Menampilkan `EmptyState` ketika tidak ada data di tabel
2. **NotificationsSheet** - Menampilkan `EmptyState` ketika tidak ada notifikasi
3. **Supervisors Page** - Menampilkan `EmptyState` ketika tidak ada pembimbing
4. **App.tsx** - Route `*` menampilkan `NotFoundPage` untuk halaman yang tidak ditemukan

## File Animasi

Animasi Lottie disimpan di:
- `/src/assets/lottie/empty.json` - Animasi untuk empty state
- `/src/assets/lottie/404.json` - Animasi untuk 404 page

**Note:** File harus berada di `src` karena Vite tidak mengizinkan import langsung dari folder `public`.

## Dependencies

Komponen ini menggunakan:
- `lottie-react` v2.4.1 - Library untuk render animasi Lottie
- `react-router-dom` - Untuk navigasi (NotFound component)

## Styling

Komponen menggunakan Tailwind CSS dan mendukung dark mode secara otomatis.

### Size Classes (EmptyState)

- `sm`: 128px × 128px (w-32 h-32)
- `md`: 192px × 192px (w-48 h-48)
- `lg`: 256px × 256px (w-64 h-64)

### Responsive (NotFound)

- Mobile: 256px × 256px (w-64 h-64)
- Desktop: 320px × 320px (w-80 h-80)
