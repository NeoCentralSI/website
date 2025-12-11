import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { useRef } from 'react';

const carouselImages = [
  {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop',
    alt: 'Students learning',
  },
  {
    url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop',
    alt: 'Education technology',
  },
  {
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop',
    alt: 'Collaboration',
  },
];

export function LoginCarousel() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="relative hidden bg-muted lg:block">
      <Carousel
        plugins={[plugin.current]}
        className="h-screen"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {carouselImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="h-screen relative">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="absolute bottom-0 left-0 right-0 p-10 text-white z-10">
        <blockquote className="space-y-2">
          <p className="text-lg">
            "Sistem informasi tugas akhir yang memudahkan mahasiswa dan dosen dalam mengelola proses bimbingan."
          </p>
          <footer className="text-sm">Neo Central - Sistem Informasi DSI</footer>
        </blockquote>
      </div>
    </div>
  );
}
