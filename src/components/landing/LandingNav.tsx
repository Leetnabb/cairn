import { useTranslation } from "react-i18next";
import { CairnMark } from "../CairnLogo";
import { ctaStyle } from "./landingUtils";

interface LandingNavProps {
  scrollY: number;
  isMobile: boolean;
  onCtaClick: () => void;
}

export function LandingNav({ scrollY, isMobile, onCtaClick }: LandingNavProps) {
  const { t, i18n } = useTranslation();
  const scrolled = scrollY > 60;

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "nb" ? "en" : "nb");
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: isMobile ? "16px 20px" : "20px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: scrolled ? "rgba(10,15,26,0.88)" : "transparent", // intentional alpha overlay, not a token
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid transparent",
        transition: "all 0.4s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CairnMark size={0.5} />
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 20,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Cairn
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* Early access badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 20,
            padding: "4px 10px",
            display: isMobile ? "none" : "inline-block",
          }}
        >
          {t("landing.nav.earlyAccess")}
        </span>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            padding: "5px 10px",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            transition: "color 0.2s, border-color 0.2s",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          {i18n.language === "nb" ? "EN" : "NO"}
        </button>

        {/* CTA */}
        {!isMobile && (
          <button
            onClick={onCtaClick}
            style={ctaStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {t("landing.nav.cta")}
          </button>
        )}
      </div>
    </nav>
  );
}
