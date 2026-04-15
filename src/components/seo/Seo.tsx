import { useEffect } from 'react';

export type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
};

const SITE_URL = 'https://neocentral.dev';
const DEFAULT_TITLE = 'NeoCentral — Platform Digital Kerja Praktek & Tugas Akhir';
const DEFAULT_DESCRIPTION =
  'Platform Digital untuk Kerja Praktek & Tugas Akhir Departemen Sistem Informasi Universitas Andalas. Kelola bimbingan, seminar, sidang, dan monitoring progress secara terstruktur dan transparan.';
const DEFAULT_OG_IMAGE = '/og-image.svg'; // TODO: Replace with /og-image.png when available
const DEFAULT_TWITTER_CARD = 'summary_large_image' as const;

export function Seo({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = DEFAULT_TWITTER_CARD,
  noindex = false,
}: SeoProps) {
  const fullTitle = title ? `${title} — NeoCentral` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = canonicalUrl || SITE_URL;
  const img = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper: set or update a meta tag
    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Helper: set or update a link tag
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // Core SEO
    setMeta('description', desc);
    if (keywords) setMeta('keywords', keywords);
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      // Remove any existing robots meta if it was set to noindex
      const robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (robotsMeta) robotsMeta.remove();
    }

    // Canonical
    setLink('canonical', url);

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:type', ogType, 'property');
    setMeta('og:site_name', 'NeoCentral', 'property');
    setMeta('og:locale', 'id_ID', 'property');
    if (img) setMeta('og:image', img.startsWith('http') ? img : `${SITE_URL}${img}`, 'property');

    // Twitter Card
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    if (img) setMeta('twitter:image', img.startsWith('http') ? img : `${SITE_URL}${img}`);

    // Cleanup on unmount (optional — next page will overwrite)
    return () => {};
  }, [fullTitle, desc, keywords, url, img, ogType, twitterCard, noindex]);

  return null;
}

// ─── Pre-configured SEO presets for public pages ──────────────────────────

export function LandingSeo() {
  return (
    <Seo
      title="NeoCentral"
      description="Platform Digital untuk Kerja Praktek & Tugas Akhir Departemen Sistem Informasi Universitas Andalas. Kelola bimbingan, seminar, sidang, dan monitoring progress."
      keywords="tugas akhir, kerja praktek, sistem informasi, universitas andalas, bimbingan ta, seminar hasil, sidang TA, monitoring akademik"
      canonicalUrl={SITE_URL}
      ogType="website"
      twitterCard="summary_large_image"
    />
  );
}

export function LoginSeo() {
  return (
    <Seo
      title="Masuk"
      description="Masuk ke NeoCentral — platform digital untuk Kerja Praktek & Tugas Akhir Departemen Sistem Informasi Universitas Andalas."
      canonicalUrl={`${SITE_URL}/login`}
      noindex
    />
  );
}

export function ResetPasswordSeo() {
  return (
    <Seo
      title="Reset Password"
      description="Atur ulang kata sandi akun NeoCentral Anda."
      canonicalUrl={`${SITE_URL}/reset-password`}
      noindex
    />
  );
}

export function NotFoundSeo() {
  return (
    <Seo
      title="Halaman Tidak Ditemukan"
      description="Halaman yang Anda cari tidak ditemukan. Kembali ke beranda NeoCentral."
      canonicalUrl={`${SITE_URL}/not-found`}
      noindex
    />
  );
}
