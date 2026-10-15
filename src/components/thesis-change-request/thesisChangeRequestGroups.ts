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

export type ChangeRequestScope = 'awaitingMe' | 'inProgress' | 'history';

function uniqueById(requests: ThesisChangeRequest[]): ThesisChangeRequest[] {
  const seen = new Set<string>();
  return requests.filter((request) => (seen.has(request.id) ? false : (seen.add(request.id), true)));
}

/**
 * Paket E4 (4.2): one list per status filter of the Perubahan page. "Menunggu Saya" holds the
 * requests at the viewer's lecturer step and, for the Ketua Departemen, those at the department
 * step; "Sedang Berjalan" the other open requests; "Riwayat" the closed ones, newest first.
 */
export function splitChangeRequests(input: {
  lecturer?: { awaitingMe: ThesisChangeRequest[]; inProgress: ThesisChangeRequest[]; history: ThesisChangeRequest[] } | null;
  departmentPending?: ThesisChangeRequest[] | null;
  departmentHistory?: ThesisChangeRequest[] | null;
}): Record<ChangeRequestScope, ThesisChangeRequest[]> {
  const departmentPending = input.departmentPending ?? [];
  const awaitingMe = uniqueById([
    ...departmentPending.filter((request) => request.currentStep === 'kadep' || request.viewer.canDecideAsLecturer),
    ...(input.lecturer?.awaitingMe ?? []),
  ]);
  const waitingIds = new Set(awaitingMe.map((request) => request.id));
  const inProgress = uniqueById([...departmentPending, ...(input.lecturer?.inProgress ?? [])]).filter((request) => !waitingIds.has(request.id));
  const closedAt = (request: ThesisChangeRequest) => new Date(request.decision?.at ?? request.createdAt).getTime();
  const history = uniqueById([...(input.departmentHistory ?? []), ...(input.lecturer?.history ?? [])]).sort((a, b) => closedAt(b) - closedAt(a));
  return { awaitingMe, inProgress, history };
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
