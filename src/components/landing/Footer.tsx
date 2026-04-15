import { motion } from 'motion/react';
import { ExternalLink, Instagram, Linkedin, Mail, MapPin, Phone, Globe } from 'lucide-react';
import logo from '@/assets/images/neocentral-logo.png';
import { FadeIn } from './FadeIn';

export function Footer() {
  const quickLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Tentang', href: '#about' },
    { name: 'Topik', href: '#topics' },
    { name: 'SOP', href: '#sop' },
  ];

  const resources = [
    { name: 'Panduan SOP', href: '#sop' },
    { name: 'Login NeoCentral', href: '/login' },
    { name: 'Website Universitas Andalas', href: 'https://www.unand.ac.id/' },
  ];

  const socialLinks = [
    { icon: Globe, href: 'https://www.unand.ac.id/', label: 'Website Universitas Andalas' },
    { icon: Instagram, href: 'https://www.instagram.com/unandofficial/', label: 'Instagram Universitas Andalas' },
    { icon: Linkedin, href: 'https://www.linkedin.com/school/universitas-andalas/', label: 'LinkedIn Universitas Andalas' },
  ];

  return (
    <>
      {/* Lokasi Kampus — full-bleed campus photo with overlaid info */}
      <section id="contact" className="relative flex min-h-[60vh] items-center overflow-hidden">
        {/* Background campus photo */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <FadeIn>
            <div className="max-w-xl space-y-4">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Lokasi <span className="text-[#F5A623]">Kampus</span>
              </h2>
              <p className="font-body text-base leading-relaxed text-white/80 sm:text-lg">
                Fakultas Teknologi Informasi, Universitas Andalas, Padang.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5 text-white/70">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-[#F5A623]" />
                  <span className="font-body text-sm leading-relaxed">
                    Limau Manis, Padang, Sumatera Barat 25163
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-white/70">
                  <Phone className="h-4 w-4 flex-shrink-0 text-[#F5A623]" />
                  <span className="font-body text-sm">+62 751 123 456</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/70">
                  <Mail className="h-4 w-4 flex-shrink-0 text-[#F5A623]" />
                  <a href="mailto:info@neocentral.unand.ac.id" className="font-body text-sm text-white/80 transition-colors hover:text-white">
                    info@neocentral.unand.ac.id
                  </a>
                </div>
              </div>
              <a
                href="https://maps.google.com/maps?q=Fakultas%20Teknologi%20Informasi%20Universitas%20Andalas"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-sm border border-white/25 bg-white/10 px-5 py-3 font-body text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
              >
                <ExternalLink className="h-4 w-4" />
                Buka di Google Maps
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Dark footer with subtle photographic texture */}
      <footer className="relative overflow-hidden bg-gray-950 py-16 text-white">
        {/* Barely-visible campus photo as texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="h-full w-full object-cover grayscale"
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <img src={logo} alt="NeoCentral Logo" className="h-12 w-auto brightness-0 invert" />
              <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-gray-400">
                Platform akademik untuk monitoring Kerja Praktek dan Tugas Akhir Departemen Sistem Informasi.
              </p>
              <div className="mt-5 flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-800 text-gray-500 transition-colors duration-200 hover:border-[#F5A623]/40 hover:text-[#F5A623]"
                      aria-label={social.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h4 className="font-display text-base font-semibold text-white">Navigasi</h4>
              <ul className="mt-4 space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-body text-sm text-gray-500 transition-colors duration-200 hover:text-white"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h4 className="font-display text-base font-semibold text-white">Bantuan</h4>
              <ul className="mt-4 space-y-2.5">
                {resources.map((resource) => (
                  <li key={resource.href}>
                    <a
                      href={resource.href}
                      className="font-body text-sm text-gray-500 transition-colors duration-200 hover:text-white"
                    >
                      {resource.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h4 className="font-display text-base font-semibold text-white">Kontak</h4>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#F5A623]" />
                  <span className="font-body text-sm leading-relaxed text-gray-400">
                    Fakultas Teknologi Informasi Universitas Andalas, Padang
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#F5A623]" />
                  <a
                    href="mailto:info@neocentral.unand.ac.id"
                    className="font-body text-sm text-gray-500 transition-colors duration-200 hover:text-white"
                  >
                    info@neocentral.unand.ac.id
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-[#F5A623]" />
                  <a
                    href="tel:+62751123456"
                    className="font-body text-sm text-gray-500 transition-colors duration-200 hover:text-white"
                  >
                    +62 751 123 456
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="relative z-10 mt-12 border-t border-gray-800/60 pt-6">
            <p className="font-body text-sm text-gray-600">&copy; 2025 NeoCentral. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
