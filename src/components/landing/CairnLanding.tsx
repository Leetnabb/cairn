import { useState, useEffect, useRef } from "react";
import { S } from "./landingUtils";
import { LandingNav } from "./LandingNav";
import { LandingFooter } from "./LandingFooter";
import { HeroSection } from "./sections/HeroSection";
import { ProblemSection } from "./sections/ProblemSection";
import { ProductPreview } from "./sections/ProductPreview";
import { InsightsSection } from "./sections/InsightsSection";
import { DifferentiationSection } from "./sections/DifferentiationSection";
import { TestimonialSectionDefault } from "./sections/TestimonialSection";
import { CTASection } from "./sections/CTASection";
import { BarDivider } from "./landingUtils";

export default function CairnLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = windowWidth < 640;

  const scrollToCta = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div data-mode="board" style={S.page}>
      {/* Noise grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.025,
          pointerEvents: "none",
          zIndex: 100,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 1. Fixed navigation */}
      <LandingNav scrollY={scrollY} isMobile={isMobile} onCtaClick={scrollToCta} />

      {/* 2. Hero */}
      <HeroSection scrollY={scrollY} isMobile={isMobile} />

      {/* Divider */}
      <div style={{ padding: isMobile ? "0 20px" : "0 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <BarDivider align="left" />
        </div>
      </div>

      {/* 3. Problem */}
      <ProblemSection isMobile={isMobile} />

      {/* Divider */}
      <div style={{ padding: isMobile ? "0 20px" : "0 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <BarDivider align="left" />
        </div>
      </div>

      {/* 4. Product preview */}
      <ProductPreview isMobile={isMobile} />

      {/* Divider */}
      <div style={{ padding: isMobile ? "0 20px" : "0 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <BarDivider align="left" />
        </div>
      </div>

      {/* 5. Insights */}
      <InsightsSection isMobile={isMobile} />

      {/* Divider */}
      <div style={{ padding: isMobile ? "0 20px" : "0 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <BarDivider align="left" />
        </div>
      </div>

      {/* 6. Differentiation */}
      <DifferentiationSection isMobile={isMobile} />

      {/* 7. Testimonial (placeholder) */}
      <TestimonialSectionDefault isMobile={isMobile} />

      {/* 8. CTA */}
      <div ref={ctaRef}>
        <CTASection isMobile={isMobile} />
      </div>

      {/* 9. Footer */}
      <LandingFooter isMobile={isMobile} />
    </div>
  );
}
