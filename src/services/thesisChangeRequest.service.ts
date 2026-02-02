import { getApiUrl } from '@/config/api';

export interface ThesisChangeRequestApproval {
  id: string;
  lecturerId: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  createdAt: string;
  lecturer: {
    user: {
      id: string;
      fullName: string;
    };
  };
}

export interface ThesisChangeRequest {
  id: string;
  studentId: string;
  thesisId: string | null;
  requestType: 'topic' | 'supervisor' | 'both';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvals?: ThesisChangeRequestApproval[];
  // Direct student relation (persists even after thesis deleted)
  student?: {
    user: {
      id: string;
      fullName: string;
      identityNumber: string;
      email: string;
    };
  };
  thesis?: {
    id: string;
    title: string | null;
    thesisTopic?: {
      id: string;
      name: string;
    };
    thesisParticipants?: Array<{
      lecturer: {
        user: {
          id: string;
          fullName: string;
        };
      };
      role: {
        name: string;
      };
    }>;
  };
  reviewer?: {
    user: {
      id: string;
      fullName: string;
    };
  };
}

export interface SubmitChangeRequestDto {
  requestType: 'topic' | 'supervisor' | 'both';
  reason: string;
}

export interface ReviewRequestDto {
  reviewNotes?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
});

// Student APIs
export const submitChangeRequest = async (data: SubmitChangeRequestDto): Promise<ThesisChangeRequest> => {
  const response = await fetch(getApiUrl('/thesis-change-requests/submit'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengajukan permintaan');
  }

  const result = await response.json();
  return result.data;
};

export const getMyChangeRequests = async (): Promise<ThesisChangeRequest[]> => {
  const response = await fetch(getApiUrl('/thesis-change-requests/my-requests'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat permintaan');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Check if student has an approved change request where thesis was deleted
 */
export const checkApprovedWithDeletedThesis = async (): Promise<boolean> => {
  const response = await fetch(getApiUrl('/thesis-change-requests/check-approved'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memeriksa status');
  }

  const result = await response.json();
  return result.data.hasApprovedRequest;
};

// Kadep APIs
export const getPendingChangeRequests = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<ThesisChangeRequest>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.search) queryParams.append('search', params.search);

  const url = queryParams.toString()
    ? `/thesis-change-requests/pending?${queryParams}`
    : '/thesis-change-requests/pending';

  const response = await fetch(getApiUrl(url), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat permintaan');
  }

  return response.json();
};

export const getAllChangeRequests = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<ThesisChangeRequest>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);

  const url = queryParams.toString()
    ? `/thesis-change-requests/all?${queryParams}`
    : '/thesis-change-requests/all';

  const response = await fetch(getApiUrl(url), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat permintaan');
  }

  return response.json();
};

export const getPendingChangeRequestCount = async (): Promise<number> => {
  const response = await fetch(getApiUrl('/thesis-change-requests/pending-count'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat jumlah permintaan');
  }

  const result = await response.json();
  return result.data.count;
};

export const getChangeRequestById = async (id: string): Promise<ThesisChangeRequest> => {
  const response = await fetch(getApiUrl(`/thesis-change-requests/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat detail permintaan');
  }

  const result = await response.json();
  return result.data;
};

export const approveChangeRequest = async (id: string, data?: ReviewRequestDto): Promise<ThesisChangeRequest> => {
  const response = await fetch(getApiUrl(`/thesis-change-requests/${id}/approve`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menyetujui permintaan');
  }

  const result = await response.json();
  return result.data;
};

export const rejectChangeRequest = async (id: string, data: ReviewRequestDto): Promise<ThesisChangeRequest> => {
  const response = await fetch(getApiUrl(`/thesis-change-requests/${id}/reject`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menolak permintaan');
  }

  const result = await response.json();
  return result.data;
};
