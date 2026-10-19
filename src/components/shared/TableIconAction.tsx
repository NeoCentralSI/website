import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  default: '',
  /** Setujui / Terima, as on the seminar verification table. */
  approve: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
} as const;

/**
 * A row action as an icon with its tooltip, the style of
 * `AdminThesisSeminarVerificationTable`. A disabled action keeps its reason in the tooltip.
 */
export function TableIconAction({ icon: Icon, label, onClick, tone = 'default', disabled = false, disabledReason }: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: keyof typeof TONE_CLASS;
  disabled?: boolean;
  disabledReason?: string | null;
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', TONE_CLASS[tone])}
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
