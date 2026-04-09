import { useTranslation } from "react-i18next";
import { FadeIn, HeroMark, S, ctaStyle } from "../landingUtils";

interface HeroSectionProps {
  scrollY: number;
  isMobile: boolean;
}

export function HeroSection({ scrollY, isMobile }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: isMobile ? "100px 20px 60px" : "120px 48px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 70% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />
      {/* Fog wisps */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${52 + i * 14}%`,
            left: `${-10 + i * 10}%`,
            width: "130%",
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${
              0.025 - i * 0.006
            }) 40%, transparent 100%)`,
            transform: `translateX(${Math.sin(scrollY * 0.0015 + i) * 20}px)`,
          }}
        />
      ))}

      <div style={{ maxWidth: 760, position: "relative", zIndex: 2 }}>
        {/* Animated logo mark */}
        <div style={{ marginBottom: 48 }}>
          <HeroMark />
        </div>

        <FadeIn delay={0.2}>
          <h1
            style={{
              ...S.serif,
              fontSize: "clamp(36px, 5.5vw, 62px)",
              fontWeight: 400,
              lineHeight: 1.1,
              margin: "0 0 28px",
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
              fontStyle: "italic",
            }}
          >
            {t("landing.hero.headline")}
          </h1>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              maxWidth: 480,
              margin: "0 0 8px",
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}
          >
            {t("landing.hero.subline1")}
          </p>
        </FadeIn>

        <FadeIn delay={0.5}>
          <p
            style={{
              ...S.serif,
              fontStyle: "italic",
              fontSize: 16,
              color: "var(--text-tertiary)",
              marginBottom: 44,
            }}
          >
            {t("landing.hero.subline2")}
          </p>
        </FadeIn>

        <FadeIn delay={0.7}>
          <div style={{ marginBottom: 16 }}>
            <a
              href="/app"
              style={{ ...ctaStyle, fontSize: 15, padding: "13px 32px", display: "inline-block", textDecoration: "none" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {t("landing.hero.tryDemo", "Prøv demo")}
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: scrollY > 80 ? 0 : 0.35,
          transition: "opacity 0.4s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 1,
            height: 40,
            background: "linear-gradient(to bottom, transparent, #475569)",
          }}
        />
        <svg width={12} height={8} viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
