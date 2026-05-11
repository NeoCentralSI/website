import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FadeIn } from './FadeIn';

const images = [
  {
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    title: 'Sistem Pendukung Keputusan (SPK)',
    category: 'Data Science',
  },
  {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    title: 'Business Intelligence (BI)',
    category: 'Enterprise',
  },
  {
    url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80',
    title: 'Pengembangan Sistem (Enterprise Application)',
    category: 'Web Development',
  },
  {
    url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80',
    title: 'Machine Learning',
    category: 'AI',
  },
  {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    title: 'Enterprise System',
    category: 'Infrastructure',
  },
];

export function GalleryCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getVisibleImages = () => {
    const visible = [];
    for (let i = 0; i < slidesToShow; i++) {
      visible.push(images[(currentIndex + i) % images.length]);
    }
    return visible;
  };

  return (
    <section id="topics" className="bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-12 text-center sm:mb-16">
          <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
            Topik <span className="text-[#F7931E]">Tugas Akhir</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-body text-base leading-relaxed text-gray-500">
            Bidang penelitian dan pengembangan di Departemen Sistem Informasi
          </p>
        </FadeIn>

        <div className="relative">
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {getVisibleImages().map((image, index) => (
                <motion.div
                  key={`${currentIndex}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <h3 className="font-display text-lg font-semibold text-gray-900">{image.title}</h3>
                    <span className="inline-flex rounded-full bg-[#FFF1E2] px-2.5 py-1 font-body text-xs font-medium text-[#C26B09]">
                      {image.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-3 text-gray-700 shadow-md transition-all duration-200 hover:text-[#F7931E] md:block"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-3 text-gray-700 shadow-md transition-all duration-200 hover:text-[#F7931E] md:block"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <div className="mt-8 flex justify-center gap-2 sm:mt-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all ${
                  index === currentIndex ? 'h-3 w-3 bg-[#F7931E]' : 'h-2 w-2 bg-gray-300 hover:bg-[#F2C189]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
