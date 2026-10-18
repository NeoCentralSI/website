import { getJson, send } from '@/services/thesis-proposal/api';

/** General proposal-phase milestone template (K18): no topic, managed by Sekdep and the coordinator (Paket P8). */
export interface ProposalMilestoneTemplate {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
  /** Milestones already created from this template. */
  usedCount: number;
  updatedAt: string;
}

export interface ProposalMilestoneTemplateInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  /** Paket P8: as on the thesis template form; empty = after the last one. */
  orderIndex?: number;
}

const BASE = '/research-method/milestone-templates';

export const listTemplates = () => getJson<ProposalMilestoneTemplate[]>(BASE, 'Gagal memuat template milestone proposal');
export const createTemplate = (dto: ProposalMilestoneTemplateInput) =>
  send<ProposalMilestoneTemplate>('POST', BASE, dto, 'Gagal menambah template');
export const updateTemplate = (id: string, dto: Partial<ProposalMilestoneTemplateInput>) =>
  send<ProposalMilestoneTemplate>('PATCH', `${BASE}/${id}`, dto, 'Gagal memperbarui template');
export const deleteTemplate = (id: string) => send<{ id: string }>('DELETE', `${BASE}/${id}`, undefined, 'Gagal menghapus template');
export const reorderTemplates = (templateIds: string[]) =>
  send<ProposalMilestoneTemplate[]>('PATCH', `${BASE}/reorder`, { templateIds }, 'Gagal menyimpan urutan');
