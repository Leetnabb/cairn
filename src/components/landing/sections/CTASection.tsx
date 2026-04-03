import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FadeIn, BarDivider, S, ctaStyle } from "../landingUtils";

interface CTASectionProps {
  isMobile: boolean;
}

export function CTASection({ isMobile }: CTASectionProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubmitted(true);
  };

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
          {submitted ? (
            <p
              style={{
                fontSize: 15,
                color: "#22c55e",
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              {t("landing.cta.submitted")}
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("landing.cta.emailPlaceholder")}
                required
                style={{
                  fontSize: 14,
                  padding: "12px 16px",
                  borderRadius: 5,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                  width: isMobile ? "100%" : 280,
                  textAlign: "center",
                }}
              />
              <button
                type="submit"
                style={{ ...ctaStyle, fontSize: 15, padding: "14px 36px" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {t("landing.cta.button")}
              </button>
            </form>
          )}
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
