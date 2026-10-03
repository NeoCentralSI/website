import { Download, Eye, FileText } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './FadeIn';

type SopMeta = {
  key: string;
  title: string;
  description: string;
  url: string;
  fileName: string;
  size: number;
  pages: number;
};

// Public landing guides are independent of the managed SOP/template documents.
// Update the metadata below when replacing either bundled PDF.
const sopDocuments: SopMeta[] = [
  {
    key: 'SOP_KP',
    title: 'Panduan Kerja Praktik',
    description:
      'Panduan lengkap prosedur untuk Kerja Praktik mahasiswa Departemen Sistem Informasi',
    url: `${import.meta.env.BASE_URL}guides/panduan-kerja-praktik-2025.pdf`,
    fileName: 'Panduan Kerja Praktik 2025.pdf',
    size: 3042062,
    pages: 47,
  },
  {
    key: 'SOP_TA',
    title: 'Panduan Tugas Akhir',
    description:
      'Panduan lengkap prosedur untuk Tugas Akhir mahasiswa Departemen Sistem Informasi',
    url: `${import.meta.env.BASE_URL}guides/panduan-tugas-akhir-2025.pdf`,
    fileName: 'PANDUAN TUGAS AKHIR 2025_DAN LAMPIRAN.pdf',
    size: 12036396,
    pages: 87,
  },
];

function formatSize(size?: number) {
  if (!size) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(1)} ${units[idx]}`;
}

export function SOPSection() {
  return (
    <section id="sop" className="bg-[#1a1a1a] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-12 sm:mb-16">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Panduan <span className="text-[#F5A623]">SOP</span>
          </h2>
          <div className="mt-3 space-y-1">
            <p className="max-w-2xl font-body text-base leading-relaxed text-gray-400 sm:text-lg">
              Unduh dokumen panduan untuk Kerja Praktek dan Tugas Akhir.
            </p>
            <p className="max-w-2xl font-body text-sm text-gray-500">
              Catatan: Standar operasional yang lebih lengkap tersedia di Teams Departemen.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid gap-6 md:grid-cols-2">
          {sopDocuments.map((doc) => (
            <StaggerItem key={doc.key}>
              <div
                className="group space-y-5 rounded-sm border border-gray-700/40 bg-[#222]/80 px-6 py-6 backdrop-blur-sm transition-all duration-300 hover:border-[#F5A623]/30 hover:bg-[#282828]"
                style={{
                  boxShadow: '0 0 0 rgba(245,166,35,0)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 0 30px rgba(245,166,35,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 0 0 rgba(245,166,35,0)';
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/10 text-[#F5A623] transition-colors duration-300 group-hover:bg-[#F5A623]/15">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-white">{doc.title}</h3>
                      <p className="mt-1 font-body text-sm leading-relaxed text-gray-400">{doc.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-sm bg-gray-800 px-2.5 py-1 font-body text-xs font-medium text-gray-400">
                    PDF
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-body text-xs text-gray-500">
                  <span className="rounded-sm bg-[#2a2a2a] px-2 py-1">{formatSize(doc.size)}</span>
                  <span className="rounded-sm bg-[#2a2a2a] px-2 py-1">
                    {doc.pages} halaman
                  </span>
                  <span className="max-w-full break-words rounded-sm bg-[#2a2a2a] px-2 py-1">{doc.fileName}</span>
                </div>

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Lihat preview ${doc.title}`}
                  className="inline-flex items-center gap-2 font-body text-sm font-medium text-[#F5A623] transition-colors duration-200 hover:text-[#e0951a]"
                >
                  <Eye className="h-4 w-4" />
                  Lihat Preview
                </a>

                <a
                  href={doc.url}
                  download={doc.fileName}
                  aria-label={`Unduh ${doc.title}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#F5A623] px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e0951a]"
                >
                  <Download className="h-4 w-4" />
                  Unduh Panduan
                </a>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
