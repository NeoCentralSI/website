import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toTitleCaseName } from '@/lib/text';
import { useYudisiumRepository } from '@/hooks/yudisium/useYudisium';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';

export default function Repository() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: panels, isLoading, isFetching, refetch } = useYudisiumRepository();

  // Derive active tab - stable across refreshes
  const activeTab = useMemo(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) return tabFromUrl;
    return panels?.[0]?.id || '';
  }, [searchParams, panels]);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
    setPage(1); 
    setTopicFilter(''); 
  };

  useEffect(() => {
    setBreadcrumbs([{ label: 'Repositori' }]);
    setTitle('Repositori Karya Ilmiah');
  }, [setBreadcrumbs, setTitle]);

  // Map panels to Tab items - derived once and remains stable
  const tabs = useMemo(() => {
    return panels?.map(p => ({ label: p.name, value: p.id })) || [];
  }, [panels]);

  // Current active data
  const currentPanel = useMemo(() => {
    return panels?.find(p => p.id === activeTab);
  }, [panels, activeTab]);

  // Filtered data for the current table — all filtering is client-side for instant results
  const filteredData = useMemo(() => {
    if (!currentPanel) return [];
    const q = search.trim().toLowerCase();
    return currentPanel.documents.filter(doc => {
      const matchesSearch = !q ||
        doc.thesisTitle.toLowerCase().includes(q) ||
        doc.studentName.toLowerCase().includes(q) ||
        doc.studentNim.toLowerCase().includes(q);
      const matchesTopic = topicFilter === '' || doc.topicName === topicFilter;
      return matchesSearch && matchesTopic;
    });
  }, [currentPanel, search, topicFilter]);

  // Available topics for filtering in the current panel
  const availableTopics = useMemo(() => {
    if (!currentPanel) return [];
    const topics = new Set<string>();
    currentPanel.documents.forEach(d => {
      if (d.topicName) topics.add(d.topicName);
    });
    return Array.from(topics).sort();
  }, [currentPanel]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleViewDocument = async (filePath: string | null, fileName: string | null) => {
    if (!filePath) return;
    try {
      await openProtectedFile(filePath, fileName || undefined);
    } catch (error) {
      toast.error((error as Error).message || 'Gagal membuka dokumen');
    }
  };

  const columns = useMemo<Column<any>[]>(() => [
    {
      key: 'no',
      header: 'No',
      width: 60,
      className: 'text-center',
      render: (_, idx) => (page - 1) * pageSize + idx + 1,
    },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      className: 'min-w-[300px] max-w-[600px] whitespace-normal',
      render: (doc) => (
        <div className="flex flex-col gap-1 py-1">
          <span className="text-sm font-medium text-foreground leading-snug break-words">{doc.thesisTitle}</span>
          <div className="flex lg:hidden">
            <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
              {doc.topicName}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 250,
      render: (doc) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{toTitleCaseName(doc.studentName)}</span>
          <span className="text-xs text-muted-foreground">{doc.studentNim}</span>
        </div>
      ),
    },
    {
      key: 'topic',
      header: 'Topik',
      width: 180,
      className: 'hidden lg:table-cell',
      filter: {
        type: 'select',
        value: topicFilter,
        onChange: setTopicFilter,
        options: [
          { label: 'Semua Topik', value: '' },
          ...availableTopics.map(t => ({ label: t, value: t }))
        ]
      },
      render: (doc) => (
        <Badge variant="outline" className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">
          {doc.topicName}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 80,
      className: 'text-center',
      render: (doc) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => handleViewDocument(doc.filePath, doc.fileName)}
          title="Lihat Dokumen"
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ], [page, pageSize, topicFilter, availableTopics]);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Repositori Karya Ilmiah</h1>
        <p className="text-muted-foreground mt-1">Pusat pencarian dokumen publik mahasiswa yang telah menyelesaikan proses yudisium</p>
      </div>

      {/* Tabs Navigation - Always rendered once loaded */}
      {tabs.length > 0 && (
        <LocalTabsNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Content */}
      <CustomTable
        columns={columns}
        data={paginatedData}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        enableColumnFilters
        emptyText="Tidak ada dokumen publik yang tersedia di kategori ini."
        actions={
          <RefreshButton
            onClick={() => refetch()}
            isRefreshing={isFetching && !isLoading}
          />
        }
      />
    </div>
  );
}
