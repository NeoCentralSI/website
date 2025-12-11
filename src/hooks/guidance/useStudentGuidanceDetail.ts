import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  getStudentGuidanceDetail,
  rescheduleStudentGuidance,
  cancelStudentGuidance,
  updateStudentGuidanceNotes,
} from '@/services/studentGuidance.service';
import type { GuidanceItem } from '@/services/studentGuidance.service';

export function useStudentGuidanceDetail(guidanceId: string | undefined) {
  const [guidance, setGuidance] = useState<GuidanceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const load = async () => {
    if (!guidanceId) return;
    setIsLoading(true);
    try {
      const data = await getStudentGuidanceDetail(guidanceId);
      setGuidance(data.guidance);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat detail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidanceId]);

  const reschedule = async (data: { guidanceDate: string; studentNotes: string }) => {
    if (!guidanceId || !data.guidanceDate) {
      toast.error('Pilih waktu baru');
      return false;
    }
    try {
      await rescheduleStudentGuidance(guidanceId, data);
      toast.success('Jadwal diperbarui', { id: 'guidance-rescheduled' });
      load();
      qc.invalidateQueries({ queryKey: ['notification-unread'] });
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menjadwalkan ulang');
      return false;
    }
  };

  const cancel = async (data: { reason: string }) => {
    if (!guidanceId) return false;
    try {
      await cancelStudentGuidance(guidanceId, data);
      toast.success('Bimbingan dibatalkan', { id: 'guidance-cancelled' });
      qc.invalidateQueries({ queryKey: ['notification-unread'] });
      navigate('/tugas-akhir/bimbingan');
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Gagal membatalkan');
      return false;
    }
  };

  const updateNotes = async (data: { studentNotes: string }) => {
    if (!guidanceId) return false;
    try {
      await updateStudentGuidanceNotes(guidanceId, data);
      toast.success('Catatan diperbarui', { id: 'guidance-notes-updated' });
      load();
      qc.invalidateQueries({ queryKey: ['notification-unread'] });
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memperbarui catatan');
      return false;
    }
  };

  return {
    guidance,
    isLoading,
    reload: load,
    reschedule,
    cancel,
    updateNotes,
  };
}
