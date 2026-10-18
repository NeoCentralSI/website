import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/research-method/milestone-template.service';
import type { ProposalMilestoneTemplateInput } from '@/services/research-method/milestone-template.service';

export const proposalTemplateKeys = { all: ['research-method', 'milestone-templates'] as const };

export function useProposalMilestoneTemplates() {
  return useQuery({ queryKey: proposalTemplateKeys.all, queryFn: service.listTemplates });
}

/** Every write refreshes the list and the templates a student picks from. */
export function useProposalMilestoneTemplateMutations() {
  const queryClient = useQueryClient();
  const done = (message?: string) => {
    if (message) toast.success(message);
    queryClient.invalidateQueries({ queryKey: proposalTemplateKeys.all });
    queryClient.invalidateQueries({ queryKey: ['milestones', 'templates'] });
  };
  const fail = (error: Error) => toast.error(error.message);
  return {
    create: useMutation({ mutationFn: (dto: ProposalMilestoneTemplateInput) => service.createTemplate(dto), onSuccess: (r) => done(r.message), onError: fail }),
    update: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: Partial<ProposalMilestoneTemplateInput> }) => service.updateTemplate(id, dto),
      onSuccess: (r) => done(r.message),
      onError: fail,
    }),
    remove: useMutation({ mutationFn: (id: string) => service.deleteTemplate(id), onSuccess: (r) => done(r.message), onError: fail }),
    /** Paket P8: "Hapus (n)" of the shared template panel, one after another, one message. */
    removeMany: useMutation({
      mutationFn: async (ids: string[]) => {
        for (const id of ids) await service.deleteTemplate(id);
        return ids.length;
      },
      onSuccess: (count) => done(`${count} template milestone berhasil dihapus`),
      onError: (error: Error) => {
        fail(error);
        done();
      },
    }),
    reorder: useMutation({ mutationFn: (ids: string[]) => service.reorderTemplates(ids), onSuccess: () => done(), onError: fail }),
  };
}
