import type { ComboboxOption } from '@/components/shared/SearchableCombobox';
import { formatLecturerName } from '@/lib/text';
import type { SupervisorOption } from '@/types/thesis-change-request.types';

/**
 * Paket E6 (4): lecturers for the searchable picker of "Alihkan Mahasiswa" and "Ajukan
 * Perubahan": searched by name or NIP, with the supervision load at the right ("7/10").
 */
export function toSupervisorComboboxOptions(options: SupervisorOption[]): ComboboxOption[] {
  return options.map((option) => ({
    value: option.id,
    label: formatLecturerName(option.name) || option.name,
    keywords: [option.name, option.identityNumber ?? ''],
    detail: option.load ? `${option.load.activeCount}/${option.load.quotaMax}${option.load.isFull ? ' · penuh' : ''}` : undefined,
  }));
}
