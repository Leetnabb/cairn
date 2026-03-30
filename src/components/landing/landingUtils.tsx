// Shared utilities for landing page components
import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Base components ──────────────────────────────────────────────────────────

export function FadeIn({
  children,
  delay = 0,
  style = {},
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Four bars as a recurring structural divider motif
export function BarDivider({ align = "center" }: { align?: "left" | "center" }) {
  const bars = [
    { w: 16, c: "#ef4444" },
    { w: 26, c: "#22c55e" },
    { w: 36, c: "#eab308" },
    { w: 46, c: "#6366f1" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: align === "center" ? "center" : "flex-start" }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{ width: b.w, height: 3, borderRadius: 2, background: b.c, opacity: 0.35 }}
        />
      ))}
    </div>
  );
}

// Animated logo for hero — bars rise bottom to top on page load
export function HeroMark() {
  const [phase, setPhase] = useState(0);
  const [lineW, setLineW] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 900);
    const t4 = setTimeout(() => setPhase(4), 1200);
    const tl = setTimeout(() => setLineW(120), 1600);
    return () => [t1, t2, t3, t4, tl].forEach(clearTimeout);
  }, []);

  const bars = [
    { w: 46, c: "#6366f1", phase: 1 }, // Technology — bottom, first
    { w: 36, c: "#eab308", phase: 2 }, // Organisation
    { w: 26, c: "#22c55e", phase: 3 }, // Business
    { w: 16, c: "#ef4444", phase: 4 }, // Leadership — top, last
  ];

  // Rendered top→bottom for correct visual stacking (narrow on top)
  const barsTopDown = [...bars].reverse();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <svg width={64} height={64} viewBox="0 0 64 64" fill="none">
        {barsTopDown.map((bar, i) => (
          <rect
            key={i}
            x={(64 - bar.w) / 2}
            y={8 + i * 14}
            width={bar.w}
            height={9}
            rx={3.5}
            fill={bar.c}
            style={{
              opacity: phase >= bar.phase ? 0.9 : 0,
              transform: phase >= bar.phase ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          />
        ))}
      </svg>
      {/* Path extending rightward */}
      <div
        style={{
          height: 1,
          width: lineW,
          background: "linear-gradient(90deg, rgba(99,102,241,0.5) 0%, transparent 100%)",
          transition: "width 1.2s ease",
          marginLeft: 2,
        }}
      />
    </div>
  );
}

// ── Style tokens ─────────────────────────────────────────────────────────────

export const S: Record<string, CSSProperties> = {
  page: {
    background: "var(--bg-app)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    overflowX: "hidden",
  },
  serif: { fontFamily: "var(--font-serif)" },
  muted: { color: "var(--text-secondary)" },
  dim: { color: "var(--text-tertiary)" },
  accent: { color: "var(--accent)" },
};

export const ctaStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  background: "var(--accent)",
  padding: "12px 28px",
  borderRadius: 5,
  cursor: "pointer",
  textDecoration: "none",
  letterSpacing: "0.01em",
  transition: "all 0.2s",
  border: "none",
  fontFamily: "var(--font-body)",
};

export const DIMENSION_COLORS: Record<string, string> = {
  ledelse: "#ef4444",
  virksomhet: "#22c55e",
  organisasjon: "#eab308",
  teknologi: "#6366f1",
};
