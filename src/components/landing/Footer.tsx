import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import logo from '@/assets/images/neocentral-logo.png';

export function Footer() {
  const quickLinks = [
    { name: 'BERANDA', href: '#' },
    { name: 'TENTANG', href: '#about' },
    { name: 'SOP', href: '#sop' },
    { name: 'KONTAK', href: '#contact' }
  ];

  const resources = [
    { name: 'PANDUAN', href: '#' },
    { name: 'FAQ', href: '#' },
    { name: 'SYARAT', href: '#' },
    { name: 'PRIVASI', href: '#' }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer id="contact" className="bg-black text-white pt-24 pb-12">
      <div className="container mx-auto px-6">
        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="w-full h-96 bg-gray-800 overflow-hidden rounded-3xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.3045858947486!2d100.35891607475981!3d-0.9147539354203653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7f8b0a6e4e5%3A0x3a5b0c5f0f6e8b0a!2sFakultas%20Teknologi%20Informasi%20Universitas%20Andalas!5e0!3m2!1sid!2sid!4v1703000000000!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Fakultas Teknologi Informasi Universitas Andalas"
              className="rounded-3xl"
            ></iframe>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img src={logo} alt="NeoCentral Logo" className="h-16 w-auto mb-6" />
            <p className="text-gray-400 leading-relaxed mb-8 text-lg">
              Platform SuperApp Departemen Sistem Informasi Universitas Andalas
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#F7931E] hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-xl font-black mb-8 uppercase">
              NAVIGASI
            </h4>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-400 hover:text-[#F7931E] transition-colors text-lg font-bold">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-xl font-black mb-8 uppercase">
              BANTUAN
            </h4>
            <ul className="space-y-4">
              {resources.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-400 hover:text-[#F7931E] transition-colors text-lg font-bold">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-xl font-black mb-8 uppercase">
              KONTAK
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#F7931E] shrink-0 mt-1" strokeWidth={2.5} />
                <span className="text-gray-400 text-lg leading-relaxed">
                  Fakultas Teknologi Informasi<br />
                  Universitas Andalas<br />
                  Padang, Sumatera Barat
                </span>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-[#F7931E] shrink-0" strokeWidth={2.5} />
                <a href="mailto:info@neocentral.unand.ac.id" className="text-gray-400 hover:text-[#F7931E] transition-colors text-lg">
                  info@neocentral.unand.ac.id
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-[#F7931E] shrink-0" strokeWidth={2.5} />
                <a href="tel:+62751123456" className="text-gray-400 hover:text-[#F7931E] transition-colors text-lg">
                  +62 751 123 456
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-lg font-semibold">
              © 2025 NEOCENTRAL. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-[#F7931E] transition-colors text-lg font-semibold">
                SYARAT
              </a>
              <a href="#" className="text-gray-400 hover:text-[#F7931E] transition-colors text-lg font-semibold">
                PRIVASI
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
