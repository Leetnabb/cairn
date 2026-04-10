import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FadeIn, S, DIMENSION_COLORS } from "../landingUtils";
import { landingPreviewData } from "../../../data/landingPreviewData";
import type { Horizon } from "../../../types";

interface ProductPreviewProps {
  isMobile: boolean;
}

type Dimension = "ledelse" | "virksomhet" | "organisasjon" | "teknologi";

const DIMENSION_ORDER: Dimension[] = ["ledelse", "virksomhet", "organisasjon", "teknologi"];

// Initiative name translations (keyed by initiative id)
const INITIATIVE_NAMES_EN: Record<string, string> = {
  l1: "New governance model",
  v1: "Customer portal 2.0",
  v2: "Automated reporting",
  o1: "Digital capability uplift",
  t1: "Cloud migration phase 2",
  t2: "API platform",
  t3: "IAM modernization",
  t4: "Data platform",
  t5: "DevOps pipeline",
  t6: "Legacy decommissioning",
  t7: "Integration platform",
  t8: "AI/ML capability",
  t9: "Security program",
};

export function ProductPreview({ isMobile }: ProductPreviewProps) {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Use English names when language is 'en', otherwise keep original Norwegian
  const getInitiativeName = (id: string, fallback: string) =>
    i18n.language === 'en' ? (INITIATIVE_NAMES_EN[id] ?? fallback) : fallback;

  // Group initiatives by dimension + horizon
  const byDimHorizon = (dim: Dimension, horizon: Horizon) =>
    landingPreviewData.initiatives.filter(
      (i) => i.dimension === dim && i.horizon === horizon
    );

  const handleCardClick = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="solution"
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
              color: "var(--accent)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {t("landing.product.eyebrow")}
          </p>
          <h2
            style={{
              ...S.serif,
              fontSize: "clamp(26px, 3.8vw, 42px)",
              fontWeight: 400,
              color: "var(--text-primary)",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            {t("landing.product.headline")}
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "var(--text-tertiary)",
              maxWidth: 560,
              margin: "0 0 60px",
            }}
          >
            {t("landing.product.body")}
          </p>
        </FadeIn>

        {/* Strategy Path visualization */}
        <FadeIn delay={0.1}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: isMobile ? "24px 16px" : "32px 36px",
              overflowX: "auto",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 1fr",
                gap: isMobile ? 8 : 16,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {t("landing.product.nearHorizon")}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {t("landing.product.farHorizon")}
              </div>
            </div>

            {/* Dimension rows */}
            {DIMENSION_ORDER.map((dim, dimIdx) => {
              const color = DIMENSION_COLORS[dim];
              const nearItems = byDimHorizon(dim, "near");
              const farItems = byDimHorizon(dim, "far");
              const allItems = [...nearItems, ...farItems];

              return (
                <div
                  key={dim}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 1fr",
                    gap: isMobile ? 8 : 16,
                    marginBottom: dimIdx < 3 ? 16 : 0,
                    alignItems: "start",
                  }}
                >
                  {/* Dimension label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      paddingTop: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: 32,
                        borderRadius: 2,
                        background: color,
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {t(`labels.dimensions.${dim}`)}
                    </span>
                  </div>

                  {/* Near horizon cards */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {nearItems.map((item, cardIdx) => (
                      <InitiativeCard
                        key={item.id}
                        id={item.id}
                        name={getInitiativeName(item.id, item.name)}
                        color={color}
                        selected={selectedId === item.id}
                        animDelay={dimIdx * 0.08 + cardIdx * 0.05}
                        onClick={() => handleCardClick(item.id)}
                        allItems={allItems}
                        selectedId={selectedId}
                      />
                    ))}
                    {nearItems.length === 0 && (
                      <div
                        style={{
                          height: 36,
                          minWidth: 80,
                          borderRadius: 4,
                          border: "1px dashed rgba(255,255,255,0.06)",
                        }}
                      />
                    )}
                  </div>

                  {/* Far horizon cards */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {farItems.map((item, cardIdx) => (
                      <InitiativeCard
                        key={item.id}
                        id={item.id}
                        name={getInitiativeName(item.id, item.name)}
                        color={color}
                        selected={selectedId === item.id}
                        animDelay={dimIdx * 0.08 + cardIdx * 0.05 + 0.15}
                        onClick={() => handleCardClick(item.id)}
                        allItems={allItems}
                        selectedId={selectedId}
                      />
                    ))}
                    {farItems.length === 0 && (
                      <div
                        style={{
                          height: 36,
                          minWidth: 80,
                          borderRadius: 4,
                          border: "1px dashed rgba(255,255,255,0.06)",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Interaction hint */}
        <FadeIn delay={0.3}>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-tertiary)",
              textAlign: "center",
              marginTop: 20,
              letterSpacing: "0.02em",
            }}
          >
            {t("landing.product.hint")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Initiative Card ──────────────────────────────────────────────────────────

interface InitiativeCardProps {
  id: string;
  name: string;
  color: string;
  selected: boolean;
  animDelay: number;
  onClick: () => void;
  allItems: { id: string }[];
  selectedId: string | null;
}

function InitiativeCard({
  id: _id,
  name,
  color,
  selected,
  animDelay,
  onClick,
  selectedId,
}: InitiativeCardProps) {
  const [hovered, setHovered] = useState(false);
  const dimmed = selectedId !== null && !selected;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "6px 10px",
        borderRadius: 5,
        background: selected
          ? `${color}18`
          : hovered
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)",
        border: selected
          ? `1px solid ${color}55`
          : `1px solid rgba(255,255,255,${hovered ? "0.1" : "0.06"})`,
        boxShadow: selected ? `0 0 12px ${color}25` : "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: dimmed ? 0.3 : 1,
        // Staggered fade-in
        animation: `fadeInUp 0.5s ease ${animDelay}s both`,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          opacity: 0.8,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: selected ? "var(--text-primary)" : "var(--text-secondary)",
          fontWeight: selected ? 600 : 400,
          whiteSpace: "nowrap",
          transition: "color 0.2s",
        }}
      >
        {name}
      </span>
    </div>
  );
}
