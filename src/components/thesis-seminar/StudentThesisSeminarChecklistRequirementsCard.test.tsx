import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StudentThesisSeminarChecklistRequirementsCard } from './StudentThesisSeminarChecklistRequirementsCard';
import { StudentThesisDefenceChecklistRequirementsCard } from '@/components/thesis-defence/StudentThesisDefenceChecklistRequirementsCard';

const reason = 'Anda tidak tercatat mengambil mata kuliah Tugas Akhir semester ini. Hubungi Admin Departemen bila ini keliru.';
const course = { met: false, label: 'Mengambil mata kuliah Tugas Akhir semester ini', reason };

describe('requirement lists show the Tugas Akhir course of the semester', () => {
  it('seminar: the row with its reason', () => {
    render(
      <StudentThesisSeminarChecklistRequirementsCard
        checklist={{
          bimbingan: { met: true, label: '8 Bimbingan', current: 8, required: 8 },
          kehadiran: { met: true, label: '8 Kehadiran Seminar', current: 8, required: 8 },
          metopen: { met: true, label: 'Lulus Mata Kuliah Metode Penelitian' },
          pembimbing: { met: true, label: 'Persetujuan Dosen Pembimbing' },
          mataKuliahTa: course,
        } as never}
      />,
    );
    expect(screen.getByText('Mengambil mata kuliah Tugas Akhir semester ini')).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('defence: the row, met', () => {
    render(
      <StudentThesisDefenceChecklistRequirementsCard
        checklist={{
          lulusSeminar: { met: true, label: 'Lulus Seminar Hasil' },
          sks: { met: true, label: 'Menyelesaikan Minimal 142 SKS', current: 142, required: 142 },
          revisiSeminar: { met: true, label: 'Menyelesaikan Revisi Seminar Hasil', total: 0, finished: 0, isVisible: false },
          pembimbing: { met: true, label: 'Persetujuan Dosen Pembimbing', supervisors: [] },
          mataKuliahTa: { ...course, met: true, reason: null },
        } as never}
      />,
    );
    expect(screen.getByText('Mengambil mata kuliah Tugas Akhir semester ini')).toBeInTheDocument();
    expect(screen.queryByText(reason)).not.toBeInTheDocument();
  });
});
