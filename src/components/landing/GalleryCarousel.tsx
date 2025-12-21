import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
  {
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc2NjMyMDk2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Sistem Pendukung Keputusan'
  },
  {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGludGVsbGlnZW5jZSUyMGRhdGF8ZW58MXx8fHwxNzY2MzIwOTY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Business Intelligence'
  },
  {
    url: 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRldmVsb3BtZW50JTIwY29kaW5nfGVufDF8fHx8MTc2NjI0NTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Pengembangan Sistem'
  },
  {
    url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWNoaW5lJTIwbGVhcm5pbmclMjBBSXxlbnwxfHx8fDE3NjYzMjA5Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Machine Learning'
  },
  {
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnRlcnByaXNlJTIwc3lzdGVtJTIwYnVzaW5lc3N8ZW58MXx8fHwxNzY2MzIwOTY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Enterprise System'
  }
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
    }, 3000);

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
    <section className="py-32 bg-white overflow-hidden relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24 text-center"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-black mb-8 leading-none">
            TOPIK<br/>
            <span className="text-[#F7931E]">TUGAS AKHIR</span>
          </h2>
          <p className="text-2xl text-gray-600 max-w-2xl font-semibold mx-auto">
            Bidang penelitian dan pengembangan di Departemen Sistem Informasi
          </p>
        </motion.div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getVisibleImages().map((image, index) => (
                <motion.div
                  key={`${currentIndex}-${index}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative group overflow-hidden rounded-2xl"
                >
                  <div className="aspect-4/3 overflow-hidden rounded-2xl">
                    <img 
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8 rounded-2xl">
                    <h3 className="text-2xl font-black text-white">
                      {image.title}
                    </h3>
                  </div>
                  {/* Orange accent line */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#F7931E] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-b-2xl" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#F7931E] text-white p-4 rounded-full hover:bg-[#E08319] transition-all z-10 hidden md:block"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#F7931E] text-white p-4 rounded-full hover:bg-[#E08319] transition-all z-10 hidden md:block"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={3} />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-12">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-3 transition-all rounded-full ${
                  index === currentIndex 
                    ? 'w-8 bg-[#F7931E]' 
                    : 'w-3 bg-gray-300 hover:bg-[#F7931E]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[20rem] font-black text-gray-50 leading-none pointer-events-none opacity-50">
        IT
      </div>
    </section>
  );
}
