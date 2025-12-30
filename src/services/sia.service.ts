import { getApiUrl } from '@/config/api';

export interface SiaCourse {
  code?: string;
  name?: string;
  credits?: number;
}

export interface SiaStudent {
  nim: string;
  name: string;
  sksCompleted: number;
  currentSemester?: number;
  currentSemesterCourses?: SiaCourse[];
}

export const getCachedStudentsFromSia = async (): Promise<SiaStudent[]> => {
  const response = await fetch(getApiUrl('/sia/cached'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data SIA');
  }

  const json = await response.json();
  return json?.data || [];
};
