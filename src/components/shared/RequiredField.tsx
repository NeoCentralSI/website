import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

/** The red asterisk of a required field. */
export function RequiredMark() {
  return <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>;
}

/** A field label, with the red asterisk when the field is required. */
export function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: ReactNode }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <RequiredMark />}
    </Label>
  );
}

/** The message under a field that is still missing or invalid. */
export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) return null;
  return <p id={id} role="alert" className="text-xs text-destructive">{message}</p>;
}

/**
 * Required fields are checked when the send button is clicked (the button is not disabled for
 * empty fields): the first missing field, in `order`, is scrolled into view and focused.
 * `order` lists element ids; the field's container may carry the id instead of the input.
 */
export function focusFirstInvalid(order: string[], errors: Record<string, string | null | undefined>) {
  const first = order.find((id) => errors[id]);
  if (!first) return;
  const element = document.getElementById(first);
  if (!element) return;
  element.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  const focusable = element.matches('input, textarea, button, [tabindex]')
    ? element
    : element.querySelector<HTMLElement>('input, textarea, button, [tabindex]');
  focusable?.focus({ preventScroll: true });
}
