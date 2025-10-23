import {
  Briefcase,
  Database,
  GraduationCap,
  SquareTerminal,
  User
} from "lucide-react";
import { useRole } from './useRole';

export const useSidebarMenu = () => {
  const { isStudent, isDosen, isKadep, isSekdep, isGkm, isAdmin, isPembimbing1 } = useRole();

  const getMenuData = () => {
    // STUDENT MENU
    if (isStudent()) {
      return {
        user: {
          name: "Mahasiswa",
          email: "student@example.com",
          avatar: "/avatars/student.jpg",
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
            icon: GraduationCap,
            items: [
              {
                title: "Metodologi Penelitian",
                url: "/tugas-akhir/metopel",
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
                url: "/tugas-akhir/yudisium",
              },
            ],
          },
        ],
        navSecondary: [
          {
            title: "Profil",
            url: "/profil",
            icon: User,
          },
        ],
        projects: [],
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
        {
          title: "Tugas Akhir",
          url: "/tugas-akhir",
          icon: GraduationCap,
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
          ],
        },
      ];

      // Tambahkan Metopel jika status supervisor = "Pembimbing 1"
      if (isPembimbing1()) {
        menuItems[2].items?.unshift({
          title: "Metodologi Penelitian",
          url: "/tugas-akhir/metopel",
        });
      }

      return {
        user: {
          name: "Dosen",
          email: "lecturer@example.com",
          avatar: "/avatars/lecturer.jpg",
        },
        navMain: menuItems,
        navSecondary: [
          {
            title: "Profil",
            url: "/profil",
            icon: User,
          },
        ],
        projects: [],
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
        {
          title: "Tugas Akhir",
          url: "/tugas-akhir",
          icon: GraduationCap,
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
              title: "Kelola Penguji",
              url: "/tugas-akhir/kelola-penguji",
            },
            {
              title: "Monitoring",
              url: "/tugas-akhir/monitoring",
            },
            {
              title: "ACC Pembimbing",
              url: "/tugas-akhir/acc-pembimbing",
            },
            {
              title: "ACC Rubrik Penilaian",
              url: "/tugas-akhir/acc-rubrik",
            },
          ],
        },
      ];

      // Tambahkan Metopel jika status supervisor = "Pembimbing 1"
      if (isPembimbing1()) {
        menuItems[2].items?.unshift({
          title: "Metodologi Penelitian",
          url: "/tugas-akhir/metopel",
        });
      }

      return {
        user: {
          name: "Kepala Departemen",
          email: "kadep@example.com",
          avatar: "/avatars/kadep.jpg",
        },
        navMain: menuItems,
        navSecondary: [
          {
            title: "Profil",
            url: "/profil",
            icon: User,
          },
        ],
        projects: [],
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
        {
          title: "Tugas Akhir",
          url: "/tugas-akhir",
          icon: GraduationCap,
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
              title: "Monitoring",
              url: "/tugas-akhir/monitoring",
            },
            {
              title: "Kelola Rubrik",
              url: "/tugas-akhir/kelola-rubrik",
            },
            {
              title: "Kelola Yudisium",
              url: "/tugas-akhir/kelola-yudisium",
            },
          ],
        },
      ];

      // Tambahkan Metopel jika status supervisor = "Pembimbing 1"
      if (isPembimbing1()) {
        menuItems[2].items?.unshift({
          title: "Metodologi Penelitian",
          url: "/tugas-akhir/metopel",
        });
      }

      return {
        user: {
          name: "Sekretaris Departemen",
          email: "sekdep@example.com",
          avatar: "/avatars/sekdep.jpg",
        },
        navMain: menuItems,
        navSecondary: [
          {
            title: "Profil",
            url: "/profil",
            icon: User,
          },
        ],
        projects: [],
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
        {
          title: "Tugas Akhir",
          url: "/tugas-akhir",
          icon: GraduationCap,
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
              title: "Monitoring",
              url: "/tugas-akhir/monitoring",
            },
          ],
        },
      ];

      // Tambahkan Metopel jika status supervisor = "Pembimbing 1"
      if (isPembimbing1()) {
        menuItems[2].items?.unshift({
          title: "Metodologi Penelitian",
          url: "/tugas-akhir/metopel",
        });
      }

      return {
        user: {
          name: "GKM",
          email: "gkm@example.com",
          avatar: "/avatars/gkm.jpg",
        },
        navMain: menuItems,
        navSecondary: [
          {
            title: "Profil",
            url: "/profil",
            icon: User,
          },
        ],
        projects: [],
      };
    }

    // ADMIN DEPARTEMEN MENU
    if (isAdmin()) {
      return {
        user: {
          name: "Admin Departemen",
          email: "admin@example.com",
          avatar: "/avatars/admin.jpg",
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
            icon: GraduationCap,
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
        navSecondary: [
          {
            title: "Profil",
            url: "/profil",
            icon: User,
          },
        ],
        projects: [],
      };
    }

    // Default menu jika tidak ada role yang cocok
    return {
      user: {
        name: "User",
        email: "user@example.com",
        avatar: "/avatars/user.jpg",
      },
      navMain: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareTerminal,
          isActive: true,
        },
      ],
      navSecondary: [
        {
          title: "Profil",
          url: "/profil",
          icon: User,
        },
      ],
      projects: [],
    };
  };

  return getMenuData();
};
