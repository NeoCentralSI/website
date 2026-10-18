import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Paket P8 (1.1): the page title and subtitle at the top of the page, outside any card, as on
 * Permohonan, Perubahan and Evaluasi. The subtitle has no full stop at the end.
 */
export function PageHeading({ title, subtitle, children, className }: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Controls next to the title (e.g. a refresh button). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** A heading for a second table on the same page (Paket P8): outside the table's card. */
export function SectionHeading({ title, description, children }: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
