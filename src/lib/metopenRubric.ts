/**
 * Konstanta rubrik resmi TA-03A (Penilaian Pembimbing) dan TA-03B (Koordinator Metopen).
 *
 * Sumber:
 * - guide/TA-03 A_PENILAIAN PROPOSAL TUGAS AKHIR OLEH PEMBIMBING_FIX.pdf
 * - guide/TA-03 B_PENILAIAN PROPOSAL TUGAS AKHIR OLEH PENGAMPU MATA KULIAH METODE PENELITIAN_FIX.pdf
 *
 * Catatan kontrak DB:
 * - Backend (`services/src/services/assessment.service.js`) menerima 1 score
 *   integer per `assessmentCriteriaId`, dengan validasi `score <= maxScore`
 *   dan rubricId wajib bila kriteria punya `assessmentRubrics`.
 * - Saat ini DB hanya menyimpan 4 `AssessmentCriteria` (Presentasi 20,
 *   Konten 40, Struktur 25, Respon 15) tanpa `AssessmentRubric` record.
 * - File ini menyediakan rubrik level deskriptif sebagai *UI hint* dan
 *   sub-kriteria CPMK-02 (4 × 0-10) sebagai breakdown UI yang dijumlahkan
 *   menjadi 1 score 0-40 sebelum submit. Sub-rubrik tidak dipersist ke DB
 *   (DB tetap simpan 1 row scalar untuk kriteria parent "Konten").
 */

export type RubricLevelTier = "very-low" | "low" | "fair" | "good" | "excellent";

export interface RubricLevel {
    /** Tier kualitas (warna + label visual). */
    tier: RubricLevelTier;
    /** Label level singkat (mis. "Sangat baik"). */
    label: string;
    /** Range skor inklusif. */
    minScore: number;
    maxScore: number;
    /** Deskripsi resmi 1 kalimat penuh dari form TA-03 PDF. */
    description: string;
}

export interface SubCriterion {
    /** Kunci stabil utk state UI (tidak dipersist). */
    key: string;
    /** Label sub (mis. "(a) Pendahuluan"). */
    label: string;
    /** Penjelasan singkat fokus penilaian sub-kriteria. */
    helper: string;
    /** Range skor: 0..maxScore (umumnya 10 untuk CPMK-02 supervisor). */
    maxScore: number;
    levels: RubricLevel[];
}

const TIER_META: Record<RubricLevelTier, { label: string; chipClassName: string; rowClassName: string }> = {
    "very-low": {
        label: "Sangat kurang",
        chipClassName: "border-rose-300 bg-rose-100 text-rose-800",
        rowClassName: "data-[selected=true]:border-rose-400 data-[selected=true]:bg-rose-50/80 data-[selected=true]:ring-rose-300",
    },
    low: {
        label: "Kurang",
        chipClassName: "border-orange-300 bg-orange-100 text-orange-800",
        rowClassName: "data-[selected=true]:border-orange-400 data-[selected=true]:bg-orange-50/80 data-[selected=true]:ring-orange-300",
    },
    fair: {
        label: "Cukup",
        chipClassName: "border-amber-300 bg-amber-100 text-amber-800",
        rowClassName: "data-[selected=true]:border-amber-400 data-[selected=true]:bg-amber-50/80 data-[selected=true]:ring-amber-300",
    },
    good: {
        label: "Baik",
        chipClassName: "border-sky-300 bg-sky-100 text-sky-800",
        rowClassName: "data-[selected=true]:border-sky-400 data-[selected=true]:bg-sky-50/80 data-[selected=true]:ring-sky-300",
    },
    excellent: {
        label: "Sangat baik",
        chipClassName: "border-emerald-300 bg-emerald-100 text-emerald-800",
        rowClassName: "data-[selected=true]:border-emerald-400 data-[selected=true]:bg-emerald-50/80 data-[selected=true]:ring-emerald-300",
    },
};

export function getTierMeta(tier: RubricLevelTier) {
    return TIER_META[tier];
}

// ────────────────────────────────────────────────────────────
// TA-03A — Pembimbing
// ────────────────────────────────────────────────────────────

