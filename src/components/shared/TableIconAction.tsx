import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A row action as an icon with its tooltip, the style of
 * `AdminThesisSeminarVerificationTable`. Every action is neutral: the text colour, orange on
 * hover (green is for status indicators only, e.g. a completed step or a "Lulus" badge). A
 * disabled action keeps its reason in the tooltip.
 */
export function TableIconAction({ icon: Icon, label, onClick, disabled = false, disabledReason, className }: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string | null;
  className?: string;
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', className)}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? undefined : label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
  if (!disabled) return button;
  // A disabled button gets no pointer events, so the tooltip sits on its wrapper.
  return (
    <span className="inline-flex" title={disabledReason ? `${label}: ${disabledReason}` : label}>
      {button}
    </span>
  );
}
