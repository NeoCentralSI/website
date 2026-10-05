import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as topicService from '@/services/topic.service';
import { getScienceGroupsAPI } from '@/services/admin.service';
import { TopicManagementPanel } from './TopicManagementPanel';

vi.mock('@/services/topic.service', () => ({
  getTopics: vi.fn(),
  createTopic: vi.fn(),
  updateTopic: vi.fn(),
  deleteTopic: vi.fn(),
  bulkDeleteTopics: vi.fn(),
}));
vi.mock('@/services/admin.service', () => ({ getScienceGroupsAPI: vi.fn() }));
vi.mock('lottie-react', () => ({ default: () => null }));

const topicName = 'Analisis dan Pengembangan Sistem Informasi dengan Nama Topik Sangat Panjang';
const groupName = 'KelompokKeilmuanDenganNamaSangatPanjangTanpaSpasi'.repeat(3);
const topic = {
  id: 'topic-1',
  name: topicName,
  scienceGroupId: 'group-1',
  scienceGroup: { id: 'group-1', name: groupName },
  createdAt: '2026-10-03T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
  thesisCount: 0,
  templateCount: 0,
};

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TopicManagementPanel />
    </QueryClientProvider>,
  );
}

describe('TopicManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(topicService.getTopics).mockResolvedValue([topic]);
    vi.mocked(getScienceGroupsAPI).mockResolvedValue({
      data: [{
        id: 'group-1',
        name: groupName,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      }],
    });
  });

  it('uses Kelompok Keilmuan and wraps long table values without truncating them', async () => {
    renderPanel();

    const name = await screen.findByText(topicName);
    expect(screen.getByRole('columnheader', { name: 'Kelompok Keilmuan' })).toBeInTheDocument();
    expect(name).toHaveClass('max-w-[40ch]', 'whitespace-normal', '[overflow-wrap:anywhere]');
    expect(name.closest('td')).toHaveClass('whitespace-normal');

    const group = screen.getByText(groupName);
    expect(group).toHaveClass('max-w-[24ch]', 'whitespace-normal', '[overflow-wrap:anywhere]');
    expect(group.closest('td')).toHaveClass('whitespace-normal');
    expect(screen.queryByText(/KBK/)).not.toBeInTheDocument();
  });

  it('uses Kelompok Keilmuan throughout the create form', async () => {
    renderPanel();
    await screen.findByText(topicName);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Topik' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Kelompok Keilmuan Topik')).toBeInTheDocument();
    expect(within(dialog).getByText('Pilih Kelompok Keilmuan...')).toBeInTheDocument();
    expect(within(dialog).getByText(/petakan ke Kelompok Keilmuan/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/KBK/)).not.toBeInTheDocument();
  });

  it('uses Kelompok Keilmuan in the edit form and preserves existing field values', async () => {
    renderPanel();
    const name = await screen.findByText(topicName);
    const row = name.closest('tr')!;
    fireEvent.click(within(row).getAllByRole('button')[0]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Nama Topik')).toHaveValue(topicName);
    expect(within(dialog).getByLabelText('Kelompok Keilmuan Topik')).toHaveTextContent(groupName);
    expect(within(dialog).getByText(/Perbarui topik dan Kelompok Keilmuan/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/KBK/)).not.toBeInTheDocument();
  });
});
