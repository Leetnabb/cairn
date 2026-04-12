import { useTranslation } from "react-i18next";
import { FadeIn, S } from "../landingUtils";

interface TestimonialSectionProps {
  isMobile: boolean;
}

export function TestimonialSectionDefault({ isMobile }: TestimonialSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        padding: isMobile ? "80px 20px 80px" : "120px 48px 140px",
        position: "relative",
      }}
    >
      {/* Subtle ambient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <FadeIn>
          {/* Opening quote mark */}
          <div
            style={{
              ...S.serif,
              fontSize: 80,
              color: "var(--text-tertiary)",
              lineHeight: 0.6,
              marginBottom: 32,
              fontStyle: "italic",
              userSelect: "none",
            }}
          >
            &ldquo;
          </div>

          <blockquote
            style={{
              ...S.serif,
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              margin: "0 0 32px",
              letterSpacing: "-0.01em",
            }}
          >
            {t("landing.testimonial.quote")}
          </blockquote>

          <div
            style={{
              width: 32,
              height: 1,
              background: "rgba(255,255,255,0.12)",
              margin: "0 auto 20px",
            }}
          />

          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 18px)",
              color: "var(--text-tertiary)",
              lineHeight: 1.65,
              maxWidth: 540,
              margin: "0 auto",
            }}
          >
            {t("landing.testimonial.subtext")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
