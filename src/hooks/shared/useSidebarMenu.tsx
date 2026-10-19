import {
  BookOpen,
  Briefcase,
  Clock,
  Database,
  FileText,
  SquareTerminal,
  Wrench,
  GraduationCap,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useRole } from '@/hooks/shared';
import { useAuth } from '@/hooks/shared';
import { useAvatarBlob } from "@/hooks/profile";
import { useLecturerApprovalInbox } from "@/hooks/thesis-proposal/useSupervisorRequests";
import { ENV } from "@/config/env";

/** `badge`: a count shown next to the sub-item, e.g. waiting supervisor requests. */
type SidebarLeafItem = { title: string; url: string; badge?: number };
type SidebarNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items: SidebarLeafItem[];
  isActive?: boolean;
};

const buildAnnouncementMenu = (): SidebarNavItem => ({
  title: "Pengumuman",
  url: "/pengumuman/seminar-hasil",
  icon: Megaphone,
  items: [
    { title: "Seminar Hasil", url: "/pengumuman/seminar-hasil" },
    { title: "Yudisium", url: "/pengumuman/yudisium" },
  ],
});

const appendSharedEventMenus = (items: SidebarNavItem[]) => {
  items.push(
    {
      title: "Yudisium",
      url: "/yudisium",
      icon: GraduationCap,
      items: [],
    },
    buildAnnouncementMenu(),
  );
};

