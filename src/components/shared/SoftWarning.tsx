import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * A warning of medium weight (e.g. the chosen lecturer is full): the soft yellow box of the
 * student Bimbingan page (`PendingRequestAlert`), never plain text on white.
 */
export function SoftWarning({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div role="note" className={cn('rounded-lg border border-amber-200 bg-amber-50 p-3', className)}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1 text-sm text-amber-800">
          {title && <p className="mb-0.5 font-semibold text-amber-900">{title}</p>}
          <div className="whitespace-pre-line">{children}</div>
        </div>
      </div>
    </div>
  );
}
