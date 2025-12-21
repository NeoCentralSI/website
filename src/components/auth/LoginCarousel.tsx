import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/images/neocentral-logo.png';

const carouselImages = [
  {
    url: 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    alt: 'Software development coding',
  },
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    alt: 'Students collaboration',
  },
  {
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    alt: 'University learning',
  },
];

export function LoginCarousel() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative hidden bg-[#FFF8F0] lg:block h-screen overflow-hidden">
      {/* Background Images with Fade Transition */}
      {carouselImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#F7931E]/80 via-[#F7931E]/30 to-transparent" />
        </div>
      ))}

      {/* Logo & Branding - Clickable to Landing */}
      <Link to="/" className="absolute top-8 left-8 z-10 hover:opacity-80 transition-opacity">
        <img src={logo} alt="NeoCentral Logo" className="h-16 w-auto" />
      </Link>

      <div className="absolute bottom-0 left-0 right-0 p-10 text-white z-10">
        <blockquote className="space-y-3">
          <p className="text-xl font-medium leading-relaxed">
            "Sistem informasi tugas akhir yang memudahkan mahasiswa dan dosen dalam mengelola proses bimbingan."
          </p>
          <footer className="text-sm font-semibold text-white/90">
            Neo Central - Departemen Sistem Informasi
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
