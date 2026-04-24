import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "@/services/auth.service";
import * as xlsx from "xlsx";
import { format } from "date-fns";

export type CplScoreSource = "SIA" | "manual" | "MANUAL";
export type CplScoreStatus = "calculated" | "verified" | "finalized";

export interface StudentCplScore {
    studentId: string;
    cplId: string;
    score: number;
    source: CplScoreSource;
    status: CplScoreStatus;
    inputBy: string | null;
    inputAt: string | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
    finalizedAt: string | null;
    updatedAt: string | null;
    student: {
        id: string;
        fullName: string | null;
        identityNumber: string | null;
        email: string | null;
    } | null;
    cpl: {
        id: string;
        code: string | null;
        description: string;
        minimalScore: number;
        isActive: boolean;
    } | null;
}

export interface StudentCplScoreFilters {
    studentId?: string;
    cplId?: string;
    source?: "SIA" | "MANUAL";
    status?: CplScoreStatus;
}

export interface CreateStudentCplScorePayload {
    studentId: string;
    cplId: string;
    score: number;
}

export interface UpdateStudentCplScorePayload {
    score: number;
}

export interface StudentCplImportFailedRow {
    row: number;
    studentId: string | null;
    cplCode: string | null;
    error: string;
}

export interface StudentCplImportResult {
    total: number;
    success: number;
    failed: number;
    failedRows: StudentCplImportFailedRow[];
}

export interface StudentCplImportRow {
    no?: number;
    nim: string;
    namaMahasiswa: string;
    kodeCpl: string;
    deskripsiCpl: string;
    minimalSkorCpl: number;
    skorCpl: number;
}

export interface StudentCplScoreOptions {
    students: Array<{
        id: string;
        fullName: string | null;
        identityNumber: string | null;
    }>;
    cpls: Array<{
        id: string;
        code: string | null;
        description: string;
        minimalScore: number;
        isActive: boolean;
    }>;
}

const buildQuery = (filters: StudentCplScoreFilters) => {
    const params = new URLSearchParams();
    if (filters.studentId) params.append("studentId", filters.studentId);
    if (filters.cplId) params.append("cplId", filters.cplId);
    if (filters.source) params.append("source", filters.source);
    if (filters.status) params.append("status", filters.status);
    return params.toString();
};

export const getStudentCplScores = async (
    filters: StudentCplScoreFilters
): Promise<{ data: StudentCplScore[]; total: number }> => {
    const query = buildQuery(filters);
    const endpoint = query
        ? `${API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE}?${query}`
        : API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE;
    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil data nilai CPL mahasiswa");
    }
    const result = await response.json();
    return { data: result.data ?? [], total: result.total ?? 0 };
};

export const getStudentCplScoreDetail = async (studentId: string, cplId: string): Promise<StudentCplScore> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BY_ID(studentId, cplId))
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil detail nilai CPL mahasiswa");
    }
    const result = await response.json();
    return result.data;
};

