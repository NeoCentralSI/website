import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Home, Lock, Mail, MapPin, Shield } from 'lucide-react';
import { LandingNavbar } from '@/components/landing';
import { Seo } from '@/components/seo';

type SitemapGroup = {
  icon: React.ElementType;
  title: string;
  description: string;
  links: { label: string; path: string; external?: boolean }[];
};

const sitemapGroups: SitemapGroup[] = [
  {
    icon: Home,
    title: 'Halaman Utama',
    description: 'Halaman publik yang dapat diakses semua pengunjung',
    links: [
      { label: 'Beranda', path: '/' },
      { label: 'Login', path: '/login' },
      { label: 'Reset Password', path: '/reset-password' },
    ],
  },
  {
    icon: Shield,
    title: 'Autentikasi',
    description: 'Halaman terkait aktivasi dan autentikasi akun',
    links: [
      { label: 'Email Aktivasi Terkirim', path: '/auth/activate/email-sent' },
      { label: 'Aktivasi Berhasil', path: '/auth/activate/success' },
      { label: 'Akun Tidak Aktif', path: '/auth/inactive' },
    ],
  },
  {
    icon: FileText,
    title: 'Verifikasi Publik',
    description: 'Halaman verifikasi yang dapat diakses tanpa login',
    links: [
      { label: 'Verifikasi Surat Kerja Praktik', path: '/verify/internship-letter' },
      { label: 'Penilaian Lapangan', path: '/field-assessment' },
    ],
  },
  {
    icon: Lock,
    title: 'Area Terproteksi (Memerlukan Login)',
    description: 'Halaman yang hanya dapat diakses setelah autentikasi',
    links: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Profil', path: '/profil' },
      { label: 'Kerja Praktek', path: '/kerja-praktik' },
      { label: 'Tugas Akhir', path: '/tugas-akhir' },
      { label: 'Seminar', path: '/seminar' },
      { label: 'Sidang', path: '/sidang' },
      { label: 'Bimbingan', path: '/bimbingan' },
      { label: 'Logbook', path: '/logbook' },
      { label: 'Yudisium', path: '/yudisium' },
      { label: 'Monitoring', path: '/monitoring' },
      { label: 'Inbox', path: '/inbox' },
    ],
  },
  {
    icon: Mail,
    title: 'Administrasi & Pengelola',
    description: 'Halaman administrasi untuk role tertentu',
    links: [
      { label: 'Kelola Mahasiswa', path: '/kelola/mahasiswa' },
      { label: 'Kelola Dosen', path: '/kelola/dosen' },
      { label: 'Kelola CPL', path: '/kelola/cpl' },
      { label: 'Kelola Metopen', path: '/kelola/metopen' },
      { label: 'Sekretaris Departemen', path: '/sekretaris-departemen' },
      { label: 'Kabag Departemen', path: '/kabag-departemen' },
      { label: 'DSS', path: '/dss' },
    ],
  },
  {
    icon: MapPin,
    title: 'Eksternal',
    description: 'Tautan ke situs eksternal',
    links: [
      { label: 'Universitas Andalas', path: 'https://www.unand.ac.id/', external: true },
      { label: 'Fakultas Teknologi Informasi', path: 'https://fti.unand.ac.id/', external: true },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Peta Situs"
        description="Peta situs lengkap NeoCentral — Platform Digital untuk Kerja Praktek & Tugas Akhir Departemen Sistem Informasi Universitas Andalas."
        canonicalUrl="https://neocentral.unand.ac.id/sitemap"
        noindex
      />
      <LandingNavbar />

      <main className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-12 space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Peta <span className="text-[#F5A623]">Situs</span>
          </h1>
          <p className="max-w-2xl font-body text-base leading-relaxed text-gray-500 sm:text-lg">
            Navigasi lengkap semua halaman di NeoCentral — Platform Digital untuk Kerja Praktek &amp; Tugas Akhir Departemen Sistem Informasi Universitas Andalas.
          </p>
        </div>

        {/* XML Sitemap link */}
        <div className="mb-12 rounded-sm border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="font-body text-sm text-gray-600">
            Butuh sitemap untuk crawler? Lihat{' '}
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#F5A623] underline underline-offset-2 transition-colors hover:text-[#e0951a]"
            >
              sitemap.xml
            </a>{' '}
            atau{' '}
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#F5A623] underline underline-offset-2 transition-colors hover:text-[#e0951a]"
            >
              robots.txt
            </a>
            .
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {sitemapGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5A623]/10 text-[#F5A623]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-gray-900">{group.title}</h2>
                    <p className="font-body text-sm text-gray-500">{group.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 pl-[52px]">
                  {group.links.map((link) => (
                    <li key={link.path}>
                      {link.external ? (
                        <a
                          href={link.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 font-body text-sm text-gray-600 transition-colors hover:text-[#F5A623]"
                        >
                          {link.label}
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      ) : (
                        <Link
                          to={link.path}
                          className="font-body text-sm text-gray-600 transition-colors hover:text-[#F5A623]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
