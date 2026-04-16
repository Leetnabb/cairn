import { useTranslation } from "react-i18next";
import { FadeIn, BarDivider, S, ctaStyle } from "../landingUtils";

interface CTASectionProps {
  isMobile: boolean;
}

export function CTASection({ isMobile }: CTASectionProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        padding: isMobile ? "80px 20px 100px" : "140px 48px 180px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <FadeIn>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
            <BarDivider />
          </div>
          <h2
            style={{
              ...S.serif,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 400,
              color: "var(--text-primary)",
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
              fontStyle: "italic",
            }}
          >
            {t("landing.cta.headline")}
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p
            style={{
              fontSize: 17,
              color: "var(--text-tertiary)",
              lineHeight: 1.7,
              marginBottom: 48,
            }}
          >
            {t("landing.cta.body")}
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <a
            href="/app"
            style={{ ...ctaStyle, fontSize: 15, padding: "14px 36px", display: "inline-block", textDecoration: "none" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {t("landing.cta.tryDemo")}
          </a>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-tertiary)",
              marginTop: 28,
              letterSpacing: "0.02em",
            }}
          >
            cairnpath.io
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
