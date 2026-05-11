import { assessmentService, type RubricCriteriaItem } from './assessment.service';

export interface MetopenStudentGrading {
	thesisId: string;
	studentId: string;
	studentName: string;
	studentNim: string;
	supervisors: string;
	lecturerScore: number | null;
	supervisorScore: number | null;
	finalScore: number | null;
	isPassed: boolean | null;
	calculatedAt: string | null;
}

export type { RubricCriteriaItem };

export const metopenGradingService = {
	getClassSummary: async (classId: string): Promise<MetopenStudentGrading[]> => {
		void classId;
		throw new Error('Ringkasan kelas Metopen sudah tidak digunakan pada scope aktif SIMPTA');
	},

	getRubricCriteria: async (role: 'supervisor' | 'default'): Promise<RubricCriteriaItem[]> => {
		return assessmentService.getCriteria(role === 'supervisor' ? 'TA-03A' : 'TA-03B');
	},

	inputSupervisorScore: async (payload: {
		thesisId: string;
		score?: number;
		criteriaScores?: Array<{ criteriaId: string; rubricId?: string; score: number }>;
	}): Promise<{ message?: string }> => {
		if (!payload.criteriaScores?.length) {
			throw new Error('Penilaian TA-03A wajib memakai detail rubrik per kriteria');
		}
		await assessmentService.submitSupervisorScore(payload.thesisId, {
			scores: payload.criteriaScores,
		});
		return { message: 'Nilai TA-03A berhasil disimpan' };
	},

	inputLecturerScore: async (payload: {
		thesisId: string;
		score?: number;
		criteriaScores?: Array<{ criteriaId: string; rubricId?: string; score: number }>;
	}): Promise<{ message?: string }> => {
		if (!payload.criteriaScores?.length) {
			throw new Error('Penilaian TA-03B wajib memakai detail rubrik per kriteria');
		}
		await assessmentService.submitMetopenScore(payload.thesisId, {
			scores: payload.criteriaScores,
		});
		return { message: 'Nilai TA-03B berhasil disimpan' };
	},

	lockClassGrades: async (classId: string): Promise<{ message?: string }> => {
		void classId;
		throw new Error('Kunci nilai kelas Metopen sudah tidak digunakan pada scope aktif SIMPTA');
	},
};