/** CPMK-01 Presentasi lisan (0-20). */
export const TA03A_PRESENTASI_LEVELS: RubricLevel[] = [
    {
        tier: "very-low",
        label: "Sangat kurang",
        minScore: 0,
        maxScore: 4,
        description:
            "Menyampaikan secara tidak lengkap, alur tidak jelas, tidak menggunakan bahasa akademik, dan tidak memahami isi proposal.",
    },
    {
        tier: "low",
        label: "Kurang",
        minScore: 5,
        maxScore: 8,
        description:
            "Menyampaikan dengan banyak kekurangan, alur tidak runtut, bahasa kurang akademik, dan pemahaman rendah.",
    },
    {
        tier: "fair",
        label: "Cukup",
        minScore: 9,
        maxScore: 12,
        description:
            "Menyampaikan komponen utama secara cukup jelas, struktur cukup logis, penggunaan istilah umum, pemahaman cukup.",
    },
    {
        tier: "good",
        label: "Baik",
        minScore: 13,
        maxScore: 16,
        description:
            "Menyampaikan semua isi dengan baik, struktur presentasi logis, bahasa formal, dan menunjukkan penguasaan.",
    },
    {
        tier: "excellent",
        label: "Sangat baik",
        minScore: 17,
        maxScore: 20,
        description:
            "Menyampaikan seluruh isi proposal secara lengkap, runtut, akademik, menggunakan istilah teknis yang tepat, dan menunjukkan pemahaman mendalam.",
    },
];

/** CPMK-02 Penulisan sistematis — 4 sub-kriteria × 0-10 = 40 total. */
export const TA03A_KONTEN_SUB_CRITERIA: SubCriterion[] = [
    {
        key: "pendahuluan",
        label: "(a) Pendahuluan",
        helper: "Latar belakang, rumusan masalah, dan tujuan penelitian.",
        maxScore: 10,
        levels: [
            {
                tier: "very-low",
                label: "Sangat kurang",
                minScore: 0,
                maxScore: 2,
                description:
                    "Latar belakang tidak logis, rumusan masalah tidak sistematis, dan tujuan tidak relevan.",
            },
            {
                tier: "low",
                label: "Kurang",
                minScore: 3,
                maxScore: 4,
                description:
                    "Latar belakang lemah, rumusan masalah tidak terarah, tujuan masih umum.",
            },
            {
                tier: "fair",
                label: "Cukup",
                minScore: 5,
                maxScore: 6,
                description:
                    "Latar belakang cukup logis, rumusan masalah dan tujuan cukup sesuai.",
            },
            {
                tier: "good",
                label: "Baik",
                minScore: 7,
                maxScore: 8,
                description:
                    "Latar belakang dan tujuan jelas, rumusan masalah sistematis dan mendukung tujuan.",
            },
            {
                tier: "excellent",
                label: "Sangat baik",
                minScore: 9,
                maxScore: 10,
                description:
                    "Semua komponen disajikan sangat baik, logis, terstruktur, dan saling mendukung.",
            },
        ],
    },
    {
        key: "kajian-literatur",
        label: "(b) Kajian Literatur",
        helper: "Relevansi, kebaruan, sistematika, dan analisis referensi.",
        maxScore: 10,
        levels: [
            {
                tier: "very-low",
                label: "Sangat kurang",
                minScore: 0,
                maxScore: 2,
                description:
                    "Referensi sangat terbatas, tidak relevan, tidak sistematis, dan tidak terhubung dengan topik.",
            },
            {
                tier: "low",
                label: "Kurang",
                minScore: 3,
                maxScore: 4,
                description:
                    "Referensi terbatas, sebagian relevan, ringkasan kurang jelas, dan keterkaitan lemah.",
            },
            {
                tier: "fair",
                label: "Cukup",
                minScore: 5,
                maxScore: 6,
                description:
                    "Referensi cukup, relevansi dan sistematika cukup, analisis cukup terhubung dengan topik.",
            },
            {
                tier: "good",
                label: "Baik",
                minScore: 7,
                maxScore: 8,
                description:
                    "Referensi beragam, relevan, sistematis, dan analisis jelas mengarah pada topik.",
            },
            {
                tier: "excellent",
                label: "Sangat baik",
                minScore: 9,
                maxScore: 10,
                description:
                    "Referensi sangat beragam dan relevan, sistematika kajian sangat baik, dan analisis sangat kuat mendukung topik.",
            },
        ],
    },
    {
        key: "metodologi",
        label: "(c) Metodologi Penelitian",
        helper: "Rancangan, tools/metode, dan ketepatan analisis.",
        maxScore: 10,
        levels: [
            {
                tier: "very-low",
                label: "Sangat kurang",
                minScore: 0,
                maxScore: 2,
                description:
                    "Rancangan tidak sesuai, tools/metode tidak tepat, dan metode analisis tidak jelas.",
            },
            {
                tier: "low",
                label: "Kurang",
                minScore: 3,
                maxScore: 4,
                description:
                    "Rancangan kurang sesuai, pemilihan metode tidak relevan, dan analisis kurang tepat.",
            },
            {
                tier: "fair",
                label: "Cukup",
                minScore: 5,
                maxScore: 6,
                description:
                    "Rancangan cukup sesuai, tools/metode cukup relevan, dan analisis cukup mendukung tujuan.",
            },
            {
                tier: "good",
                label: "Baik",
                minScore: 7,
                maxScore: 8,
                description: "Rancangan tepat, tools dan metode sesuai, dan analisis logis.",
            },
            {
                tier: "excellent",
                label: "Sangat baik",
                minScore: 9,
                maxScore: 10,
                description:
                    "Rancangan sangat sesuai dan terukur, pemilihan metode tepat guna, dan analisis mendalam serta relevan.",
            },
        ],
    },
    {
        key: "kelayakan",
        label: "(d) Kelayakan Penelitian",
        helper: "Batasan, cakupan, manajemen risiko, dan realisme waktu.",
        maxScore: 10,
        levels: [
            {
                tier: "very-low",
                label: "Sangat kurang",
                minScore: 0,
                maxScore: 2,
                description:
                    "Batasan tidak jelas, cakupan tidak sesuai, risiko tidak dianalisis, dan waktu tidak realistis.",
            },
            {
                tier: "low",
                label: "Kurang",
                minScore: 3,
                maxScore: 4,
                description:
                    "Batasan kurang eksplisit, cakupan kurang sesuai, risiko belum terkendali, waktu kurang efisien.",
            },
            {
                tier: "fair",
                label: "Cukup",
                minScore: 5,
                maxScore: 6,
                description:
                    "Batasan cukup jelas, cakupan cukup sesuai, risiko cukup teridentifikasi, waktu cukup realistis.",
            },
            {
                tier: "good",
                label: "Baik",
                minScore: 7,
                maxScore: 8,
                description:
                    "Batasan eksplisit, cakupan sesuai, risiko terkendali, dan waktu realistis dan efisien.",
            },
            {
                tier: "excellent",
                label: "Sangat baik",
                minScore: 9,
                maxScore: 10,
                description:
                    "Batasan sangat jelas, cakupan proporsional, risiko sangat rinci, dan waktu sangat terencana.",
            },
        ],
    },
];

