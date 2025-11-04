# Master Data Components

Folder ini berisi komponen-komponen yang digunakan khusus untuk halaman Master Data.

## Komponen

### UserFormDialog
Dialog form untuk membuat dan mengedit user.

**Props:**
- `open: boolean` - Status dialog terbuka/tertutup
- `onOpenChange: (open: boolean) => void` - Handler untuk mengubah status dialog
- `editingUser: User | null` - Data user yang sedang diedit (null jika create mode)
- `formData: CreateUserRequest | UpdateUserRequest` - Data form
- `setFormData: (data) => void` - Handler untuk mengubah data form
- `onSubmit: (e: React.FormEvent) => void` - Handler submit form
- `roleOptions: Array<{ value: string; label: string }>` - Opsi role yang tersedia

### ImportStudentDialog
Dialog untuk import mahasiswa dari file CSV.

**Props:**
- `open: boolean` - Status dialog terbuka/tertutup
- `onOpenChange: (open: boolean) => void` - Handler untuk mengubah status dialog
- `selectedFile: File | null` - File CSV yang dipilih
- `onFileChange: (file: File | null) => void` - Handler untuk mengubah file
- `onImport: () => void` - Handler untuk proses import

### AcademicYearFormDialog
Dialog form untuk membuat dan mengedit tahun ajaran.

**Props:**
- `open: boolean` - Status dialog terbuka/tertutup
- `onOpenChange: (open: boolean) => void` - Handler untuk mengubah status dialog
- `editingYear: AcademicYear | null` - Data tahun ajaran yang sedang diedit (null jika create mode)
- `formData: CreateAcademicYearRequest | UpdateAcademicYearRequest` - Data form
- `setFormData: (data) => void` - Handler untuk mengubah data form
- `onSubmit: (e: React.FormEvent) => void` - Handler submit form

## Usage

```tsx
import { UserFormDialog, ImportStudentDialog, AcademicYearFormDialog } from '@/components/master-data';

// Di dalam component
<UserFormDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  editingUser={editingUser}
  formData={formData}
  setFormData={setFormData}
  onSubmit={handleSubmit}
  roleOptions={roleOptions}
/>
```

## Struktur Folder

```
src/components/master-data/
├── index.ts                    # Export semua komponen
├── UserFormDialog.tsx          # Dialog form user
├── ImportStudentDialog.tsx     # Dialog import CSV
├── AcademicYearFormDialog.tsx  # Dialog form tahun ajaran
└── README.md                   # Dokumentasi ini
```

## Keuntungan Refactoring

1. **Separation of Concerns**: Komponen dialog terpisah dari logic halaman
2. **Reusability**: Komponen dapat digunakan kembali di halaman lain
3. **Maintainability**: Lebih mudah untuk maintain dan update
4. **Testing**: Lebih mudah untuk unit testing
5. **Clean Code**: File halaman lebih bersih dan fokus pada business logic
