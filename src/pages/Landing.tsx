import {
  HeroSection,
  MarqueeSection,
  AboutSection,
  GalleryCarousel,
  SOPSection,
  Footer,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="bg-white">
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <GalleryCarousel />
      <SOPSection />
      <Footer />
    </div>
  );
}
