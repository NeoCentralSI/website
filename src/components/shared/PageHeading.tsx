import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The page title and subtitle at the top of the page, outside any card, as on
 * Permohonan, Perubahan and Evaluasi. The subtitle has no full stop at the end.
 */
export function PageHeading({ title, subtitle, children, className, backTo, backLabel = 'Kembali' }: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Controls next to the title (e.g. a refresh button). */
  children?: ReactNode;
  className?: string;
  /** A back button left of the title, as on the student Exit Survey page. */
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backTo && (
          <Button variant="outline" size="icon" asChild className="mt-0.5 shrink-0">
            <Link to={backTo} aria-label={backLabel} title={backLabel}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/** A heading for a second table on the same page: outside the table's card. */
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
