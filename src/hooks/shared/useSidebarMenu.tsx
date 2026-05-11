import {
  BookOpen,
  Briefcase,
  Clock,
  Database,
  FileText,
  SquareTerminal,
  GraduationCap,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useRole } from '@/hooks/shared';
import { useAuth } from '@/hooks/shared';
import { useAvatarBlob } from "@/hooks/profile";
import { useAdvisorAccessState } from "./useAdvisorAccessState";
import { useStudentEligibility } from "./useStudentEligibility";
import { ENV } from "@/config/env";

type SidebarLeafItem = { title: string; url: string };
type SidebarNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items: SidebarLeafItem[];
  isActive?: boolean;
};

export const useSidebarMenu = () => {
  const { isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing, isKoordinatorMetopen } = useRole();
  const { user: authUser } = useAuth();

  const avatarBlobUrl = useAvatarBlob(authUser?.avatarUrl);
  const isStudentUser = Boolean(authUser?.id) && isStudent();
  const { canAccessMetopel, isMetopenReadOnly } = useStudentEligibility();
  const { data: advisorAccess } = useAdvisorAccessState(isStudentUser && canAccessMetopel);

  const menuData = useMemo(() => {
    // Compute role flags once for memo dependencies
    const role = {
      student: isStudent(),
      dosen: isDosen(),
      kadep: isKadep(),
      sekdep: isSekdep(),
      gkm: isGkm(),
      admin: isAdmin(),
      pembimbing: isPembimbing(),
      koordinatorMetopen: isKoordinatorMetopen(),
    };

    // Get user initials for avatar fallback
    const getInitials = (name?: string) => {
      if (!name) return 'U';
      const parts = name.split(' ').filter(Boolean);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last).toUpperCase();
    };

    /**
     * Build menu Metopen per role.
     *
     * Pertimbangan canon SIMPTA v2.0:
     * - "Inbox Pembimbing" hanya relevan untuk user yang punya role
     *   Pembimbing 1 / Pembimbing 2. Role struktural seperti Sekdep/GKM tidak
     *   boleh menutupi kemampuan pembimbing bila user yang sama memang
     *   multi-role, tetapi juga tidak boleh memberi inbox ke user non-pembimbing.
     * - "Penilaian TA-03B" tetap khusus role Koordinator Metopen
     *   (Koordinator Metopen) sesuai BR-19.
     */
    const buildMetopenItems = ({
      coordinatorLabel,
      coordinatorUrl,
      includeInboxPembimbing = role.pembimbing,
    }: {
      coordinatorLabel?: string;
      coordinatorUrl?: string;
      /**
       * Default mengikuti role Pembimbing 1/2 aktif. Opsi ini hanya dipakai
       * untuk menutup inbox pada surface tertentu tanpa memberi akses baru.
       */
      includeInboxPembimbing?: boolean;
    } = {}): SidebarLeafItem[] => {
      const items: SidebarLeafItem[] = [];

      if (coordinatorLabel && coordinatorUrl) {
        items.push({ title: coordinatorLabel, url: coordinatorUrl });
      }

      if (role.koordinatorMetopen) {
        items.push({ title: "Penilaian TA-03B", url: "/kelola/metopen/ta03b" });
      }

      if (includeInboxPembimbing && role.pembimbing) {
        items.push({ title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" });
      }

      return items;
    };

    // STUDENT MENU
    if (role.student) {
      const studentNav: SidebarNavItem[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
          items: [],
        },
        // Kerja Praktik
        {
          title: "Kerja Praktik",
          url: "#",
          icon: Briefcase,
          items: [
            { title: "Pendaftaran", url: "/kerja-praktik/pendaftaran" },
            { title: "Kegiatan", url: "/kerja-praktik/kegiatan/logbook" },
            { title: "Seminar & Nilai", url: "/kerja-praktik/seminar" },
          ],
        },
        // Tugas Akhir
        {
          title: "Tugas Akhir",
          url: "#",
          icon: FileText,
          items: [
            { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
            { title: "Seminar", url: "/tugas-akhir/seminar" },
            { title: "Sidang", url: "/tugas-akhir/sidang" },
          ],
        },
        // Yudisium — leaf item (no children)
        {
          title: "Yudisium",
          url: "/yudisium",
          icon: GraduationCap,
          items: [],
        },
      ];

      if (canAccessMetopel) {
        const metopenItems = [{ title: "Overview", url: "/metopel" }];
        const canOpenAdvisorSearch =
          !isMetopenReadOnly &&
          !(advisorAccess?.hasOfficialSupervisor ?? false) &&
          (Boolean(advisorAccess?.canBrowseCatalog) || Boolean(advisorAccess?.hasBlockingRequest));

        if (canOpenAdvisorSearch) {
          metopenItems.push({ title: "Cari Pembimbing", url: "/metopel/cari-pembimbing" });
        }

        studentNav.splice(2, 0, {
          title: isMetopenReadOnly ? "Metode Penelitian (Arsip)" : "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: metopenItems,
        });
      }

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: avatarBlobUrl || "",
          initials: getInitials(authUser?.fullName),
        },
        navMain: studentNav,
        navSecondary: [],
      };
    }

    // LECTURER (NORMAL) MENU
    if (role.dosen && !role.kadep && !role.sekdep && !role.gkm) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
          items: [],
        },
        {
          title: "Kerja Praktik",
          url: "#",
          icon: Briefcase,
          items: [
            { title: "Monitoring", url: "/kerja-praktik/monitoring" },
            { title: "Bimbingan", url: "/kerja-praktik/dosen/bimbingan" },
            { title: "Seminar & Nilai", url: "/kerja-praktik/dosen/bimbingan" },
          ],
        },
      ];

      const metopenItems = buildMetopenItems();
      if (metopenItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: metopenItems,
        });
      }

      // Menu Tugas Akhir
      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar", url: "/tugas-akhir/seminar" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
        ],
      });

      // Jadwal Ketersediaan — leaf item
      menuItems.push({
        title: "Jadwal Ketersediaan",
        url: "/jadwal-ketersediaan",
        icon: Clock,
        items: [],
      });

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: avatarBlobUrl || "",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // LECTURER (KADEP) MENU
    if (role.kadep) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
          items: [],
        },
        {
          title: "Kerja Praktik",
          url: "#",
          icon: Briefcase,
          items: [
            { title: "Monitoring", url: "/kerja-praktik/monitoring" },
            { title: "Bimbingan", url: "/kerja-praktik/monitoring" },
            { title: "Seminar & Nilai", url: "/kelola/kerja-praktik/kadep/persetujuan" },
          ],
        },
      ];

      menuItems.push({
        title: "Metode Penelitian",
        url: "#",
        icon: BookOpen,
        items: buildMetopenItems({
          coordinatorLabel: "Keputusan TA-01 s.d. TA-04",
          coordinatorUrl: "/kelola/tugas-akhir/kadep",
        }),
      });

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar Hasil", url: "/tugas-akhir/seminar" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      // Jadwal Ketersediaan — leaf item
      menuItems.push({
        title: "Jadwal Ketersediaan",
        url: "/jadwal-ketersediaan",
        icon: Clock,
        items: [],
      });

      // Menu Kelola (fitur manajemen Kadep)
      menuItems.push({
        title: "Kelola",
        url: "#",
        icon: Database,
        items: [
          { title: "Tugas Akhir", url: "/kelola/tugas-akhir/kadep" },
          { title: "Kelola Perusahaan", url: "/kelola/perusahaan" },
          { title: "Kerja Praktik", url: "/kelola/kerja-praktik/kadep/persetujuan" },
          { title: "Kelompok Keilmuan", url: "/kelola/kelompok-keilmuan" },
          { title: "Kelola Data CPL", url: "/kelola/data-cpl" },
        ],
      });

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: avatarBlobUrl || "",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // LECTURER (SEKDEP) MENU
    // Canon SIMPTA v2.0 §4 + Q5 (audit BR-24): Sekdep adalah pengelola data
    // master TA + monitoring read-only. Role Sekdep saja bukan pembimbing
    // operasional dan bukan co-approver TA-04. Untuk akun multi-role, menu
    // operasional tetap mengikuti role tambahan yang benar-benar dimiliki.
    if (role.sekdep) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
          items: [],
        },
        {
          title: "Kerja Praktik",
          url: "#",
          icon: Briefcase,
          items: [
            { title: "Monitoring", url: "/kerja-praktik/monitoring" },
            { title: "Bimbingan", url: "/kelola/kerja-praktik/pendaftaran/bimbingan" },
            { title: "Seminar & Nilai", url: "/kelola/kerja-praktik/pendaftaran" },
          ],
        },
      ];

      const metopenItems = buildMetopenItems();
      if (metopenItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: metopenItems,
        });
      }

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          ...(role.pembimbing
            ? [
                { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
                { title: "Seminar", url: "/tugas-akhir/seminar" },
                { title: "Sidang", url: "/tugas-akhir/sidang" },
              ]
            : []),
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      // Jadwal Ketersediaan — leaf item
      menuItems.push({
        title: "Jadwal Ketersediaan",
        url: "/jadwal-ketersediaan",
        icon: Clock,
        items: [],
      });

      menuItems.push({
        title: "Kelola",
        url: "#",
        icon: Database,
        items: [
          { title: "Kelola Perusahaan", url: "/kelola/perusahaan" },
          { title: "Kerja Praktik", url: "/kelola/kerja-praktik" },
          { title: "Tugas Akhir", url: "/kelola/tugas-akhir" },
          { title: "Yudisium", url: "/kelola/yudisium" },
          { title: "Kelola Panduan", url: "/kelola/sop" },
          { title: "Kelompok Keilmuan", url: "/kelola/kelompok-keilmuan" },
          { title: "Kelola Data CPL", url: "/kelola/data-cpl" },
        ],
      });

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: avatarBlobUrl || "",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // LECTURER (GKM) MENU
    // GKM (Gugus Kendali Mutu) adalah aktor monitoring kualitas. Role GKM saja
    // bukan pembimbing TA operasional, tetapi akun multi-role tetap mendapat
    // menu pembimbing bila punya role Pembimbing 1/2.
    if (role.gkm) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
          items: [],
        },
        {
          title: "Kerja Praktik",
          url: "#",
          icon: Briefcase,
          items: [
            { title: "Monitoring", url: "/kerja-praktik/monitoring" },
            { title: "Bimbingan", url: "/kerja-praktik/monitoring" },
            { title: "Seminar & Nilai", url: "/kerja-praktik/monitoring" },
          ],
        },
      ];

      const metopenItems = buildMetopenItems();
      if (metopenItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: metopenItems,
        });
      }

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          ...(role.pembimbing
            ? [
                { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
                { title: "Seminar", url: "/tugas-akhir/seminar" },
                { title: "Sidang", url: "/tugas-akhir/sidang" },
              ]
            : []),
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      // Jadwal Ketersediaan — leaf item
      menuItems.push({
        title: "Jadwal Ketersediaan",
        url: "/jadwal-ketersediaan",
        icon: Clock,
        items: [],
      });

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: avatarBlobUrl || "",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // ADMIN DEPARTEMEN MENU
    if (role.admin) {
      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: avatarBlobUrl || "",
          initials: getInitials(authUser?.fullName),
        },
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: SquareTerminal,
            isActive: true,
            items: [],
          },
          {
            title: "Kerja Praktik",
            url: "#",
            icon: Briefcase,
            items: [
              {
                title: "Perusahaan",
                url: "/admin/kerja-praktik/perusahaan",
              },
              {
                title: "Surat Pengantar",
                url: "/admin/kerja-praktik/surat-pengantar",
              },
              {
                title: "Surat Tugas",
                url: "/admin/kerja-praktik/surat-tugas",
              },
              {
                title: "Seminar & Nilai",
                url: "/admin/kerja-praktik/seminar",
              },
            ],
          },
          {
            title: "Tugas Akhir",
            url: "#",
            icon: FileText,
            items: [
              { title: "Data TA", url: "/master-data/tugas-akhir" },
              { title: "Penjadwalan Seminar", url: "/tugas-akhir/seminar/admin" },
              { title: "Penjadwalan Sidang", url: "/tugas-akhir/sidang/admin" },
            ],
          },
          {
            title: "Master Data",
            url: "#",
            icon: Database,
            items: [
              {
                title: "Data Mahasiswa",
                url: "/master-data/mahasiswa",
              },
              {
                title: "Data Dosen",
                url: "/master-data/dosen",
              },
              {
                title: "Data TA",
                url: "/master-data/tugas-akhir",
              },
              {
                title: "Kelola User",
                url: "/master-data/user",
              },
              {
                title: "Kelola Tahun Ajaran",
                url: "/master-data/tahun-ajaran",
              },
              {
                title: "Kuota Bimbingan",
                url: "/master-data/kuota-bimbingan",
              },
            ],
          },
          // ⚠️ DevTools simulator — eligibility set, snapshot SIA dummy.
          // P1-01: hanya tampil bila VITE_ENABLE_DEV_TOOLS=true atau env=development.
          // Production wajib OFF agar tidak ada admin dummy yang bocor ke user.
          ...(ENV.ENABLE_DEV_TOOLS
            ? [
                {
                  title: "Development",
                  url: "/admin/dev-tools",
                  icon: Wrench,
                  items: [],
                },
              ]
            : []),
        ],
        navSecondary: [],
      };
    }

    // Default menu jika tidak ada role yang cocok
    return {
      user: {
        name: authUser?.fullName || "User",
        email: authUser?.email || "user@example.com",
        avatar: avatarBlobUrl || "",
        initials: getInitials(authUser?.fullName),
      },
      navMain: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
          items: [],
        },
      ],
      navSecondary: [],
    };
    // Only recompute when role flags or auth user identity change
  }, [
    // role flags
    isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing, isKoordinatorMetopen,
    // user deps
    authUser?.fullName, authUser?.email,
    avatarBlobUrl,
    advisorAccess?.canBrowseCatalog,
    advisorAccess?.hasBlockingRequest,
    advisorAccess?.hasOfficialSupervisor,
    canAccessMetopel,
    isMetopenReadOnly
  ]);

  return menuData;
};