export const getStudentCplScoreOptions = async (): Promise<StudentCplScoreOptions> => {
    const response = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE}/options`));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil opsi mahasiswa dan CPL");
    }
    const result = await response.json();
    return result.data ?? { students: [], cpls: [] };
};

export const createStudentCplScore = async (
    payload: CreateStudentCplScorePayload
): Promise<StudentCplScore> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BASE), {
        method: "POST",
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menambahkan nilai CPL manual");
    }
    const result = await response.json();
    return result.data;
};

export const updateStudentCplScore = async (
    studentId: string,
    cplId: string,
    payload: UpdateStudentCplScorePayload
): Promise<StudentCplScore> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BY_ID(studentId, cplId)),
        {
            method: "PUT",
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengubah nilai CPL manual");
    }
    const result = await response.json();
    return result.data;
};

export const deleteStudentCplScore = async (studentId: string, cplId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.STUDENT_CPL_SCORE.BY_ID(studentId, cplId)),
        {
            method: "DELETE",
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus nilai CPL manual");
    }
};

const normalizeText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const mapSheetRows = (sheetRows: Record<string, unknown>[]): StudentCplImportRow[] => {
    return sheetRows.map((row) => ({
        no: Number(row["No"] ?? 0) || undefined,
        nim: String(row["NIM"] ?? "").trim(),
        namaMahasiswa: String(row["Nama Mahasiswa"] ?? "").trim(),
        kodeCpl: String(row["Kode CPL"] ?? "").trim(),
        deskripsiCpl: String(row["Deskripsi CPL"] ?? "").trim(),
        minimalSkorCpl: Number(row["Minimal Skor CPL"]),
        skorCpl: Number(row["Skor CPL"]),
    }));
};

export const parseStudentCplImportFile = async (file: File): Promise<StudentCplImportRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) return [];

    const worksheet = workbook.Sheets[firstSheet];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
    return mapSheetRows(rows);
};

export const importStudentCplScores = async (
    rows: StudentCplImportRow[],
    existingScores: StudentCplScore[],
    options: StudentCplScoreOptions
): Promise<StudentCplImportResult> => {
    const failedRows: StudentCplImportFailedRow[] = [];
    let success = 0;

    const existingByComposite = new Map<string, StudentCplScore>();
    const studentByNim = new Map<string, { id: string; name: string }>();
    const cplByIdentity = new Map<string, { id: string; description: string; minimalScore: number; isActive: boolean }>();

    for (const item of existingScores) {
        existingByComposite.set(`${item.studentId}::${item.cplId}`, item);
    }

    for (const student of options.students) {
        const nim = normalizeText(student.identityNumber);
        if (!nim || !student.fullName) continue;
        studentByNim.set(nim, {
            id: student.id,
            name: student.fullName,
        });
    }

    for (const cpl of options.cpls) {
        const code = normalizeText(cpl.code);
        if (!code) continue;
        const identityKey = `${code}::${normalizeText(cpl.description)}::${Number(cpl.minimalScore)}`;
        cplByIdentity.set(identityKey, {
            id: cpl.id,
            description: cpl.description,
            minimalScore: cpl.minimalScore,
            isActive: cpl.isActive,
        });
    }

    const seenInFile = new Set<string>();

    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 2;

        const nim = normalizeText(row.nim);
        const mahasiswa = normalizeText(row.namaMahasiswa);
        const kodeCpl = normalizeText(row.kodeCpl);
        const deskripsiCpl = normalizeText(row.deskripsiCpl);
        const minimalSkorCpl = Number(row.minimalSkorCpl);
        const skor = Number(row.skorCpl);

        if (!nim || !mahasiswa || !kodeCpl || !deskripsiCpl || Number.isNaN(minimalSkorCpl) || Number.isNaN(skor)) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim || null,
                cplCode: row.kodeCpl || null,
                error: "Kolom wajib harus terisi (NIM, Nama Mahasiswa, Kode CPL, Deskripsi CPL, Minimal Skor CPL, Skor CPL).",
            });
            continue;
        }

        if (skor < 0 || skor > 100) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error: "Skor CPL harus dalam rentang 0 sampai 100.",
            });
            continue;
        }

        const student = studentByNim.get(nim);
        if (!student) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error: "NIM tidak ditemukan pada data sistem.",
            });
            continue;
        }

        if (normalizeText(student.name) !== mahasiswa) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error: "Nama Mahasiswa tidak sesuai dengan NIM pada data sistem.",
            });
            continue;
        }

        const cplIdentityKey = `${kodeCpl}::${deskripsiCpl}::${minimalSkorCpl}`;
        const cpl = cplByIdentity.get(cplIdentityKey);
        if (!cpl) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error: "Identitas CPL tidak cocok (Kode, Deskripsi, atau Minimal Skor CPL tidak sesuai data sistem).",
            });
            continue;
        }

        const compositeKey = `${student.id}::${cpl.id}`;
        if (seenInFile.has(compositeKey)) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error: "Duplikasi pasangan mahasiswa dan CPL pada file import.",
            });
            continue;
        }

        const existing = existingByComposite.get(compositeKey);
        if (existing) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error:
                    String(existing.source).toUpperCase() === "SIA"
                        ? "Data sudah ada dari sumber SIA dan tidak boleh dioverride."
                        : "Data manual untuk mahasiswa dan CPL ini sudah ada.",
            });
            continue;
        }

        try {
            await createStudentCplScore({
                studentId: student.id,
                cplId: cpl.id,
                score: skor,
            });
            success += 1;
            seenInFile.add(compositeKey);
        } catch (error) {
            failedRows.push({
                row: rowNumber,
                studentId: row.nim,
                cplCode: row.kodeCpl,
                error: error instanceof Error ? error.message : "Gagal menyimpan data.",
            });
        }
    }

    return {
        total: rows.length,
        success,
        failed: failedRows.length,
        failedRows,
    };
};

export const downloadStudentCplTemplate = async () => {
    const templateRows = [
        {
            No: 1,
            NIM: "2111521001",
            "Nama Mahasiswa": "Budi Santoso",
            "Kode CPL": "CPL-01",
            "Deskripsi CPL": "Mampu menerapkan konsep dasar keilmuan secara tepat.",
            "Minimal Skor CPL": 60,
            "Skor CPL": 80,
        },
    ];

    const headers = ["No", "NIM", "Nama Mahasiswa", "Kode CPL", "Deskripsi CPL", "Minimal Skor CPL", "Skor CPL"];
    const worksheet = xlsx.utils.json_to_sheet(templateRows, { header: headers });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Template Import Nilai CPL");
    worksheet["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 42 }, { wch: 16 }, { wch: 10 }];
    xlsx.writeFile(workbook, "Template_Import_Nilai_CPL_Mahasiswa.xlsx");
};

export const exportStudentCplScores = async (data: StudentCplScore[]) => {
    const rows = data.map((item, index) => ({
        No: index + 1,
        NIM: item.student?.identityNumber ?? "-",
        "Nama Mahasiswa": item.student?.fullName ?? "-",
        "Kode CPL": item.cpl?.code ?? "-",
        "Deskripsi CPL": item.cpl?.description ?? "-",
        "Skor CPL": item.score,
        Sumber: String(item.source).toUpperCase() === "SIA" ? "SIA" : "MANUAL",
        Status:
            item.status === "calculated"
                ? "Dihitung"
                : item.status === "verified"
                ? "Diverifikasi"
                : "Final",
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Nilai CPL Mahasiswa");
    worksheet["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 48 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
    xlsx.writeFile(workbook, `Nilai_CPL_Mahasiswa_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
};
