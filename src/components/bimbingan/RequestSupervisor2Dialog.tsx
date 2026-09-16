import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { toast } from "sonner";
import { toTitleCaseName } from "@/lib/text";
import { cn } from "@/lib/utils";
import {
  getAvailableSupervisors2,
  requestSupervisor2,
  type AvailableSupervisor2Item,
} from "@/services/studentGuidance.service";
import { UserPlus, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RequestSupervisor2DialogProps {
  hasPembimbing2: boolean;
  hasPendingRequest: boolean;
}

// Info kuota aman untuk mahasiswa (canon §7.3): hanya traffic light.
const TRAFFIC_LIGHT_META: Record<string, { label: string; className: string }> = {
  green: { label: "Tersedia", className: "border-green-300 bg-green-50 text-green-700" },
  yellow: { label: "Hampir penuh", className: "border-amber-300 bg-amber-50 text-amber-700" },
  red: { label: "Penuh", className: "border-red-300 bg-red-50 text-red-700" },
};

export function RequestSupervisor2Dialog({
  hasPembimbing2,
  hasPendingRequest,
}: RequestSupervisor2DialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<AvailableSupervisor2Item | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: lecturers, isPending: isLoadingLecturers } = useQuery({
    queryKey: ["available-supervisors-2"],
    queryFn: getAvailableSupervisors2,
    enabled: open,
  });

  const requestMutation = useMutation({
    mutationFn: (lecturerId: string) => requestSupervisor2(lecturerId),
    onSuccess: (data) => {
      toast.success("Permintaan terkirim", {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["student-supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["pending-supervisor2-request"] });
      setOpen(false);
      setSelectedLecturer(null);
      setSearch("");
    },
    onError: (error: Error) => {
      toast.error("Gagal mengirim permintaan", {
        description: error.message,
      });
    },
  });

  const filteredLecturers = (lecturers ?? []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.fullName?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.identityNumber?.toLowerCase().includes(q) ||
      l.scienceGroup?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = () => {
    if (!selectedLecturer) return;
    requestMutation.mutate(selectedLecturer.id);
  };

  // Don't show button if student already has pembimbing 2 or pending request
  if (hasPembimbing2 || hasPendingRequest) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedLecturer(null); setSearch(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Request Pembimbing 2
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Request Pembimbing 2</DialogTitle>
          <DialogDescription>
            Pilih dosen yang tersedia untuk menjadi Pembimbing 2 tugas akhir Anda.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari dosen..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Lecturer list */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[40vh] space-y-2 px-1 -mx-1">
          {isLoadingLecturers ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filteredLecturers.length === 0 ? (
            <EmptyState
              title="Tidak Ada Dosen"
              description={search ? "Tidak ditemukan dosen yang sesuai" : "Tidak ada dosen yang tersedia sebagai Pembimbing 2"}
              size="sm"
            />
          ) : (
            filteredLecturers.map((lecturer) => {
              const isSelected = selectedLecturer?.id === lecturer.id;
              const isFull =
                lecturer.trafficLight === "red" || lecturer.acceptingRequests === false;
              const trafficMeta = lecturer.trafficLight
                ? TRAFFIC_LIGHT_META[lecturer.trafficLight]
                : null;
              const hasQuotaInfo =
                !!trafficMeta ||
                lecturer.normalAvailable != null ||
                lecturer.activeCount != null;
              return (
                <Card
                  key={lecturer.id}
                  aria-disabled={isFull}
                  className={cn(
                    "p-3 transition-all",
                    isFull ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-sm",
                    isSelected
                      ? "ring-2 ring-primary bg-primary/5"
                      : !isFull && "hover:bg-muted/50",
                  )}
                  onClick={() => {
                    if (isFull) return;
                    setSelectedLecturer(lecturer);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {toTitleCaseName(lecturer.fullName || "")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lecturer.identityNumber || ""}
                        {lecturer.scienceGroup ? ` • ${lecturer.scienceGroup}` : ""}
                      </p>
                      {lecturer.email && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {lecturer.email}
                        </p>
                      )}
                      {hasQuotaInfo && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {trafficMeta && (
                            <Badge variant="outline" className={cn("text-[10px]", trafficMeta.className)}>
                              {trafficMeta.label}
                            </Badge>
                          )}
                          {lecturer.normalAvailable != null && (
                            <span className="text-[11px] text-muted-foreground">
                              Sisa normal: {lecturer.normalAvailable}
                            </span>
                          )}
                          {lecturer.activeCount != null && (
                            <span className="text-[11px] text-muted-foreground">
                              Beban aktif: {lecturer.activeCount}
                            </span>
                          )}
                        </div>
                      )}
                      {isFull && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {lecturer.acceptingRequests === false
                            ? "Dosen sedang menutup penerimaan permintaan."
                            : "Kuota pembimbing penuh."}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="shrink-0 ml-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedLecturer || requestMutation.isPending}
          >
            {requestMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Mengirim...
              </>
            ) : (
              "Kirim Permintaan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
