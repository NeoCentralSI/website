import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toTitleCaseName } from "@/lib/text";
import { ROLES } from "@/lib/roles";
import {
  createThesisAPI,
  updateThesisAPI,
  getAvailableStudentsAPI,
  getLecturersAPI,
  getSupervisorRolesAPI,
  type ThesisItem,
  type AvailableStudent,
  type Lecturer,
  type SupervisorRole,
} from "@/services/thesisManagement.service";
import { getTopics } from "@/services/topic.service";
import type { Topic } from "@/types/topic.types";

interface ThesisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thesis: ThesisItem | null;
  onSuccess: () => void;
}

interface SupervisorSelection {
  lecturerId: string;
  roleId: string;
}

export default function ThesisFormDialog({
  open,
  onOpenChange,
  thesis,
  onSuccess,
}: ThesisFormDialogProps) {
  const isEdit = !!thesis;

  // Form state
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [supervisor1, setSupervisor1] = useState<SupervisorSelection>({ lecturerId: "", roleId: "" });
  const [supervisor2, setSupervisor2] = useState<SupervisorSelection>({ lecturerId: "", roleId: "" });

  // Fetch options
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["available-students"],
    queryFn: getAvailableStudentsAPI,
    enabled: open && !isEdit,
  });

  const { data: lecturersData, isLoading: lecturersLoading } = useQuery({
    queryKey: ["thesis-lecturers"],
    queryFn: getLecturersAPI,
    enabled: open,
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["supervisor-roles"],
    queryFn: getSupervisorRolesAPI,
    enabled: open,
  });

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: getTopics,
    enabled: open,
  });

  const students: AvailableStudent[] = studentsData?.data || [];
  const lecturers: Lecturer[] = lecturersData?.data || [];
  const roles: SupervisorRole[] = rolesData?.data || [];
  const topics: Topic[] = topicsData || [];

  const pembimbing1Role = roles.find((r) => r.name === ROLES.PEMBIMBING_1);
  const pembimbing2Role = roles.find((r) => r.name === ROLES.PEMBIMBING_2);

  // Populate form when editing
  useEffect(() => {
    if (open && thesis) {
      setStudentId(thesis.student?.id || "");
      setTitle(thesis.title || "");
      setTopicId(thesis.topicId || "");

      // Set supervisors - use lecturerId directly from thesis data
      const sup1 = thesis.supervisors?.find((s) => s.role === ROLES.PEMBIMBING_1);
      const sup2 = thesis.supervisors?.find((s) => s.role === ROLES.PEMBIMBING_2);

      // Only set if we have the lecturer ID, otherwise wait for roles to load
      if (sup1?.lecturerId) {
        setSupervisor1({
          lecturerId: sup1.lecturerId,
          roleId: sup1.roleId || pembimbing1Role?.id || "",
        });
      } else if (pembimbing1Role) {
        setSupervisor1({ lecturerId: "", roleId: pembimbing1Role.id });
      }

      if (sup2?.lecturerId) {
        setSupervisor2({
          lecturerId: sup2.lecturerId,
          roleId: sup2.roleId || pembimbing2Role?.id || "",
        });
      } else if (pembimbing2Role) {
        setSupervisor2({ lecturerId: "", roleId: pembimbing2Role.id });
      }
    } else if (open && !thesis) {
      // Reset form when opening for create
      setStudentId("");
      setTitle("");
      setTopicId("");
      setSupervisor1({ lecturerId: "", roleId: pembimbing1Role?.id || "" });
      setSupervisor2({ lecturerId: "", roleId: pembimbing2Role?.id || "" });
    }
  }, [open, thesis, pembimbing1Role, pembimbing2Role]);

  // Update role IDs when roles are loaded
  useEffect(() => {
    if (pembimbing1Role && !supervisor1.roleId) {
      setSupervisor1((prev) => ({ ...prev, roleId: pembimbing1Role.id }));
    }
    if (pembimbing2Role && !supervisor2.roleId) {
      setSupervisor2((prev) => ({ ...prev, roleId: pembimbing2Role.id }));
    }
  }, [pembimbing1Role, pembimbing2Role]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createThesisAPI,
    onSuccess: () => {
      toast.success("Tugas akhir berhasil dibuat");
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat tugas akhir");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateThesisAPI(id, data),
    onSuccess: () => {
      toast.success("Tugas akhir berhasil diperbarui");
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui tugas akhir");
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoadingOptions = studentsLoading || lecturersLoading || rolesLoading || topicsLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && !studentId) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    if (!title.trim()) {
      toast.error("Judul tugas akhir wajib diisi");
      return;
    }

    if (title.trim().length < 10) {
      toast.error("Judul minimal 10 karakter");
      return;
    }

    // Build supervisors array
    const supervisors: SupervisorSelection[] = [];
    if (supervisor1.lecturerId && supervisor1.roleId) {
      supervisors.push(supervisor1);
    }
    if (supervisor2.lecturerId && supervisor2.roleId) {
      supervisors.push(supervisor2);
    }

    if (isEdit && thesis) {
      updateMutation.mutate({
        id: thesis.id,
        data: {
          title: title.trim(),
          thesisTopicId: topicId || null,
          supervisors,
        },
      });
    } else {
      createMutation.mutate({
        studentId,
        title: title.trim(),
        thesisTopicId: topicId || undefined,
        supervisors,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tugas Akhir" : "Tambah Tugas Akhir"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data tugas akhir mahasiswa"
              : "Tambah data tugas akhir mahasiswa secara manual"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection (only for create) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="student">Mahasiswa</Label>
              <Select value={studentId} onValueChange={setStudentId} disabled={isLoadingOptions}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Pilih mahasiswa" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.nim} - {toTitleCaseName(student.fullName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {students.length === 0 && !studentsLoading && (
                <p className="text-sm text-muted-foreground">
                  Tidak ada mahasiswa yang tersedia (semua sudah memiliki tugas akhir aktif)
                </p>
              )}
            </div>
          )}

          {/* Show student info when editing */}
          {isEdit && thesis?.student && (
            <div className="space-y-2">
              <Label>Mahasiswa</Label>
              <div className="rounded-md border p-3 bg-muted/50">
                <p className="font-medium">{thesis.student.nim}</p>
                <p className="text-sm text-muted-foreground">{toTitleCaseName(thesis.student.fullName)}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Tugas Akhir</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul tugas akhir"
              disabled={isSubmitting}
            />
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topik (Opsional)</Label>
            <Select 
              value={topicId || "__NONE__"} 
              onValueChange={(val) => setTopicId(val === "__NONE__" ? "" : val)} 
              disabled={isLoadingOptions}
            >
              <SelectTrigger id="topic">
                <SelectValue placeholder="Pilih topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Tidak ada topik</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pembimbing 1 */}
          <div className="space-y-2">
            <Label htmlFor="supervisor1">Pembimbing 1 (Opsional)</Label>
            <Select
              value={supervisor1.lecturerId || "__NONE__"}
              onValueChange={(val) => setSupervisor1({ ...supervisor1, lecturerId: val === "__NONE__" ? "" : val })}
              disabled={isLoadingOptions}
            >
              <SelectTrigger id="supervisor1">
                <SelectValue placeholder={lecturersLoading ? "Memuat dosen..." : "Pilih pembimbing 1"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Tidak ada pembimbing</SelectItem>
                {lecturers.map((lecturer) => (
                  <SelectItem key={lecturer.id} value={lecturer.id}>
                    {toTitleCaseName(lecturer.fullName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && thesis?.supervisors?.find((s) => s.role === ROLES.PEMBIMBING_1) && (
              <p className="text-xs text-muted-foreground">
                Saat ini: {toTitleCaseName(thesis.supervisors.find((s) => s.role === ROLES.PEMBIMBING_1)?.fullName || "-")}
              </p>
            )}
          </div>

          {/* Pembimbing 2 */}
          <div className="space-y-2">
            <Label htmlFor="supervisor2">Pembimbing 2 (Opsional)</Label>
            <Select
              value={supervisor2.lecturerId || "__NONE__"}
              onValueChange={(val) => setSupervisor2({ ...supervisor2, lecturerId: val === "__NONE__" ? "" : val })}
              disabled={isLoadingOptions}
            >
              <SelectTrigger id="supervisor2">
                <SelectValue placeholder={lecturersLoading ? "Memuat dosen..." : "Pilih pembimbing 2"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">Tidak ada pembimbing</SelectItem>
                {lecturers.map((lecturer) => (
                  <SelectItem key={lecturer.id} value={lecturer.id}>
                    {toTitleCaseName(lecturer.fullName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && thesis?.supervisors?.find((s) => s.role === ROLES.PEMBIMBING_2) && (
              <p className="text-xs text-muted-foreground">
                Saat ini: {toTitleCaseName(thesis.supervisors.find((s) => s.role === ROLES.PEMBIMBING_2)?.fullName || "-")}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {isEdit ? "Menyimpan..." : "Membuat..."}
                </>
              ) : isEdit ? (
                "Simpan"
              ) : (
                "Tambah"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
