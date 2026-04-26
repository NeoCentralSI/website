import {
  BookOpen,
  Briefcase,
  Clock,
  Database,
  FileText,
  SquareTerminal,
  GraduationCap,
  Megaphone
} from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useRole } from '@/hooks/shared';
import { useAuth } from '@/hooks/shared';
import { useAvatarBlob } from "@/hooks/profile";
import { useAdvisorAccessState } from "./useAdvisorAccessState";

export const useSidebarMenu = () => {
  const { pathname } = useLocation();
  const { isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing1, isDosenPengampuMetopel } = useRole();
  const { user: authUser } = useAuth();

  const avatarBlobUrl = useAvatarBlob(authUser?.avatarUrl);
  const { data: advisorAccess } = useAdvisorAccessState(Boolean(authUser?.id) && isStudent());

  const menuData = useMemo(() => {
    // Compute role flags once for memo dependencies
    const role = {
      student: isStudent(),
      dosen: isDosen(),
      kadep: isKadep(),
      sekdep: isSekdep(),
      gkm: isGkm(),
      admin: isAdmin(),
      pembimbing1: isPembimbing1(),
      dosenPengampuMetopel: isDosenPengampuMetopel(),
    };

    // Get user initials for avatar fallback
    const getInitials = (name?: string) => {
      if (!name) return 'U';
      const parts = name.split(' ').filter(Boolean);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last).toUpperCase();
    };

    // STUDENT MENU
    if (role.student) {
      const metopenItems = [
        { title: "Overview", url: "/metopel" },
        { title: "Tugas", url: "/metopel/tugas" },
      ];

      if (!(advisorAccess?.hasOfficialSupervisor ?? false)) {
        metopenItems.push({ title: "Cari Pembimbing", url: "/metopel/cari-pembimbing" });
      }

      if (advisorAccess?.canOpenLogbook) {
        metopenItems.push({ title: "Logbook Bimbingan", url: "/metopel/logbook" });
      }

      const studentNav: any[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        // Kerja Praktik
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            { title: "Pendaftaran", url: "/kerja-praktik/pendaftaran" },
            { title: "Kegiatan", url: "/kerja-praktik/kegiatan" },
            { title: "Seminar & Nilai", url: "/kerja-praktik/seminar" },
          ],
        },
        // Metode Penelitian â€” Overview ditambah sebagai sub-item pertama
        {
          title: "Metode Penelitian",
          url: "/metopel",
          icon: BookOpen,
          items: metopenItems,
        },
        // Tugas Akhir
        {
          title: "Tugas Akhir",
          url: "/tugas-akhir",
          icon: FileText,
          items: [
            { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
            { title: "Seminar Hasil", url: "/tugas-akhir/seminar-hasil" },
            { title: "Sidang", url: "/tugas-akhir/sidang" },
          ],
        },
        {
          title: "Pengumuman",
          url: "/pengumuman",
          icon: Megaphone,
          items: [
            {
              title: "Seminar Hasil",
              url: "/pengumuman/seminar-hasil",
              isActive: pathname.startsWith("/pengumuman/seminar-hasil"),
            },
            {
              title: "Yudisium",
              url: "/pengumuman/yudisium",
              isActive: pathname.startsWith("/pengumuman/yudisium"),
            },
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
      const menuItems: any[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik/dosen/bimbingan",
          icon: Briefcase,
        },
      ];

      // Dosen Pengampu Metopel â€” full management menu
      if (role.dosenPengampuMetopel) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: [
            { title: "Mahasiswa", url: "/kelola/metopen/mahasiswa" },
            { title: "Bank Template", url: "/kelola/metopen/template" },
            { title: "Publish Tugas", url: "/kelola/metopen/publish" },
            { title: "Antrian Penilaian", url: "/kelola/metopen/penilaian" },
            { title: "Monitoring", url: "/kelola/metopen/monitoring" },
            { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
          ],
        });
      } else if (role.pembimbing1) {
        // Pembimbing biasa â€” hanya inbox (tidak punya akses kelola kelas/template)
        menuItems.push({
          title: "Inbox Pembimbing",
          url: "/dosen/inbox-pembimbing",
          icon: BookOpen,
          items: [],
        });
      }

      // Menu Tugas Akhir
      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar", url: "/tugas-akhir/seminar-hasil" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
        ],
      });

      menuItems.push({
        title: "Yudisium",
        url: "/yudisium",
        icon: GraduationCap,
        items: [],
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
      const menuItems: any[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik/dosen/bimbingan",
          icon: Briefcase,
        },
      ];

      if (role.dosenPengampuMetopel) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: [
            { title: "Mahasiswa", url: "/kelola/metopen/mahasiswa" },
            { title: "Bank Template", url: "/kelola/metopen/template" },
            { title: "Publish Tugas", url: "/kelola/metopen/publish" },
            { title: "Antrian Penilaian", url: "/kelola/metopen/penilaian" },
            { title: "Monitoring", url: "/kelola/metopen/monitoring" },
            { title: "Inbox Pembimbing", url: "/dosen/inbox-pembimbing" },
          ],
        });
      } else if (role.pembimbing1) {
        menuItems.push({
          title: "Inbox Pembimbing",
          url: "/dosen/inbox-pembimbing",
          icon: BookOpen,
          items: [],
        });
      }

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar Hasil", url: "/tugas-akhir/seminar-hasil" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      menuItems.push({
        title: "Yudisium",
        url: "/yudisium",
        icon: GraduationCap,
        items: [],
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
          { title: "DSS Pembimbing", url: "/kelola/metopen/dss" },
          { title: "Kelompok Keilmuan", url: "/kelola/kelompok-keilmuan" },
          { title: "Kelola CPL", url: "/kelola/cpl" },
        ],
      });

      // no Profil for kadep

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
    if (role.sekdep) {
      const menuItems: any[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik/dosen/bimbingan",
          icon: Briefcase,
        },
      ];

      if (role.dosenPengampuMetopel) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "#",
          icon: BookOpen,
          items: [
            { title: "Mahasiswa", url: "/kelola/metopen/mahasiswa" },
            { title: "Bank Template", url: "/kelola/metopen/template" },
            { title: "Publish Tugas", url: "/kelola/metopen/publish" },
            { title: "Antrian Penilaian", url: "/kelola/metopen/penilaian" },
            { title: "Monitoring", url: "/kelola/metopen/monitoring" },
          ],
        });
      } else if (role.pembimbing1) {
        menuItems.push({
          title: "Inbox Pembimbing",
          url: "/dosen/inbox-pembimbing",
          icon: BookOpen,
          items: [],
        });
      }

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar", url: "/tugas-akhir/seminar-hasil" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      menuItems.push({
        title: "Yudisium",
        url: "/yudisium",
        icon: GraduationCap,
        items: [],
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
          { title: "Kelola Panduan", url: "/kelola/sop" },
          { title: "Kelompok Keilmuan", url: "/kelola/kelompok-keilmuan" },
          { title: "Kelola CPL", url: "/kelola/cpl" },
        ],
      });

      // no Profil for sekdep

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
    if (role.gkm) {
      const menuItems: any[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik/dosen/bimbingan",
          icon: Briefcase,
        },
      ];

      menuItems.push({
        title: "Tugas Akhir",
        url: "#",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar", url: "/tugas-akhir/seminar-hasil" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      menuItems.push({
        title: "Yudisium",
        url: "/yudisium",
        icon: GraduationCap,
        items: [],
      });

      // Jadwal Ketersediaan — leaf item
      menuItems.push({
        title: "Jadwal Ketersediaan",
        url: "/jadwal-ketersediaan",
        icon: Clock,
        items: [],
      });

      // Kelola Menu for GKM
      menuItems.push({
        title: "Kelola",
        url: "#",
        icon: Database,
        items: [
          { title: "Kelola CPL", url: "/kelola/cpl" }
        ],
      });

      // no Profil for gkm

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
            ],
          },
          {
            title: "Tugas Akhir",
            url: "#",
            icon: FileText,
            items: [
              {
                title: "Kelola",
                url: "/tugas-akhir/kelola",
              },
              {
                title: "Seminar Hasil",
                url: "/tugas-akhir/seminar-hasil",
              },
              {
                title: "Sidang",
                url: "/tugas-akhir/sidang",
              },
            ],
          },
          {
            title: "Yudisium",
            url: "/yudisium",
            icon: GraduationCap,
            items: [],
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
                title: "Kelola Ruangan",
                url: "/master-data/ruangan",
              },
              {
                title: "Kuota Bimbingan",
                url: "/master-data/kuota-bimbingan",
              },
              {
                title: "Data Hari Libur",
                url: "/master-data/hari-libur",
              },
            ],
          },
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
        },
      ],
      navSecondary: [],
    };
    // Only recompute when role flags or auth user identity change
  }, [
    // role flags
    isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing1, isDosenPengampuMetopel,
    // user deps
    authUser?.fullName, authUser?.email, authUser?.identityNumber,
    avatarBlobUrl,
    advisorAccess?.canOpenLogbook,
    advisorAccess?.hasOfficialSupervisor
  ]);

  return menuData;
};

