import { useTranslation } from "react-i18next";
import { FadeIn, S } from "../landingUtils";

interface InsightsSectionProps {
  isMobile: boolean;
}

// Skjevheten — distribution of dimension dots
function SkjevhetDots() {
  const dots = [
    { color: "#6366f1", count: 9 }, // teknologi
    { color: "#22c55e", count: 1 }, // virksomhet
    { color: "#eab308", count: 1 }, // organisasjon
    { color: "#ef4444", count: 1 }, // ledelse
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
      {dots.flatMap(({ color, count }) =>
        Array.from({ length: count }).map((_, i) => (
          <div
            key={`${color}-${i}`}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              opacity: 0.75,
            }}
          />
        ))
      )}
    </div>
  );
}

// Koblingene — connection icon
function ConnectionIcon() {
  return (
    <svg width={40} height={32} viewBox="0 0 40 32" fill="none" style={{ marginBottom: 16 }}>
      <circle cx={6} cy={16} r={4} stroke="#eab308" strokeWidth={1.5} opacity={0.7} />
      <circle cx={20} cy={8} r={4} stroke="#eab308" strokeWidth={1.5} opacity={0.7} />
      <circle cx={20} cy={24} r={4} stroke="#eab308" strokeWidth={1.5} opacity={0.7} />
      <circle cx={34} cy={16} r={4} stroke="#eab308" strokeWidth={1.5} opacity={0.3} />
      <line x1={10} y1={14} x2={16} y2={10} stroke="#eab308" strokeWidth={1} opacity={0.4} />
      <line x1={10} y1={18} x2={16} y2={22} stroke="#eab308" strokeWidth={1} opacity={0.4} />
      <line x1={24} y1={10} x2={30} y2={14} stroke="#eab308" strokeWidth={1} opacity={0.2} />
      <line x1={24} y1={22} x2={30} y2={18} stroke="#eab308" strokeWidth={1} opacity={0.2} />
    </svg>
  );
}

// Retningen — progress dots
function RetningDots() {
  const filled = [true, true, true, false, false];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {filled.map((f, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: f ? "#22c55e" : "transparent",
            border: `1.5px solid ${f ? "#22c55e" : "#3a4558"}`,
            opacity: f ? 0.8 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

export function InsightsSection({ isMobile }: InsightsSectionProps) {
  const { t } = useTranslation();

  const cards = [
    {
      borderColor: "#ef4444",
      titleKey: "landing.insights.card1.title",
      bodyKey: "landing.insights.card1.body",
      visual: <SkjevhetDots />,
    },
    {
      borderColor: "#eab308",
      titleKey: "landing.insights.card2.title",
      bodyKey: "landing.insights.card2.body",
      visual: <ConnectionIcon />,
    },
    {
      borderColor: "#22c55e",
      titleKey: "landing.insights.card3.title",
      bodyKey: "landing.insights.card3.body",
      visual: <RetningDots />,
    },
  ];

  return (
    <section
      style={{
        padding: isMobile ? "80px 20px 80px" : "140px 48px 160px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <FadeIn>
          <h2
            style={{
              ...S.serif,
              fontSize: "clamp(24px, 3.5vw, 38px)",
              fontWeight: 400,
              color: "#f1f5f9",
              marginBottom: 64,
              letterSpacing: "-0.02em",
            }}
          >
            {t("landing.insights.headline")}
          </h2>
        </FadeIn>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          {cards.map(({ borderColor, titleKey, bodyKey, visual }, i) => (
            <FadeIn key={titleKey} delay={0.1 * i}>
              <div
                style={{
                  padding: "36px 28px",
                  borderTop: `2px solid ${borderColor}`,
                  background: "rgba(255,255,255,0.02)",
                  minHeight: 220,
                }}
              >
                {visual}
                <h3
                  style={{
                    ...S.serif,
                    fontSize: 22,
                    fontWeight: 400,
                    color: "#e2e8f0",
                    marginBottom: 12,
                    lineHeight: 1.3,
                  }}
                >
                  {t(titleKey)}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {t(bodyKey)}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
