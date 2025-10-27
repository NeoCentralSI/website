import {
  Briefcase,
  Database,
  FileText,
  SquareTerminal
} from "lucide-react";
import { useRole } from './useRole';
import { useAuth } from './useAuth';

export const useSidebarMenu = () => {
  const { isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing1 } = useRole();
  const { user: authUser } = useAuth();

  const getMenuData = () => {
    // Get user initials for avatar fallback
    const getInitials = (name?: string) => {
      if (!name) return 'U';
      const parts = name.split(' ').filter(Boolean);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last).toUpperCase();
    };

    // STUDENT MENU
    if (isStudent()) {
      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: "/avatars/student.jpg",
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
            title: "Kerja Praktek",
            url: "/kerja-praktik",
            icon: Briefcase,
            items: [
              {
                title: "Pendaftaran",
                url: "/kerja-praktik/pendaftaran",
              },
              {
                title: "Log Book",
                url: "/kerja-praktik/logbook",
              },
              {
                title: "Seminar",
                url: "/kerja-praktik/seminar",
              },
            ],
          },
          {
            title: "Tugas Akhir",
            url: "/tugas-akhir",
            icon: FileText,
            items: [
              {
                title: "Metodologi Penelitian (Metopel)",
                url: "/metopel",
              },
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
        ],
        navSecondary: [],
      };
    }

    // LECTURER (NORMAL) MENU
    if (isDosen() && !isKadep() && !isSekdep() && !isGkm()) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktek",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Tugas Akhir (selalu ada), Metopel muncul jika Pembimbing 1
      const tugasAkhirItems = [
        ...(isPembimbing1()
          ? [
              {
                title: "Metopel",
                url: "/metopel",
              },
            ]
          : []),
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
          avatar: "/avatars/lecturer.jpg",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // LECTURER (KADEP) MENU
    if (isKadep()) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktek",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "ACC Proposal",
              url: "/kerja-praktik/acc-proposal",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Tugas Akhir
      const tugasAkhirItems = [
        ...(isPembimbing1()
          ? [
              {
                title: "Metopel",
                url: "/metopel",
              },
            ]
          : []),
        { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
        { title: "Seminar", url: "/tugas-akhir/seminar" },
        { title: "Sidang", url: "/tugas-akhir/sidang" },
        { title: "Kelola Penguji", url: "/tugas-akhir/kelola-penguji" },
        { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        { title: "ACC Pembimbing", url: "/tugas-akhir/acc-pembimbing" },
        { title: "ACC Rubrik Penilaian", url: "/tugas-akhir/acc-rubrik" },
      ];

      menuItems.push({
        title: "Tugas Akhir",
        url: "/tugas-akhir",
        icon: FileText,
        items: tugasAkhirItems,
      });

      // no Profil for kadep

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: "/avatars/kadep.jpg",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // LECTURER (SEKDEP) MENU
    if (isSekdep()) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktek",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "ACC Proposal",
              url: "/kerja-praktik/acc-proposal",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Tugas Akhir
      const tugasAkhirItems = [
        ...(isPembimbing1()
          ? [
              {
                title: "Metopel",
                url: "/metopel",
              },
            ]
          : []),
        { title: "Bimbingan", url: "/tugas-akhir/bimbingan" },
        { title: "Seminar", url: "/tugas-akhir/seminar" },
        { title: "Sidang", url: "/tugas-akhir/sidang" },
        { title: "Monitoring", url: "/tugas-akhir/monitoring" },
        { title: "Kelola Rubrik", url: "/tugas-akhir/kelola-rubrik" },
        { title: "Kelola Yudisium", url: "/tugas-akhir/kelola-yudisium" },
      ];

      menuItems.push({
        title: "Tugas Akhir",
        url: "/tugas-akhir",
        icon: FileText,
        items: tugasAkhirItems,
      });

      // no Profil for sekdep

      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: "/avatars/sekdep.jpg",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // LECTURER (GKM) MENU
    if (isGkm()) {
      const menuItems = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
        {
          title: "Kerja Praktek",
          url: "/kerja-praktik",
          icon: Briefcase,
          items: [
            {
              title: "ACC Proposal",
              url: "/kerja-praktik/acc-proposal",
            },
            {
              title: "Bimbingan",
              url: "/kerja-praktik/bimbingan",
            },
            {
              title: "Seminar",
              url: "/kerja-praktik/seminar",
            },
          ],
        },
      ];

      // Menu Tugas Akhir
      const tugasAkhirItems = [
        ...(isPembimbing1()
          ? [
              {
                title: "Metopel",
                url: "/metopel",
              },
            ]
          : []),
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
          avatar: "/avatars/gkm.jpg",
          initials: getInitials(authUser?.fullName),
        },
        navMain: menuItems,
        navSecondary: [],
      };
    }

    // ADMIN DEPARTEMEN MENU
    if (isAdmin()) {
      return {
        user: {
          name: authUser?.fullName || "User",
          email: authUser?.email || "user@example.com",
          avatar: "/avatars/admin.jpg",
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
            title: "Kerja Praktek",
            url: "/kerja-praktik",
            icon: Briefcase,
            items: [
              {
                title: "Kelola Surat Pengantar",
                url: "/kerja-praktik/surat-pengantar",
              },
              {
                title: "Data KP",
                url: "/kerja-praktik/data",
              },
            ],
          },
          {
            title: "Tugas Akhir",
            url: "/tugas-akhir",
            icon: FileText,
            items: [
              {
                title: "Data Tugas Akhir",
                url: "/tugas-akhir/data",
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
        avatar: "/avatars/user.jpg",
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
  };

  return getMenuData();
};
