import { API_CONFIG, getApiUrl } from '@/config/api';
import { ENV } from '@/config/env';
import axios from 'axios';
import { apiRequest } from '../auth.service';

/**
 * Validate a field assessment token.
 * If pin is provided, it returns full data.
 */
export const validateFieldAssessmentToken = async (token: string, pin?: string) => {
    const url = pin 
        ? `${ENV.API_BASE_URL}/insternship/field-assessment/validate/${token}?pin=${pin}`
        : `${ENV.API_BASE_URL}/insternship/field-assessment/validate/${token}`;
    
    const response = await axios.get(url);
    return response.data;
};

/**
 * Verify PIN for field assessment.
 */
export const verifyFieldAssessmentPin = async (token: string, pin: string) => {
    const response = await axios.post(`${ENV.API_BASE_URL}/insternship/field-assessment/verify-pin/${token}`, { pin });
    return response.data;
};

/**
 * Submit field assessment scores and signature.
 */
export const submitFieldAssessment = async (token: string, data: { scores: any[]; signature: string }) => {
    const response = await axios.post(`${ENV.API_BASE_URL}/insternship/field-assessment/submit/${token}`, data);
    return response.data;
};

/**
 * Verify an internship letter or seminar minutes (public).
 */
export const verifyInternshipLetter = async (id: string, type: string) => {
    let url = `${ENV.API_BASE_URL}/insternship/public/verify-letter/${id}?type=${type}`;
    if (type === 'SEMINAR_MINUTES') {
        url = `${ENV.API_BASE_URL}/insternship/public/verify-seminar-minutes/${id}`;
    }
    const response = await axios.get(url);
    return response.data;
};

/**
 * Check the hash integrity of an uploaded PDF file.
 */
export const checkInternshipLetterHash = async (id: string, file: File, type: string) => {
    let url = `${ENV.API_BASE_URL}/insternship/public/verify-letter/${id}/check-hash?type=${type}`;
    if (type === 'SEMINAR_MINUTES') {
        url = `${ENV.API_BASE_URL}/insternship/public/verify-seminar-minutes/${id}/check-hash`;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Get seminar detail by ID.
 */
export const getSeminarDetail = async (id: string) => {
    const response = await apiRequest(`${getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_STUDENT.UPCOMING_SEMINARS)}/${id}`);
    return response.json();
};

/**
 * Get overview companies with optional search and limit.
 */
export const getOverviewCompanies = async (params?: { search?: string; limit?: number }) => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_OVERVIEW.COMPANIES);
    if (params) {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.limit) query.append('limit', params.limit.toString());
        const queryString = query.toString();
        if (queryString) url += `?${queryString}`;
    }
    const response = await apiRequest(url);
    return response.json();
};

/**
 * Get overview reports with optional search and limit.
 */
export const getOverviewReports = async (params?: { search?: string; limit?: number }) => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_OVERVIEW.REPORTS);
    if (params) {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.limit) query.append('limit', params.limit.toString());
        const queryString = query.toString();
        if (queryString) url += `?${queryString}`;
    }
    const response = await apiRequest(url);
    return response.json();
};

/**
 * Get overview stats.
 */
export const getOverviewStats = async () => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_OVERVIEW.STATS));
    return response.json();
};
