import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';

const ENDPOINTS = API_CONFIG.ENDPOINTS.METOPEN;

/** Response GET /metopen/eligibility, backed by external SIA/devtools eligibility. */
export interface MetopelEligibility {
  eligibleMetopen: boolean | null;
  hasExternalStatus: boolean;
  hasMetopenCourse: boolean;
  canAccess: boolean;
  canSubmit: boolean;
  readOnly: boolean;
  thesisPhase: string | null;
  source: 'sia' | 'devtools' | null;
  updatedAt: string | null;
}

export const checkMetopelEligibility = async (): Promise<MetopelEligibility> => {
  const response = await apiRequest(getApiUrl(ENDPOINTS.ELIGIBILITY));
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Gagal memeriksa eligibilitas');
  }
  const result = await response.json();
  return result.data;
};
