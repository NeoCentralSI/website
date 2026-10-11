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
