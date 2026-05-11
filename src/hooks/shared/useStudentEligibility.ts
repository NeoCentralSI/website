import { useQuery } from "@tanstack/react-query";
import { getCachedStudentsFromSia } from "@/services/sia.service";
import { checkMetopelEligibility } from "@/services/metopen.service";
import { useAuth } from "@/hooks/shared";

/**
 * Snapshot eligibility mahasiswa lintas modul (KP, TA, Metopel).
 *
 * Sumber kebenaran (KONTEKS_KANONIS_SIMPTA.md v2.0 §5.1 + §5.8):
 * - Metopel: snapshot eksternal `students.eligible_metopen` dari SIA.
 * - Tugas Akhir penuh: snapshot eksternal `students.taking_thesis_course` dari SIA.
 *
 * BR-25: Gate Tugas Akhir TIDAK boleh memakai SKS hard-code (`sks >= 110`).
 * Akses TA ditentukan murni oleh `taking_thesis_course = true` yang sudah
 * dipersist di profil mahasiswa. Frontend tidak menebak dari nama mata kuliah
 * di cache SIA karena cache itu hanya dipakai untuk konteks non-SIMPTA seperti KP.
 *
 * Catatan: KP tetap mempertahankan baseline `sks >= 90` karena modul KP
 * di luar scope SIMPTA dan belum punya snapshot eksternal yang setara.
 */
export interface EligibilityResult {
  isLoading: boolean;
  sks: number;
  hasTugasAkhirCourse: boolean;
  canAccessKerjaPraktek: boolean;
  canAccessTugasAkhir: boolean;
  canAccessMetopel: boolean;
  /** True jika proposal sudah dikunci (proposalStatus = "accepted"); UI Metopen masuk mode arsip read-only. */
  isMetopenReadOnly: boolean;
  requirements: {
    kerjaPraktek: {
      sks: { met: boolean; current: number; required: number };
    };
    tugasAkhir: {
      course: { met: boolean; description: string };
    };
    metopel: {
      eligibility: { met: boolean; description: string };
    };
  };
}

export function useStudentEligibility(): EligibilityResult {
  const { user: authUser } = useAuth();
  const nim = authUser?.identityNumber;

  const { data: siaStudents, isLoading: siaLoading } = useQuery({
    queryKey: ["sia-cached-students"],
    queryFn: getCachedStudentsFromSia,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
  });

  const { data: metopelEligibility, isLoading: metopelLoading } = useQuery({
    queryKey: ["metopel-eligibility"],
    queryFn: checkMetopelEligibility,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
  });

  const siaStudent = siaStudents?.find((s) => s.nim === nim);
  const sks = siaStudent?.sksCompleted ?? authUser?.student?.sksCompleted ?? 0;
  const takingThesisCourse = authUser?.student?.takingThesisCourse ?? null;
  const hasTugasAkhirCourse = takingThesisCourse === true;

  const eligibleMetopen = metopelEligibility?.eligibleMetopen ?? null;
  const canAccessMetopel = metopelEligibility?.canAccess ?? false;
  const isMetopenReadOnly = metopelEligibility?.readOnly ?? false;

  const canAccessKerjaPraktek = sks >= 90;
  // BR-25 (canon §5.8 + §5.1): TA-04 / TA penuh hanya bergantung snapshot SIA
  // `taking_thesis_course`. Hilangkan filter `sks >= 110` agar tidak menolak
  // mahasiswa yang sah ambil MK TA tapi SKS-nya kurang menurut snapshot
  // (kasus: mahasiswa transferan, snapshot stale, dst).
  const canAccessTugasAkhir = hasTugasAkhirCourse;

  const metopelDescription =
    eligibleMetopen === true
      ? "SIA sudah mengonfirmasi Anda layak mengikuti Metode Penelitian."
      : eligibleMetopen === false
        ? "SIA menyatakan Anda belum layak mengikuti Metode Penelitian semester ini."
        : "Snapshot eligibility dari SIA belum tersedia. Hubungi admin untuk sinkronisasi.";

  const tugasAkhirCourseDescription = hasTugasAkhirCourse
    ? "Mata kuliah Tugas Akhir tercatat di snapshot resmi mahasiswa."
    : takingThesisCourse === false
      ? "Snapshot resmi mahasiswa belum mencatat Anda mengambil mata kuliah Tugas Akhir."
      : "Snapshot resmi mata kuliah Tugas Akhir belum tersedia. Hubungi admin untuk sinkronisasi.";

  return {
    isLoading: siaLoading || metopelLoading,
    sks,
    hasTugasAkhirCourse,
    canAccessKerjaPraktek,
    canAccessTugasAkhir,
    canAccessMetopel,
    isMetopenReadOnly,
    requirements: {
      kerjaPraktek: {
        sks: { met: sks >= 90, current: sks, required: 90 },
      },
      tugasAkhir: {
        course: { met: hasTugasAkhirCourse, description: tugasAkhirCourseDescription },
      },
      metopel: {
        eligibility: { met: canAccessMetopel, description: metopelDescription },
      },
    },
  };
}
