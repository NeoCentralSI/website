import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";

export interface InternshipHoliday {
    id: string;
    holidayDate: string;
    name: string | null;
    createdAt: string;
    updatedAt: string;
}

export const getHolidays = async (year?: string): Promise<{ success: boolean; data: InternshipHoliday[] }> => {
    const params = year ? `?year=${year}` : "";
    const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.HOLIDAYS}${params}`));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar hari libur" }));
        throw new Error(errorData.message || "Gagal memuat daftar hari libur");
    }
    return res.json();
};

export const createHoliday = async (data: { holidayDate: string; name?: string }): Promise<{ success: boolean; message: string; data: InternshipHoliday }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.HOLIDAYS), {
        method: "POST",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menambahkan hari libur" }));
        throw new Error(errorData.message || "Gagal menambahkan hari libur");
    }
    return res.json();
};

export const createManyHolidays = async (holidays: { holidayDate: string; name?: string }[]): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.HOLIDAYS}/bulk`), {
        method: "POST",
        body: JSON.stringify({ holidays }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menambahkan hari libur" }));
        throw new Error(errorData.message || "Gagal menambahkan hari libur");
    }
    return res.json();
};

export const updateHoliday = async (id: string, data: { holidayDate?: string; name?: string }): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.HOLIDAYS}/${id}`), {
        method: "PATCH",
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memperbarui hari libur" }));
        throw new Error(errorData.message || "Gagal memperbarui hari libur");
    }
    return res.json();
};

export const deleteHoliday = async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.INTERNSHIP_ADMIN.HOLIDAYS}/${id}`), {
        method: "DELETE",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal menghapus hari libur" }));
        throw new Error(errorData.message || "Gagal menghapus hari libur");
    }
    return res.json();
};
