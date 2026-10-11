import { DownloadIcon, FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateShortId, formatDateTimeWib } from '@/lib/text';

/** Kolom Aksi menempel di kanan (pengaman di layar sempit), tanpa mengubah komponen tabel. */
export const STICKY_ACTION_COLUMN_CLASS = 'sticky right-0 z-10 bg-background shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.12)]';

/** Tanggal lalu jam di baris kedua: "14 Oktober 2026" / "14.00 WIB". */
export function DateTimeCell({ date }: { date?: string | Date | null }) {
  const full = formatDateTimeWib(date);
  if (full === '-') return <span className="text-muted-foreground">-</span>;
  const day = formatDateShortId(date);
  return (
    <div className="leading-tight" title={full}>
      <div className="whitespace-nowrap">{day}</div>
      <div className="whitespace-nowrap text-xs text-muted-foreground">{full.slice(day.length).trim()}</div>
    </div>
  );
}

/** Teks panjang dipotong (maks. dua baris); teks lengkap di tooltip. */
export function TruncatedText({ text, className = 'max-w-[200px]' }: { text?: string | null; className?: string }) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={`block whitespace-normal break-words line-clamp-2 text-sm ${className}`} title={value}>
      {value}
    </span>
  );
}

interface GuidanceDocCellProps {
  filePath?: string | null;
  /** Nama lengkap berkas untuk tooltip. */
  displayName: string;
  /** PDF: pratinjau di dialog halaman. Berkas lain diunduh lewat header Authorization. */
  onViewPdf?: () => void;
}

/** Ikon berkas + nama terpotong pendek. Tidak pernah menaruh token di URL. */
export function GuidanceDocCell({ filePath, displayName, onViewPdf }: GuidanceDocCellProps) {
  if (!filePath) return <span className="text-muted-foreground">-</span>;
  const lower = filePath.toLowerCase();
  const isPdf = lower.endsWith('.pdf');
  const isWord = lower.endsWith('.docx') || lower.endsWith('.doc');
  if (!isPdf && !isWord) return <span className="text-muted-foreground">-</span>;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 max-w-[130px] gap-1.5 px-2 ${isWord ? 'text-green-600 hover:bg-green-50 hover:text-green-700' : ''}`}
      onClick={() => (isPdf && onViewPdf ? onViewPdf() : void openAuthenticatedFileOrToast(filePath))}
      title={`${isPdf ? 'Lihat' : 'Unduh'} ${displayName}`}
    >
      {isPdf ? <FileTextIcon className="size-4 shrink-0" /> : <DownloadIcon className="size-4 shrink-0" />}
      <span className="truncate text-xs">{displayName}</span>
    </Button>
  );
}
