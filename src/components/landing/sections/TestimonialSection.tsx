import { FadeIn, S } from "../landingUtils";

interface TestimonialSectionProps {
  quote: string;
  author: string;
  title: string;
  org: string;
  isMobile: boolean;
}

export function TestimonialSection({
  quote,
  author,
  title,
  org,
  isMobile,
}: TestimonialSectionProps) {
  return (
    <section
      data-placeholder="true"
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
              color: "#1e293b",
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
              fontSize: "clamp(20px, 2.8vw, 28px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#94a3b8",
              lineHeight: 1.55,
              margin: "0 0 40px",
              letterSpacing: "-0.01em",
            }}
          >
            {quote}
          </blockquote>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 32,
                height: 1,
                background: "rgba(255,255,255,0.12)",
                marginBottom: 12,
              }}
            />
            <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>
              — {author}
            </span>
            {(title || org) && (
              <span style={{ fontSize: 13, color: "#334155" }}>
                {title && org ? `${title}, ${org}` : title || org}
              </span>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// Default export with placeholder content
export function TestimonialSectionDefault({ isMobile }: { isMobile: boolean }) {
  return (
    <TestimonialSection
      isMobile={isMobile}
      quote="Vi brukte Cairn i ledergruppen for første gang. Etter ti minutter så vi at 80% av initiativene våre var teknologi. Ingen eide organisasjonsendringen. Den samtalen hadde vi aldri tatt uten dette bildet."
      author="[Tittel]"
      title=""
      org="[Organisasjon]"
    />
  );
}
