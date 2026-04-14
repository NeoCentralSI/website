import { motion } from 'motion/react';
import { Globe, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
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
      <section id="contact" className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="space-y-4">
            <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              Lokasi <span className="text-[#F7931E]">Kampus</span>
            </h2>
            <p className="font-body text-base text-gray-600">
              Fakultas Teknologi Informasi, Universitas Andalas, Padang.
            </p>
          </FadeIn>
          <FadeIn className="mt-6">
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <iframe
                src="https://maps.google.com/maps?q=Fakultas%20Teknologi%20Informasi%20Universitas%20Andalas&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Fakultas Teknologi Informasi Universitas Andalas"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="bg-gray-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <img src={logo} alt="NeoCentral Logo" className="h-12 w-auto" />
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-800 text-gray-400 transition-colors duration-200 hover:text-[#F7931E]"
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
                      className="font-body text-sm text-gray-400 transition-colors duration-200 hover:text-white"
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
                      className="font-body text-sm text-gray-400 transition-colors duration-200 hover:text-white"
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
                  <MapPin className="mt-0.5 h-4 w-4 text-[#F7931E]" />
                  <span className="font-body text-sm leading-relaxed text-gray-400">
                    Fakultas Teknologi Informasi Universitas Andalas, Padang
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#F7931E]" />
                  <a
                    href="mailto:info@neocentral.unand.ac.id"
                    className="font-body text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    info@neocentral.unand.ac.id
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-[#F7931E]" />
                  <a
                    href="tel:+62751123456"
                    className="font-body text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    +62 751 123 456
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-6">
            <p className="font-body text-sm text-gray-500">© 2025 NeoCentral. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

