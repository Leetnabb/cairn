import { CairnMark } from "../CairnLogo";

interface LandingFooterProps {
  isMobile: boolean;
}

export function LandingFooter({ isMobile }: LandingFooterProps) {
  return (
    <footer
      style={{
        padding: isMobile ? "32px 20px" : "40px 48px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CairnMark size={0.38} />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              color: "var(--text-secondary)",
            }}
          >
            Cairn
          </span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 12 }}>
            &copy; 2026 · navigate the fog
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>cairnpath.io</span>
          {["Privacy", "Contact"].map((item) => (
            <span
              key={item}
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