export const useSidebarMenu = () => {
  const { isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing, isResearchMethodCoordinator } = useRole();
  const { user: authUser } = useAuth();

  const isStudentRole = isStudent();
  const isDosenRole = isDosen();
  const isKadepRole = isKadep();
  const isSekdepRole = isSekdep();
  const isGkmRole = isGkm();
  const isAdminRole = isAdmin();
  const isPembimbingRole = isPembimbing();
  const isResearchMethodCoordinatorRole = isResearchMethodCoordinator();

  const avatarBlobUrl = useAvatarBlob(authUser?.avatarUrl);
  // Tugas Akhir > Permohonan carries what waits for the
  // lecturer, the supervisor requests and the lecturer's change-request steps together.
  const { data: approvalInbox } = useLecturerApprovalInbox({ page: 1, pageSize: 1 }, isPembimbingRole);
  const waitingRequestCount = approvalInbox?.counts.waiting ?? 0;

  const menuData = useMemo(() => {
    // Compute role flags once for memo dependencies
    const role = {
      student: isStudentRole,
      dosen: isDosenRole,
      kadep: isKadepRole,
      sekdep: isSekdepRole,
      gkm: isGkmRole,
      admin: isAdminRole,
      pembimbing: isPembimbingRole,
      researchMethodCoordinator: isResearchMethodCoordinatorRole,
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
     * Metode Penelitian: the coordinator runs the class (Monitoring Kelas,
     * Presensi, Penilaian Proposal); Kadep and Sekdep follow it read-only in Monitoring Kelas.
     * Supervisors score in Tugas Akhir > Proposal; Sekdep's master data is Kelola > Metode Penelitian.
     */
    const buildResearchMethodItems = (): SidebarLeafItem[] => {
      if (role.researchMethodCoordinator) {
        return [
          { title: "Monitoring Kelas", url: "/metode-penelitian/monitoring" },
          { title: "Presensi", url: "/metode-penelitian/presensi" },
          { title: "Penilaian Proposal", url: "/metode-penelitian/penilaian" },
        ];
      }
      if (role.kadep || role.sekdep) return [{ title: "Monitoring Kelas", url: "/metode-penelitian/monitoring" }];
      return [];
    };

    /** Tugas Akhir > Proposal for supervisors: their proposal-phase students and "Nilai Proposal". */
    const proposalItems: SidebarLeafItem[] = role.pembimbing ? [{ title: "Proposal", url: "/tugas-akhir/proposal" }] : [];

    /**
     * A supervisor's Tugas Akhir order is Permohonan, Proposal, Bimbingan,
     * Seminar Hasil, Sidang TA. Supervisors have no Perubahan or Evaluasi page (they act from
     * Permohonan and Mahasiswa Bimbingan). Permohonan and Proposal are for supervisors; a
     * lecturer without the supervisor role keeps Bimbingan, Seminar Hasil and Sidang TA.
     */
    const supervisorThesisItems = (): SidebarLeafItem[] => [
      ...(role.pembimbing
        ? [{ title: "Permohonan", url: "/tugas-akhir/permohonan", ...(waitingRequestCount > 0 ? { badge: waitingRequestCount } : {}) }]
        : []),
      ...proposalItems,
      { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
      { title: "Seminar Hasil", url: "/tugas-akhir/seminar-hasil" },
      { title: "Sidang TA", url: "/tugas-akhir/sidang" },
    ];
    /** The Ketua Departemen's two decision queues, last in Tugas Akhir. */
    const KADEP_DECISION_ITEMS: SidebarLeafItem[] = [
      { title: "Perubahan", url: "/tugas-akhir/perubahan" },
      { title: "Evaluasi", url: "/tugas-akhir/evaluasi" },
    ];
    const MONITORING_ITEM: SidebarLeafItem = { title: "Monitoring", url: "/tugas-akhir/monitoring" };
    // The submenu is "Penetapan"; its page keeps the title "Penetapan Pembimbing".
    const PENETAPAN_ITEM: SidebarLeafItem = { title: "Penetapan", url: "/kelola/tugas-akhir/kadep/penetapan-pembimbing" };

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
        // Tugas Akhir is always shown (Overview, Proposal, Bimbingan, Seminar Hasil, Sidang);
        // without a thesis its pages show an empty state or actions disabled with a reason.
        // The separate "Metode Penelitian" menu for students is gone.
        {
          title: "Tugas Akhir",
          url: "#",
          icon: FileText,
          items: [
            { title: "Overview", url: "/tugas-akhir" },
            { title: "Proposal", url: "/tugas-akhir/proposal" },
            { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
            { title: "Seminar Hasil", url: "/tugas-akhir/seminar-hasil" },
            { title: "Sidang TA", url: "/tugas-akhir/sidang" },
          ],
        },
        // Yudisium — leaf item (no children)
        {
          title: "Yudisium",
          url: "/yudisium",
          icon: GraduationCap,
          items: [],
        },
        buildAnnouncementMenu(),
        {
          title: "Repositori",
          url: "/repositori",
          icon: Database,
          items: [],
        },
      ];

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

      const researchMethodItems = buildResearchMethodItems();
      if (researchMethodItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: researchMethodItems,
        });
      }

      // Menu Tugas Akhir
      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: supervisorThesisItems(),
      });

      appendSharedEventMenus(menuItems);

      // Jadwal Ketersediaan — leaf item
      menuItems.push({
        title: "Jadwal Ketersediaan",
        url: "/jadwal-ketersediaan",
        icon: Clock,
        items: [],
      });

      // Kelola > Metode Penelitian is the Sekdep's; the coordinator's
      // menu is Metode Penelitian > Monitoring Kelas, Presensi, Penilaian Proposal.

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

      const kadepResearchMethodItems = buildResearchMethodItems();
      if (kadepResearchMethodItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: kadepResearchMethodItems,
        });
      }

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        // Monitoring, Penetapan Pembimbing, the supervisor's items,
        // then the two decision queues (Perubahan, Evaluasi).
        items: [MONITORING_ITEM, PENETAPAN_ITEM, ...supervisorThesisItems(), ...KADEP_DECISION_ITEMS],
      });

      appendSharedEventMenus(menuItems);

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
          { title: "Tugas Akhir", url: "/kelola/tugas-akhir/master-data" },
          { title: "Batas Bimbingan", url: "/kelola/tugas-akhir/batas-bimbingan" },
          { title: "Perusahaan", url: "/kelola/perusahaan" },
          { title: "Kerja Praktik", url: "/kelola/kerja-praktik/kadep/persetujuan" },
          { title: "Kelompok Keilmuan", url: "/kelola/kelompok-keilmuan" },
          { title: "CPL", url: "/kelola/cpl" },
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
    // Sekdep adalah pengelola data
    // master TA + monitoring read-only. Role Sekdep saja bukan pembimbing
    // operasional dan tidak menerbitkan Penetapan Pembimbing (hanya membaca). Untuk akun multi-role, menu
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
          // "Seminar & Nilai" dihapus: /kelola/kerja-praktik/pendaftaran tidak
          // terdaftar di App.tsx sehingga menghasilkan halaman kosong. Seminar dan
          // nilai KP hanya ada sebagai tab per mahasiswa di bawah
          // /kelola/kerja-praktik/mahasiswa/:internshipId, yang tetap dapat
          // dicapai lewat menu Kelola > Kerja Praktik.
          items: [
            { title: "Monitoring", url: "/kerja-praktik/monitoring" },
            { title: "Bimbingan", url: "/kelola/kerja-praktik/bimbingan" },
          ],
        },
      ];

      const researchMethodItems = buildResearchMethodItems();
      if (researchMethodItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: researchMethodItems,
        });
      }

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        // Monitoring first. Read-only Penetapan Pembimbing (Sekdep sees the
        // period's batch and downloads it), then the supervisor's items for a supervising Sekdep.
        items: [MONITORING_ITEM, PENETAPAN_ITEM, ...(role.pembimbing ? supervisorThesisItems() : [])],
      });

      appendSharedEventMenus(menuItems);

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
          { title: "Perusahaan", url: "/kelola/perusahaan" },
          { title: "Kerja Praktik", url: "/kelola/kerja-praktik" },
          { title: "Metode Penelitian", url: "/kelola/metode-penelitian" },
          { title: "Tugas Akhir", url: "/kelola/tugas-akhir" },
          { title: "Batas Bimbingan", url: "/kelola/tugas-akhir/batas-bimbingan" },
          { title: "Panduan", url: "/kelola/sop" },
          { title: "Kelompok Keilmuan", url: "/kelola/kelompok-keilmuan" },
          { title: "CPL", url: "/kelola/cpl" },
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

      const researchMethodItems = buildResearchMethodItems();
      if (researchMethodItems.length > 0) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: researchMethodItems,
        });
      }

      // Guidance revival: Monitoring TA untuk GKM dipulihkan dari baseline (akses baca
      // dashboard/detail; guard route FE + backend memakai DEPARTMENT_ROLES). Item
      // bimbingan/seminar/sidang tetap hanya untuk akun yang juga pembimbing.
      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        // Monitoring first, then the supervisor's items for a supervising GKM.
        items: [MONITORING_ITEM, ...(role.pembimbing ? supervisorThesisItems() : [])],
      });

      appendSharedEventMenus(menuItems);
      menuItems.push({
        title: "Kelola",
        url: "#",
        icon: Database,
        items: [{ title: "CPL", url: "/kelola/cpl" }],
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
                url: "/admin/kerja-praktik/seminar/template",
              },
            ],
          },
          {
            title: "Tugas Akhir",
            url: "#",
            icon: FileText,
            items: [
              { title: "Seminar Hasil", url: "/tugas-akhir/seminar-hasil" },
              { title: "Sidang TA", url: "/tugas-akhir/sidang" },
            ],
          },
          {
            title: "Yudisium",
            url: "/yudisium",
            icon: GraduationCap,
            items: [],
          },
          buildAnnouncementMenu(),
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
                title: "Kelola Ruangan",
                url: "/master-data/ruangan",
              },
              {
                title: "Data Hari Libur",
                url: "/master-data/hari-libur",
              },
              // No "Batas Bimbingan" for Admin; Kadep and Sekdep set it.
            ],
          },
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
    isStudentRole, isDosenRole, isKadepRole, isSekdepRole, isGkmRole, isAdminRole, isPembimbingRole, isResearchMethodCoordinatorRole,
    // user deps
    authUser?.fullName, authUser?.email,
    avatarBlobUrl,
    waitingRequestCount,
  ]);

  return menuData;
};
