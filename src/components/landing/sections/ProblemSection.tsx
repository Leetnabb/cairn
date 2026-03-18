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

        <FadeIn delay={0.2}>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: "#475569",
              maxWidth: 600,
              margin: "0 0 64px",
              fontWeight: 400,
            }}
          >
            {t("landing.problem.body1")}
          </p>
        </FadeIn>

        {/* The three silos */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 580,
            marginBottom: 64,
          }}
        >
          {(
            [
              { key: "silo1", color: "#eab308" },
              { key: "silo2", color: "#6366f1" },
              { key: "silo3", color: "#ef4444" },
            ] as const
          ).map(({ key, color }, i) => (
            <FadeIn key={key} delay={0.1 * i}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 3,
                    minHeight: 20,
                    borderRadius: 2,
                    background: color,
                    opacity: 0.6,
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 15,
                    color: "#64748b",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  {t(`landing.problem.${key}`)}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* The conclusion — dynamic strategy */}
        <FadeIn delay={0.3}>
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