/** CPMK-03 Respons masukan (0-15). */
export const TA03A_RESPON_LEVELS: RubricLevel[] = [
    {
        tier: "very-low",
        label: "Sangat kurang",
        minScore: 0,
        maxScore: 3,
        description: "Tidak menindaklanjuti saran, tidak aktif berkomunikasi, dan tidak melakukan revisi.",
    },
    {
        tier: "low",
        label: "Kurang",
        minScore: 4,
        maxScore: 6,
        description: "Menindaklanjuti sebagian saran, komunikasi pasif, revisi kurang tepat.",
    },
    {
        tier: "fair",
        label: "Cukup",
        minScore: 7,
        maxScore: 9,
        description:
            "Menindaklanjuti sebagian besar saran, komunikasi cukup terbuka, revisi cukup sesuai.",
    },
    {
        tier: "good",
        label: "Baik",
        minScore: 10,
        maxScore: 12,
        description: "Menindaklanjuti hampir seluruh saran, komunikasi baik, revisi sesuai dan lengkap.",
    },
    {
        tier: "excellent",
        label: "Sangat baik",
        minScore: 13,
        maxScore: 15,
        description:
            "Menindaklanjuti semua saran secara tepat, komunikasi aktif dan reflektif, serta revisi sangat komprehensif.",
    },
];

// ────────────────────────────────────────────────────────────
// TA-03B — Koordinator Metopen
// ────────────────────────────────────────────────────────────

