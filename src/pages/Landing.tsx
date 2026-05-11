import {
  LandingNavbar,
  HeroSection,
  MarqueeSection,
  AboutSection,
  TopicsSection,
  SOPSection,
  Footer,
} from '@/components/landing';
import { LandingSeo } from '@/components/seo';

export default function LandingPage() {
  return (
    <div className="bg-white">
      <LandingSeo />
      <LandingNavbar />
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <TopicsSection />
      <SOPSection />
      <Footer />
    </div>
  );
}
