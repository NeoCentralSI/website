import {
  BookOpen,
  Briefcase,
  Database,
  FileText,
  SquareTerminal
} from "lucide-react";
import { useMemo } from "react";
import { useRole } from '@/hooks/shared';
import { useAuth } from '@/hooks/shared';
import { useQuery } from "@tanstack/react-query";
import { getCachedStudentsFromSia } from "@/services/sia.service";
import { useAvatarBlob } from "@/hooks/profile";

export const useSidebarMenu = () => {
  const { isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing1 } = useRole();
  const { user: authUser } = useAuth();
  const nim = authUser?.identityNumber;

  const avatarBlobUrl = useAvatarBlob(authUser?.avatarUrl);

  const { data: siaStudents } = useQuery({
    queryKey: ["sia-cached-students"],
    queryFn: getCachedStudentsFromSia,
    enabled: !!nim && isStudent(),
    staleTime: 5 * 60 * 1000,
  });

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
      const studentNav: any[] = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        // Kerja Praktik - always show with submenus
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "Pendaftaran",
              url: "/kerja-praktik/pendaftaran",
            },
            {
              title: "Kegiatan",
              url: "/kerja-praktik/logbook",
            },
            {
              title: "Seminar & Nilai",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
        // Metode Penelitian - always show
        {
          title: "Metode Penelitian",
          url: "/metopel",
          icon: BookOpen,
          items: [],
        },
        // Tugas Akhir - always show with submenus
        {
          title: "Tugas Akhir",
          url: "/tugas-akhir",
          icon: FileText,
          items: [
            {
              title: "Bimbingan",
              url: "/tugas-akhir/bimbingan",
            },
            {
              title: "Seminar",
              url: "/tugas-akhir/seminar",
            },
            {
              title: "Sidang",
              url: "/tugas-akhir/sidang",
            },
            {
              title: "Yudisium",
              url: "/yudisium",
            },
          ],
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
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "Monitoring",
              url: "/kerja-praktik/monitoring",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar & Nilai",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Metode Penelitian (hanya untuk Pembimbing 1)
      if (role.pembimbing1) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "/metopel",
          icon: BookOpen,
          items: [],
        });
      }

      // Menu Tugas Akhir (selalu ada)
      const tugasAkhirItems = [
        { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
        { title: "Seminar", url: "/tugas-akhir/seminar" },
        { title: "Sidang", url: "/tugas-akhir/sidang" },
      ];

      menuItems.push({
        title: "Tugas Akhir",
        url: "/tugas-akhir",
        icon: FileText,
        items: tugasAkhirItems,
      });

      // no Profil for lecturer normal

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
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "Monitoring",
              url: "/kerja-praktik/monitoring",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar & Nilai",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Metode Penelitian (hanya untuk Pembimbing 1)
      if (role.pembimbing1) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "/metopel",
          icon: BookOpen,
          items: [],
        });
      }

      // Menu Tugas Akhir (hanya aktivitas dosen)
      menuItems.push({
        title: "Tugas Akhir",
        url: "/tugas-akhir",
        icon: FileText,
        items: [
          { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
          { title: "Seminar", url: "/tugas-akhir/seminar" },
          { title: "Sidang", url: "/tugas-akhir/sidang" },
          { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        ],
      });

      // Menu Kelola (fitur manajemen Kadep)
      menuItems.push({
        title: "Kelola",
        url: "/kelola",
        icon: Database,
        items: [
          { title: "Tugas Akhir", url: "/kelola/tugas-akhir/kadep" },
          { title: "Kelola Perusahaan", url: "/kelola/perusahaan" },
          { title: "Kerja Praktik", url: "/kelola/kerja-praktik" },
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
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "Monitoring",
              url: "/kerja-praktik/monitoring",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar & Nilai",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Metode Penelitian (hanya untuk Pembimbing 1)
      if (role.pembimbing1) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "/metopel",
          icon: BookOpen,
          items: [],
        });
      }

      // Menu Tugas Akhir
      const tugasAkhirItems = [
        { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
        { title: "Seminar", url: "/tugas-akhir/seminar" },
        { title: "Sidang", url: "/tugas-akhir/sidang" },
        { title: "Monitoring", url: "/tugas-akhir/monitoring" },
      ];

      menuItems.push({
        title: "Tugas Akhir",
        url: "/tugas-akhir",
        icon: FileText,
        items: tugasAkhirItems,
      });

      menuItems.push({
        title: "Kelola",
        url: "/kelola",
        icon: Database,
        items: [
          { title: "Kelola Perusahaan", url: "/kelola/perusahaan" },
          { title: "Kerja Praktik", url: "/kelola/kerja-praktik" },
          { title: "Tugas Akhir", url: "/kelola/tugas-akhir" },
          { title: "Yudisium", url: "/kelola/yudisium" },
          { title: "Kelola Panduan", url: "/kelola/sop" },
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
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktik",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "Monitoring",
              url: "/kerja-praktik/monitoring",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar & Nilai",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Metode Penelitian (hanya untuk Pembimbing 1)
      if (role.pembimbing1) {
        menuItems.push({
          title: "Metode Penelitian",
          url: "/metopel",
          icon: BookOpen,
          items: [],
        });
      }

      // Menu Tugas Akhir
      const tugasAkhirItems = [
        { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
        { title: "Seminar", url: "/tugas-akhir/seminar" },
        { title: "Sidang", url: "/tugas-akhir/sidang" },
        { title: "Monitoring", url: "/tugas-akhir/monitoring" },
      ];

      menuItems.push({
        title: "Tugas Akhir",
        url: "/tugas-akhir",
        icon: FileText,
        items: tugasAkhirItems,
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
            url: "/kerja-praktik",
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
                title: "Surat Balasan",
                url: "/admin/kerja-praktik/surat-balasan",
              },
              {
                title: "Seminar & Nilai",
                url: "/admin/kerja-praktik/seminar",
              },
            ],
          },
          {
            title: "Tugas Akhir",
            url: "/tugas-akhir",
            icon: FileText,
            items: [
              {
                title: "Kelola",
                url: "/tugas-akhir/kelola",
              },
              {
                title: "Penjadwalan Seminar",
                url: "/tugas-akhir/jadwal-seminar",
              },
              {
                title: "Penjadwalan Sidang",
                url: "/tugas-akhir/jadwal-sidang",
              },
            ],
          },
          {
            title: "Master Data",
            url: "/master-data",
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
                title: "Kelola User",
                url: "/master-data/user",
              },
              {
                title: "Kelola Tahun Ajaran",
                url: "/master-data/tahun-ajaran",
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
    isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing1,
    // user deps
    authUser?.fullName, authUser?.email, authUser?.identityNumber,
    avatarBlobUrl,
    siaStudents
  ]);

  return menuData;
};
