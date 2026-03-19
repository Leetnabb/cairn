import { useTranslation } from "react-i18next";
import { FadeIn, S } from "../landingUtils";

interface ProblemSectionProps {
  isMobile: boolean;
}

export function ProblemSection({ isMobile }: ProblemSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        padding: isMobile ? "80px 20px 80px" : "140px 48px 160px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Dramatic opening — the tåken framing */}
        <FadeIn>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "#475569",
              maxWidth: 620,
              margin: "0 0 56px",
              fontWeight: 400,
            }}
          >
            {t("landing.problem.context")}
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            style={{
              ...S.serif,
              fontSize: "clamp(26px, 3.8vw, 42px)",
              fontWeight: 400,
              lineHeight: 1.2,
              color: "#cbd5e1",
              letterSpacing: "-0.02em",
              margin: "0 0 24px",
              fontStyle: "italic",
            }}
          >
            {t("landing.problem.headline")}
          </h2>
        </FadeIn>

        {/* The conclusion */}
        <FadeIn delay={0.2}>
          <p
            style={{
              ...S.serif,
              fontSize: "clamp(20px, 2.8vw, 28px)",
              fontStyle: "italic",
              color: "#94a3b8",
              lineHeight: 1.45,
              maxWidth: 620,
              margin: 0,
            }}
          >
            {t("landing.problem.closing")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
