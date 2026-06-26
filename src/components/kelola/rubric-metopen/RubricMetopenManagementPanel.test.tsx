import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { RubricMetopenManagementPanel } from './RubricMetopenManagementPanel';
import { useRubricMetopen } from '@/hooks/master-data/useRubricMetopen';
import { useCpmk } from '@/hooks/master-data/useCpmk';

vi.mock('@/hooks/master-data/useRubricMetopen', () => ({
    useRubricMetopen: vi.fn(),
}));

vi.mock('@/hooks/master-data/useCpmk', () => ({
    useCpmk: vi.fn(),
}));

function mockHookDefaults(overrides = {}) {
    vi.mocked(useRubricMetopen).mockReturnValue({
        cpmks: [],
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

    vi.mocked(useCpmk).mockReturnValue({
        cpmks: [],
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
    } as unknown as ReturnType<typeof useCpmk>);
}

describe('RubricMetopenManagementPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHookDefaults();
    });

    it('renders both role tabs', () => {
        render(<RubricMetopenManagementPanel />);

        expect(screen.getByText('Pembimbing (TA-03A)')).toBeInTheDocument();
        expect(screen.getByText('Koordinator Metopen (TA-03B)')).toBeInTheDocument();
    });

    it('shows weight banner with correct target for supervisor (75)', () => {
        mockHookDefaults({
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

        expect(screen.getByText('80 / 100')).toBeInTheDocument();
        expect(screen.getByText('55 / 75')).toBeInTheDocument();
    });

    it('switches to TA-03B tab and re-initializes hook with default role', () => {
        render(<RubricMetopenManagementPanel />);

        fireEvent.click(screen.getByText('Koordinator Metopen (TA-03B)'));

        expect(useRubricMetopen).toHaveBeenCalledWith('default');
    });

    it('shows empty state for CPMK Metode Penelitian', () => {
        render(<RubricMetopenManagementPanel />);

        expect(screen.getByText(/Belum ada CPMK bertipe Metode Penelitian/)).toBeInTheDocument();
    });

    it('shows "Tambah CPMK" button', () => {
        render(<RubricMetopenManagementPanel />);

        expect(screen.getByText('Tambah CPMK')).toBeInTheDocument();
    });
});
