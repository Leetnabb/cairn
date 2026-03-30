import { useTranslation } from "react-i18next";
import { FadeIn, S } from "../landingUtils";

interface DifferentiationSectionProps {
  isMobile: boolean;
}

export function DifferentiationSection({ isMobile }: DifferentiationSectionProps) {
  const { t } = useTranslation();

  const cards = [
    { key: "landing.differentiation.card1" },
    { key: "landing.differentiation.card2" },
    { key: "landing.differentiation.card3" },
  ];

  return (
    <section
      style={{
        padding: isMobile ? "80px 20px 80px" : "140px 48px 160px",
        background: "rgba(255,255,255,0.018)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-tertiary)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 56,
            }}
          >
            {t("landing.differentiation.eyebrow")}
          </p>
        </FadeIn>

        {/* Muted "not this" cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 16 : 2,
            marginBottom: 72,
          }}
        >
          {cards.map(({ key }, i) => (
            <FadeIn key={key} delay={0.08 * i}>
              <div
                style={{
                  padding: "32px 24px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.01)",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#ef4444",
                    opacity: 0.5,
                    marginRight: 8,
                  }}
                >
                  ✕
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--text-tertiary)",
                    lineHeight: 1.6,
                    fontStyle: "italic",
                  }}
                >
                  {t(key)}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Strong closing line */}
        <FadeIn delay={0.3}>
          <div
            style={{
              paddingTop: 48,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              maxWidth: 680,
            }}
          >
            <p
              style={{
                ...S.serif,
                fontSize: "clamp(22px, 3vw, 34px)",
                fontWeight: 400,
                color: "var(--text-primary)",
                lineHeight: 1.35,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {t("landing.differentiation.closing")}
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
