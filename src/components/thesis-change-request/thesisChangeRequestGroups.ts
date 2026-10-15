import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';

/** Requests of the same "Alihkan Mahasiswa" batch stay together; the rest stand alone. */
export function groupByBatch(requests: ThesisChangeRequest[]): { batchId: string | null; requests: ThesisChangeRequest[] }[] {
  const groups: { batchId: string | null; requests: ThesisChangeRequest[] }[] = [];
  for (const request of requests) {
    const existing = request.batchId ? groups.find((group) => group.batchId === request.batchId) : undefined;
    if (existing) existing.requests.push(request);
    else groups.push({ batchId: request.batchId, requests: [request] });
  }
  return groups;
}

/** "Judul lama → Judul baru; Pembimbing 2: A → B", for the table's summary column. */
export function summarizeChange(request: ThesisChangeRequest, formatName: (name: string | null | undefined) => string): string {
  const parts: string[] = [];
  if (request.title) parts.push(`${request.title.previous || '(belum ada judul)'} → ${request.title.next || '-'}`);
  if (request.supervisor) {
    const position = request.supervisor.position === 'pembimbing_2' ? 'Pembimbing 2' : 'Pembimbing 1';
    const before = request.supervisor.replaced ? formatName(request.supervisor.replaced.name) || '-' : '(belum ada)';
    parts.push(`${position}: ${before} → ${formatName(request.supervisor.next?.name) || '-'}`);
  }
  return parts.join('; ') || '-';
}
