import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { CustomTable, type Column } from "@/components/layout/CustomTable";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { toTitleCaseName, formatRoleName } from "@/lib/text";
import {
  getThesisListAPI,
  type ThesisItem,
} from "@/services/thesisManagement.service";
import ThesisFormDialog from "@/components/admin/ThesisFormDialog";

export default function KelolaThesisPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editThesis, setEditThesis] = useState<ThesisItem | null>(null);

  const breadcrumbs = useMemo(
    () => [
      { label: "Tugas Akhir" },
      { label: "Kelola" },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Kelola Tugas Akhir");
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  // Query thesis list
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-thesis-list", page, pageSize, search],
    queryFn: () => getThesisListAPI({ page, pageSize, search }),
  });

  const handleOpenCreate = () => {
    setEditThesis(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (thesis: ThesisItem) => {
    setEditThesis(thesis);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditThesis(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-thesis-list"] });
    handleDialogClose();
  };

  // Define columns for CustomTable
  const columns: Column<ThesisItem>[] = useMemo(
    () => [
      {
        key: "nim",
        header: "NIM",
        width: 120,
        render: (row) => row.student?.nim || "-",
      },
      {
        key: "studentName",
        header: "Nama Mahasiswa",
        width: 180,
        render: (row) => toTitleCaseName(row.student?.fullName || "-"),
      },
      {
        key: "title",
        header: "Judul Tugas Akhir",
        render: (row) => (
          <div className="max-w-[300px] truncate" title={row.title || "-"}>
            {row.title || "-"}
          </div>
        ),
      },
      {
        key: "topic",
        header: "Topik",
        width: 150,
        render: (row) => row.topic || "-",
      },
      {
        key: "supervisors",
        header: "Pembimbing",
        width: 200,
        render: (row) => {
          if (!row.supervisors || row.supervisors.length === 0) {
            return "-";
          }
          return (
            <div className="space-y-1">
              {row.supervisors.map((sup, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{formatRoleName(sup.role)}:</span>{" "}
                  <span>{toTitleCaseName(sup.fullName)}</span>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Aksi",
        width: 100,
        render: (row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(row)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const theses = data?.data || [];
  const total = data?.meta?.total || 0;

  return (
    <div className="p-6 space-y-4">
        <CustomTable<ThesisItem>
          columns={columns}
          data={theses}
          loading={isLoading}
          isRefreshing={isRefetching}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchValue={search}
          onSearchChange={setSearch}
          rowKey={(row) => row.id}
          emptyText="Tidak ada data tugas akhir"
          actions={
            <div className="flex gap-2">
              <RefreshButton
                onClick={() => refetch()}
                isRefreshing={isRefetching && !isLoading}
              />
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data
              </Button>
            </div>
          }
        />

      {/* Create/Edit Dialog */}
      <ThesisFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        thesis={editThesis}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
