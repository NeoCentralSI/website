import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import logo from '@/assets/images/logo.png';

const navLinks = [
  { label: 'Tentang', href: '#about' },
  { label: 'Topik', href: '#topics' },
  { label: 'SOP', href: '#sop' },
  { label: 'Kontak', href: '#contact' },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrolledState = isScrolled || isOpen;
  const navTextClass = scrolledState ? 'text-gray-900' : 'text-white';
  const navBarClass = scrolledState
    ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60'
    : 'bg-transparent';

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${navBarClass}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="NeoCentral Logo" className="h-9 w-auto" />
          <span className={`hidden font-display text-base font-bold sm:inline ${navTextClass}`}>NeoCentral</span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`font-body text-sm font-medium transition-colors hover:text-[#F7931E] ${navTextClass}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center lg:flex">
          <Link
            to="/login"
            className="rounded-lg bg-[#F7931E] px-5 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[#E08319]"
          >
            MASUK
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg lg:hidden ${navTextClass}`}
          aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-t border-gray-200/80 bg-white px-4 py-4 shadow-md lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 font-body text-sm font-medium text-gray-700 transition-colors hover:bg-[#FFF8F0] hover:text-[#F7931E]"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="mt-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[#E08319]"
              >
                MASUK
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