/** CPMK-02 Penulisan sistematis proposal (0-25). */
export const TA03B_STRUKTUR_LEVELS: RubricLevel[] = [
    {
        tier: "very-low",
        label: "Sangat kurang",
        minScore: 0,
        maxScore: 5,
        description:
            "Proposal tidak mengandung sebagian besar aspek penting. Abstrak dan referensi tidak sistematis. Pendahuluan tidak memuat latar belakang. Tinjauan pustaka tidak relevan. Metode tidak mendukung tujuan. Referensi tidak kredibel. Bahasa tidak sesuai SPOK.",
    },
    {
        tier: "low",
        label: "Kurang",
        minScore: 6,
        maxScore: 10,
        description:
            "Penulisan kurang sistematis. Latar belakang kurang jelas. Tinjauan pustaka dan metode tidak relevan. Referensi sebagian besar tidak kredibel. Bahasa kurang konsisten dan tidak tepat.",
    },
    {
        tier: "fair",
        label: "Cukup",
        minScore: 11,
        maxScore: 15,
        description:
            "Penulisan cukup sistematis. Latar belakang dan kajian pustaka cukup sesuai. Metode cukup mendukung tujuan. Referensi cukup kredibel. Bahasa cukup formal dan dapat dipahami.",
    },
    {
        tier: "good",
        label: "Baik",
        minScore: 16,
        maxScore: 20,
        description:
            "Penulisan sesuai pedoman. Isi lengkap dan saling terkait. Metode mendukung tujuan. Referensi kredibel. Bahasa sesuai SPOK dan konsisten.",
    },
    {
        tier: "excellent",
        label: "Sangat baik",
        minScore: 21,
        maxScore: 25,
        description:
            "Penulisan sangat sistematis dan konsisten. Semua aspek lengkap, logis, dan mendalam. Referensi sangat relevan dan kredibel. Bahasa akademik sangat baik dan konsisten.",
    },
];

// ────────────────────────────────────────────────────────────
// Resolver: peta nama kriteria backend → rubric levels FE
// ────────────────────────────────────────────────────────────

/**
 * Identifikasi tipe rubrik kriteria dari nama (server-side `AssessmentCriteria.name`)
 * + max score. Resolusi by name + maxScore stabil terhadap variasi naming.
 */
export type CriteriaRubricKind =
    | "presentasi"
    | "konten-sub"
    | "struktur"
    | "respon"
    | "unknown";

export function resolveCriteriaRubricKind(
    name: string | null | undefined,
    maxScore: number | null | undefined,
    cpmkCode?: string | null,
): CriteriaRubricKind {
    const lower = (name ?? "").toLowerCase();
    const code = (cpmkCode ?? "").toUpperCase();

    if (lower.includes("presentasi") || (code === "CPMK-01" && maxScore === 20)) {
        return "presentasi";
    }
    if (lower.includes("konten") && maxScore === 40) {
        return "konten-sub";
    }
    if (lower.includes("struktur") && maxScore === 25) {
        return "struktur";
    }
    if (lower.includes("respon") || lower.includes("merespon") || (code === "CPMK-03" && maxScore === 15)) {
        return "respon";
    }
    return "unknown";
}

export function getRubricLevelsByKind(kind: CriteriaRubricKind): RubricLevel[] | null {
    switch (kind) {
        case "presentasi":
            return TA03A_PRESENTASI_LEVELS;
        case "respon":
            return TA03A_RESPON_LEVELS;
        case "struktur":
            return TA03B_STRUKTUR_LEVELS;
        case "konten-sub":
        case "unknown":
        default:
            return null;
    }
}

/**
 * Cek apakah `score` berada dalam rentang `level`.
 * Untuk rentang dengan tier yang berbatasan, kita pilih tier dengan max
 * yang paling kecil yang masih covers score (mis. score=4 → very-low (0-4),
 * tidak low (3-4) — TIDAK terjadi karena kita non-overlap).
 */
export function findLevelByScore(levels: RubricLevel[], score: number): RubricLevel | null {
    for (const level of levels) {
        if (score >= level.minScore && score <= level.maxScore) return level;
    }
    return null;
}

/**
 * Item rubric DB minimum yang dibutuhkan untuk merge.
 */
export interface DbRubricMinimal {
    id: string;
    minScore: number;
    maxScore: number;
}

/**
 * Pasangkan setiap official RubricLevel dengan DB rubric record yang match
 * by (minScore, maxScore). Bila tidak ada match, dbRubricId = null.
 *
 * Ketika DB sudah memiliki rubric records (post-seed `seedResearchMethodAssessment`),
 * UI tetap memakai konstanta FE untuk visual rich tier + deskripsi resmi,
 * tetapi submission menyertakan `rubricId` yang valid → backend `validateResearchMethodScores`
 * lolos walau kriteria punya `assessmentRubrics.length > 0`.
 */
export interface MergedRubricLevel {
    level: RubricLevel;
    dbRubricId: string | null;
}

export function mergeOfficialWithDbRubrics(
    officialLevels: RubricLevel[],
    dbRubrics: DbRubricMinimal[] | null | undefined,
): MergedRubricLevel[] {
    const list = dbRubrics ?? [];
    return officialLevels.map((level) => {
        const match = list.find(
            (rubric) => rubric.minScore === level.minScore && rubric.maxScore === level.maxScore,
        );
        return { level, dbRubricId: match?.id ?? null };
    });
}
