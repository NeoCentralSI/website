import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** New results are on their way: a small spinner in the box, nothing else moves. */
  isSearching?: boolean;
  className?: string;
}

/**
 * Search box of a server-side search. The input stays mounted and keeps its own text
 * while results arrive, so focus and typing are never interrupted.
 */
export function SearchField({ value, onChange, placeholder = 'Cari...', isSearching, className }: SearchFieldProps) {
  return (
    <div className={cn('relative w-full sm:max-w-md', className)}>
      <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder={placeholder} className="pl-8 pr-8" value={value} onChange={(e) => onChange(e.target.value)} />
      {isSearching && (
        <Spinner
          role="status"
          aria-label="Memuat hasil pencarian"
          className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      )}
    </div>
  );
}

/** Rows of the previous result stay visible, slightly dimmed, while the new ones load. */
export const STALE_RESULT_CLASS = 'opacity-60 transition-opacity';
