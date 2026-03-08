import { getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

export interface MetopenStudentGrading {
	thesisId: string;
	studentId: string;
	studentName: string;
	studentNim: string;
	supervisors: string;
	lecturerScore: number;
	supervisorScore: number | null;
	finalScore: number | null;
	isPassed: boolean | null;
	calculatedAt: string | null;
}

async function parseGradingResponse<T>(response: Response): Promise<{ data: T; message?: string }> {
	if (!response.ok) {
		const err = await response.json().catch(() => ({ message: 'Request gagal' }));
		throw new Error(err.message || `Request gagal (${response.status})`);
	}
	return response.json();
}

export const metopenGradingService = {
	getClassSummary: async (classId: string): Promise<MetopenStudentGrading[]> => {
		const url = getApiUrl(`/metopen/grading/class/${classId}`);
		const response = await apiRequest(url);
		const result = await parseGradingResponse<MetopenStudentGrading[]>(response);
		return result.data;
	},

	inputSupervisorScore: async (payload: { thesisId: string; score: number }): Promise<{ message?: string }> => {
		const url = getApiUrl('/metopen/grading/supervisor-score');
		const response = await apiRequest(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		return parseGradingResponse<unknown>(response);
	},

	lockClassGrades: async (classId: string): Promise<{ message?: string }> => {
		const url = getApiUrl(`/metopen/grading/class/${classId}/lock`);
		const response = await apiRequest(url, { method: 'POST' });
		return parseGradingResponse<unknown>(response);
	},
};
