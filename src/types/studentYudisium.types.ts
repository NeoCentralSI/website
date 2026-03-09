export type StudentYudisiumChecklistItem = {
  label: string;
  met: boolean;
  current?: number;
  required?: number;
  submittedAt?: string | null;
  revisionFinalizedAt?: string | null;
  responseId?: string | null;
};

export type StudentYudisiumChecklist = {
  sks: StudentYudisiumChecklistItem;
  revisiSidang: StudentYudisiumChecklistItem;
  mataKuliahWajib: StudentYudisiumChecklistItem;
  mataKuliahMkwu: StudentYudisiumChecklistItem;
  mataKuliahKerjaPraktik: StudentYudisiumChecklistItem;
  mataKuliahKkn: StudentYudisiumChecklistItem;
  exitSurvey: StudentYudisiumChecklistItem;
};

export type StudentYudisiumRequirement = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  isUploaded: boolean;
  status: 'terunggah' | 'menunggu';
  submittedAt: string | null;
};

export type StudentYudisiumOverviewResponse = {
  yudisium: {
    id: string;
    name?: string | null;
    status: string;
    registrationOpenDate: string | null;
    registrationCloseDate: string | null;
    eventDate: string | null;
    exitSurveyForm: {
      id: string;
      name: string;
    } | null;
  } | null;
  thesis: {
    id: string;
    title: string;
  } | null;
  checklist: StudentYudisiumChecklist;
  allChecklistMet: boolean;
  requirements: StudentYudisiumRequirement[];
};
