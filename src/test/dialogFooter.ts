import { expect } from 'vitest';

/**
 * The footer buttons of a detail modal, in order (the first is Batal or Tutup),
 * all in one row, with the note (if any) as its own line above that row.
 */
export function footerButtons(dialog: HTMLElement): HTMLButtonElement[] {
  const close = [...dialog.querySelectorAll('button')].find((button) => /^(Batal|Tutup)$/.test(button.textContent ?? ''));
  if (!close) throw new Error('No Batal/Tutup button in the dialog footer');
  return [...close.parentElement!.querySelectorAll('button')] as HTMLButtonElement[];
}

export function expectFooter(dialog: HTMLElement, labels: string[], note?: string) {
  const buttons = footerButtons(dialog);
  expect(buttons.map((button) => button.textContent?.trim())).toEqual(labels);
  const row = buttons[0].parentElement!;
  expect(row.className).toContain('justify-end');
  if (note) {
    const line = [...row.parentElement!.children].find((child) => child !== row);
    expect(line?.tagName).toBe('P');
    expect(line).toHaveTextContent(note);
    // The note is above the row, not beside the buttons.
    expect(row.parentElement!.firstElementChild).toBe(line);
  }
  const reject = buttons.find((button) => /^Tolak/.test(button.textContent ?? ''));
  if (reject) expect(reject.className).toContain('bg-destructive');
}
