import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { RubricMetopenManagementPanel } from './RubricMetopenManagementPanel';
import { useRubricMetopen } from '@/hooks/master-data/useRubricMetopen';

vi.mock('@/hooks/master-data/useRubricMetopen', () => ({
    useRubricMetopen: vi.fn(),
}));

function mockHookDefaults(overrides = {}) {
    vi.mocked(useRubricMetopen).mockReturnValue({
        cpmks: [],
        allMetopenCpmks: [],
        weightSummary: {
            totalScore: 0,
            isComplete: false,
            globalTotalScore: 0,
            details: [],
        },
        isLoading: false,
        isWeightLoading: false,
        isFetching: false,
        refetch: vi.fn(),
        createCpmk: vi.fn(),
        isCreatingCpmk: false,
        updateCpmk: vi.fn(),
        isUpdatingCpmk: false,
        deleteCpmkMaster: vi.fn(),
        isDeletingCpmkMaster: false,
        createCriteria: vi.fn(),
        updateCriteria: vi.fn(),
        deleteCriteria: vi.fn(),
        removeCpmkConfig: vi.fn(),
        isDeletingCriteria: false,
        isRemovingCpmkConfig: false,
        createRubric: vi.fn(),
        updateRubric: vi.fn(),
        deleteRubric: vi.fn(),
        isDeletingRubric: false,
        reorderCriteria: vi.fn(),
        reorderRubrics: vi.fn(),
        ...overrides,
    } as unknown as ReturnType<typeof useRubricMetopen>);
}

function openConfigTab() {
    fireEvent.click(screen.getByRole('button', { name: /2\. Konfigurasi Rubrik/i }));
}

describe('RubricMetopenManagementPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHookDefaults();
    });

    it('starts on katalog tab with clear next-step tabs', () => {
        render(<RubricMetopenManagementPanel />);

        expect(screen.getByRole('button', { name: /1\. Katalog CPMK/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /2\. Konfigurasi Rubrik/i })).toBeInTheDocument();
        expect(screen.getByText('Daftar capaian pembelajaran')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Tambah CPMK$/i })).toBeInTheDocument();
    });

    it('shows role tabs and weight status on konfigurasi tab', () => {
        mockHookDefaults({
            allMetopenCpmks: [
                {
                    id: 'c1',
                    code: 'CPMK-01',
                    description: 'Presentasi proposal',
                    academicYearId: null,
                    createdAt: '',
                    updatedAt: '',
                    _count: { metopenAssessmentCriterias: 0 },
                },
            ],
            weightSummary: {
                totalScore: 55,
                isComplete: true,
                globalTotalScore: 80,
                details: [
                    { cpmkId: 'c1', cpmkCode: 'CPMK-01', cpmkDescription: 'X', criteriaCount: 3, criteriaScoreSum: 55, rubricCount: 6 },
                ],
            },
        });

        render(<RubricMetopenManagementPanel />);
        openConfigTab();

        expect(screen.getByText('Pembimbing (TA-03A)')).toBeInTheDocument();
        expect(screen.getByText('Koordinator Metopen (TA-03B)')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('/ 100')).toBeInTheDocument();
        expect(screen.getByText('55')).toBeInTheDocument();
        expect(screen.getByText('/ 75')).toBeInTheDocument();
    });

    it('switches to TA-03B and re-initializes hook with default role', () => {
        mockHookDefaults({
            allMetopenCpmks: [
                {
                    id: 'c1',
                    code: 'CPMK-01',
                    description: 'Presentasi proposal',
                    academicYearId: null,
                    createdAt: '',
                    updatedAt: '',
                    _count: { metopenAssessmentCriterias: 0 },
                },
            ],
        });

        render(<RubricMetopenManagementPanel />);
        openConfigTab();

        fireEvent.click(screen.getByText('Koordinator Metopen (TA-03B)'));

        expect(useRubricMetopen).toHaveBeenCalledWith('default');
    });

    it('guides user to katalog when config is empty and catalog is empty', () => {
        render(<RubricMetopenManagementPanel />);
        openConfigTab();

        expect(screen.getByText(/Katalog masih kosong/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Buka Katalog CPMK/i })).toBeInTheDocument();
        expect(screen.queryByText(/tab Metodologi Penelitian/i)).not.toBeInTheDocument();
    });

    it('shows Masukkan CPMK on konfigurasi when catalog has items', () => {
        mockHookDefaults({
            allMetopenCpmks: [
                {
                    id: 'c1',
                    code: 'CPMK-01',
                    description: 'Presentasi proposal',
                    academicYearId: null,
                    createdAt: '',
                    updatedAt: '',
                    _count: { metopenAssessmentCriterias: 0 },
                },
            ],
        });

        render(<RubricMetopenManagementPanel />);
        openConfigTab();

        expect(screen.getByRole('button', { name: /Masukkan CPMK/i })).toBeInTheDocument();
    });

    it('marks invalid catalog codes for cleanup', () => {
        mockHookDefaults({
            allMetopenCpmks: [
                {
                    id: 'junk',
                    code: 'ssa',
                    description: 's',
                    academicYearId: null,
                    createdAt: '',
                    updatedAt: '',
                    _count: { metopenAssessmentCriterias: 0 },
                },
            ],
        });

        render(<RubricMetopenManagementPanel />);

        expect(screen.getByText('ssa')).toBeInTheDocument();
        expect(screen.getByText('Perlu diperbaiki')).toBeInTheDocument();
    });
});
