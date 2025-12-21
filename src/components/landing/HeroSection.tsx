import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import logo from '@/assets/images/neocentral-logo.png';

const heroImages = [
  'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRldmVsb3BtZW50JTIwY29kaW5nfGVufDF8fHx8MTc2NjI0NTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1751551525897-d34215e47785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMHdvcmtzcGFjZSUyMGNvbXB1dGVyfGVufDF8fHx8MTc2NjMyMDk2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1662583945886-768c90d1db32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJVCUyMHRlY2hub2xvZ3klMjBvZmZpY2V8ZW58MXx8fHwxNzY2MzIwOTY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1637937459053-c788742455be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGUlMjBzY3JlZW58ZW58MXx8fHwxNzY2Mjk2MTEwfDA&ixlib=rb-4.1.0&q=80&w=1080',
];

export function HeroSection() {
  const containerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="NeoCentral Logo" className="h-14 w-auto" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex gap-12"
          >
            <a href="#about" className="text-black hover:text-[#F7931E] transition-colors font-semibold">TENTANG</a>
            <a href="#sop" className="text-black hover:text-[#F7931E] transition-colors font-semibold">SOP</a>
            <a href="#contact" className="text-black hover:text-[#F7931E] transition-colors font-semibold">KONTAK</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/login"
              className="bg-[#F7931E] text-white px-8 py-3 rounded-full hover:bg-[#E08319] transition-all font-bold inline-block"
            >
              MASUK
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-40">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            style={{ opacity }}
            className="space-y-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl md:text-8xl lg:text-9xl font-black text-black leading-none tracking-tight"
            >
              NEO<br/>
              <span className="text-[#F7931E]">CENTRAL</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl text-black leading-relaxed font-bold"
            >
              Platform Digital untuk Kerja Praktek & Tugas Akhir
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg text-gray-600 leading-relaxed max-w-lg"
            >
              Departemen Sistem Informasi Universitas Andalas
            </motion.p>
          </motion.div>

          <motion.div
            style={{ y }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Image Carousel */}
            <div className="relative overflow-hidden rounded-3xl aspect-4/3">
              {heroImages.map((image, index) => (
                <motion.img
                  key={index}
                  src={image}
                  alt={`Software Development ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: index === currentImageIndex ? 1 : 0,
                    scale: index === currentImageIndex ? 1 : 1.1,
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              ))}
              
              {/* Dots Indicator */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 transition-all rounded-full ${
                      index === currentImageIndex 
                        ? 'w-8 bg-[#F7931E]' 
                        : 'w-2 bg-white/60 hover:bg-white'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Decorative Orange Block */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#F7931E] rounded-3xl -z-10"></div>
          </motion.div>
        </div>
      </div>

      {/* Large Text Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "50%"]) }}
          className="text-[20rem] font-black text-gray-50 leading-none whitespace-nowrap"
        >
          NEOCENTRAL
        </motion.div>
      </div>
    </div>
  );
}
