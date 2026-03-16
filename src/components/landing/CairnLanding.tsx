import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { CairnMark } from "../CairnLogo";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
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

function FadeIn({
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
function BarDivider({ align = "center" }: { align?: "left" | "center" }) {
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
function HeroMark() {
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

const S: Record<string, CSSProperties> = {
  page: {
    background: "#0a0f1a",
    color: "#f1f5f9",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    overflowX: "hidden",
  },
  serif: { fontFamily: "'Instrument Serif', Georgia, serif" },
  muted: { color: "#94a3b8" },
  dim: { color: "#3a4558" },
  accent: { color: "#6366f1" },
};

const ctaStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  background: "#6366f1",
  padding: "12px 28px",
  borderRadius: 5,
  cursor: "pointer",
  textDecoration: "none",
  letterSpacing: "0.01em",
  transition: "all 0.2s",
  border: "none",
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CairnLanding() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={S.page}>

      {/* Noise grain overlay */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.025, pointerEvents: "none", zIndex: 100,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "20px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrollY > 60 ? "rgba(10,15,26,0.88)" : "transparent",
        backdropFilter: scrollY > 60 ? "blur(20px)" : "none",
        borderBottom: scrollY > 60 ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CairnMark size={0.5} />
          <span style={{ ...S.serif, fontSize: 20, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Cairn</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[
            { label: "Product", href: "#solution" },
            { label: "For whom", href: "#audience" },
            { label: "About", href: "#narrative" },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontSize: 13, color: "#64748b", fontWeight: 500, textDecoration: "none", transition: "color 0.2s", letterSpacing: "0.01em" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
            >{item.label}</a>
          ))}
          <a
            href="mailto:hello@cairnpath.io"
            style={ctaStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#4f46e5"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#6366f1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >Request early access</a>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "120px 48px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 70% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        {/* Fog wisps */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: "absolute",
            top: `${52 + i * 14}%`,
            left: `${-10 + i * 10}%`,
            width: "130%",
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${0.025 - i * 0.006}) 40%, transparent 100%)`,
            transform: `translateX(${Math.sin(scrollY * 0.0015 + i) * 20}px)`,
          }} />
        ))}

        <div style={{ maxWidth: 760, position: "relative", zIndex: 2 }}>
          {/* Animated logo mark */}
          <div style={{ marginBottom: 48 }}>
            <HeroMark />
          </div>

          <FadeIn delay={0.2}>
            <h1 style={{
              ...S.serif,
              fontSize: "clamp(40px, 6vw, 68px)",
              fontWeight: 400,
              lineHeight: 1.08,
              margin: "0 0 28px",
              letterSpacing: "-0.025em",
              color: "#f1f5f9",
            }}>
              When the fog rolls in,<br />
              you don&rsquo;t need a better map.<br />
              <span style={{ ...S.serif, fontStyle: "italic", color: "#6366f1" }}>You need a cairn.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: "#64748b", maxWidth: 520, margin: "0 0 16px", fontWeight: 400 }}>
              Cairn turns strategy into a living path — connecting priorities,
              capabilities, and initiatives into one navigable picture your
              leadership team actually uses.
            </p>
          </FadeIn>

          <FadeIn delay={0.55}>
            <p style={{ ...S.serif, fontStyle: "italic", fontSize: 16, color: "#3a4558", marginBottom: 44 }}>
              From cairn to cairn. Always forward.
            </p>
          </FadeIn>

          <FadeIn delay={0.7}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <a
                href="mailto:hello@cairnpath.io"
                style={{ ...ctaStyle, fontSize: 15, padding: "13px 32px" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#4f46e5"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#6366f1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >Request early access</a>
              <a
                href="#solution"
                style={{ fontSize: 14, color: "#475569", fontWeight: 500, textDecoration: "none", transition: "color 0.2s", letterSpacing: "0.01em" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
              >See how it works ↓</a>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          opacity: scrollY > 80 ? 0 : 0.3, transition: "opacity 0.4s",
        }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, #475569)", margin: "0 auto" }} />
        </div>
      </section>

      {/* ── 2. The Problem ── */}
      <section style={{ padding: "140px 48px 160px", position: "relative" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <FadeIn>
            <BarDivider />
            <h2 style={{
              ...S.serif,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 400, lineHeight: 1.25,
              color: "#cbd5e1", letterSpacing: "-0.02em",
              margin: "48px 0 24px",
            }}>
              Every organization has a strategy.<br />
              <span style={{ color: "#3a4558" }}>Most can&rsquo;t tell you if it&rsquo;s actually moving.</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "#475569", maxWidth: 580, margin: "0 0 64px", fontWeight: 400 }}>
              The initiatives are running. The projects are green.<br />
              And yet — six months later — the organization hasn&rsquo;t changed.<br />
              The problem isn&rsquo;t execution.<br />
              It&rsquo;s that no one can see the path.
            </p>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
            {[
              "Why are we doing this initiative?",
              "What capability are we building?",
              "How does this connect to our strategy?",
              "Is our strategy actually progressing?",
            ].map((q, i) => (
              <FadeIn key={i} delay={0.1 * i}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: ["#ef4444", "#22c55e", "#eab308", "#6366f1"][i], opacity: 0.7, marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: "#64748b", lineHeight: 1.5, fontWeight: 400 }}>{q}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. The Solution ── */}
      <section id="solution" style={{ padding: "140px 48px 160px", background: "rgba(255,255,255,0.018)", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>The solution</p>
            <h2 style={{ ...S.serif, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "#f1f5f9", marginBottom: 24, letterSpacing: "-0.02em" }}>
              Not a better map. A path.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "#475569", maxWidth: 560, margin: "0 0 80px", fontWeight: 400 }}>
              Cairn turns strategy into a living path of execution.
              Instead of disconnected initiatives, you see how everything
              connects — and why it matters.
            </p>
          </FadeIn>

          {/* Causal chain — the key visual */}
          <FadeIn delay={0.1}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0, marginBottom: 56 }}>
              {[
                { label: "Strategy", color: "#ef4444" },
                { label: "Capabilities", color: "#22c55e" },
                { label: "Initiatives", color: "#eab308" },
                { label: "Effects", color: "#6366f1" },
              ].map((node, i, arr) => (
                <div key={node.label} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    padding: "24px 32px",
                    borderRadius: 8,
                    background: `${node.color}09`,
                    border: `1px solid ${node.color}25`,
                    textAlign: "center",
                    minWidth: 148,
                    position: "relative",
                  }}>
                    <div style={{ width: 28, height: 3, borderRadius: 2, background: node.color, opacity: 0.75, margin: "0 auto 12px" }} />
                    <div style={{ ...S.serif, fontSize: 20, color: "#cbd5e1", fontWeight: 400 }}>{node.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", width: 44, flexShrink: 0 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                      <span style={{ color: "#334155", fontSize: 14, margin: "0 2px" }}>→</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#475569", maxWidth: 580 }}>
              Every initiative has a clear strategic purpose.
              Every capability shows where the organization is headed.
              The path from decision to effect is never more than one click away.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── 4. Leadership Value ── */}
      <section style={{ padding: "140px 48px 160px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>Leadership value</p>
            <h2 style={{ ...S.serif, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "#f1f5f9", marginBottom: 24, letterSpacing: "-0.02em", maxWidth: 680 }}>
              Built for the meeting before the meeting.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "#475569", maxWidth: 560, margin: "0 0 80px" }}>
              Cairn is what you open the evening before the board meeting —
              not to update slides, but to see if the strategy is actually
              moving. And if it isn&rsquo;t, to know exactly why.
            </p>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {[
              {
                heading: "See the path",
                body: "Connect strategy to execution in one living picture.",
                color: "#22c55e",
              },
              {
                heading: "Find where it breaks",
                body: "See which capabilities lack momentum — before it's too late.",
                color: "#eab308",
              },
              {
                heading: "Defend the decisions",
                body: "Walk into the boardroom with a clear narrative, not just project status.",
                color: "#6366f1",
              },
            ].map((col, i) => (
              <FadeIn key={col.heading} delay={0.1 * i}>
                <div style={{
                  padding: "40px 32px",
                  borderTop: `2px solid ${col.color}40`,
                  background: "rgba(255,255,255,0.015)",
                }}>
                  <h3 style={{ ...S.serif, fontSize: 22, fontWeight: 400, color: "#e2e8f0", marginBottom: 12 }}>{col.heading}</h3>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>{col.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div style={{ marginTop: 72, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.05)", maxWidth: 640 }}>
              <p style={{ ...S.serif, fontSize: 22, color: "#94a3b8", lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>
                Instead of asking: &ldquo;What projects are we running?&rdquo;<br />
                You can ask: &ldquo;Are we building the organization we need?&rdquo;
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 5. How Cairn Works ── */}
      <section id="audience" style={{ padding: "140px 48px 160px", background: "rgba(255,255,255,0.018)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <FadeIn>
            <BarDivider align="left" />
            <h2 style={{ ...S.serif, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "#f1f5f9", margin: "48px 0 56px", letterSpacing: "-0.02em" }}>
              The path, made visible.
            </h2>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {[
              {
                label: "Start with what matters.",
                body: "Define your strategic priorities and the capabilities your organization must build. Not lists — direction.",
                color: "#ef4444",
              },
              {
                label: "Connect work to direction.",
                body: "Map initiatives to capabilities. Not tasks — strategic moves. Each one justified by where it leads.",
                color: "#22c55e",
              },
              {
                label: "Read the path, not the plan.",
                body: "Capability maturity, strategic dependencies, and effects — visible in one place. Not as a snapshot. As a living picture.",
                color: "#6366f1",
              },
            ].map((step, i) => (
              <FadeIn key={step.label} delay={0.1 * i}>
                <div style={{ display: "grid", gridTemplateColumns: "4px 1fr", gap: 28, alignItems: "start" }}>
                  <div style={{ width: 4, height: "100%", minHeight: 60, borderRadius: 2, background: step.color, opacity: 0.5, marginTop: 4 }} />
                  <div>
                    <h3 style={{ ...S.serif, fontSize: 22, fontWeight: 400, color: "#cbd5e1", marginBottom: 10, lineHeight: 1.3 }}>{step.label}</h3>
                    <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.75, margin: 0, maxWidth: 520 }}>{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Brand Narrative ── */}
      <section id="narrative" style={{ padding: "140px 48px 160px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ ...S.serif, fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, color: "#f1f5f9", marginBottom: 40, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              When the terrain gets complex,<br />
              <span style={{ color: "#6366f1" }}>follow the cairns.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p style={{ fontSize: 17, lineHeight: 1.85, color: "#475569", margin: "0 0 28px" }}>
              In mountain landscapes, cairns mark the path when the trail disappears.
              They don&rsquo;t tell you where to go.
              They confirm you&rsquo;re still moving in the right direction.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.85, color: "#475569", margin: 0 }}>
              Cairn does the same for strategy.<br />
              One stone at a time.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── What Cairn is / is not ── */}
      <section style={{ padding: "100px 48px 140px", background: "rgba(255,255,255,0.018)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ ...S.serif, fontSize: 36, fontWeight: 400, color: "#f1f5f9", marginBottom: 60, letterSpacing: "-0.02em" }}>
              What Cairn <span style={{ ...S.serif, fontStyle: "italic", color: "#3a4558" }}>is not</span>.
            </h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <FadeIn delay={0.1}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#3a4558", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>Not this</p>
                {[
                  "A project tool with Gantt charts",
                  "An EA tool with a modelling language",
                  "A PowerPoint made three months ago",
                  "A dashboard without actionability",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                    <span style={{ color: "#ef4444", fontSize: 13, marginTop: 1, opacity: 0.7 }}>✕</span>
                    <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>This</p>
                {[
                  "A living strategic roadmap that updates in real time",
                  "Built for the people who fund the transformation",
                  "Intuitive enough to open and present in 30 seconds",
                  "Where strategy and execution meet in one picture",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                    <span style={{ color: "#22c55e", fontSize: 13, marginTop: 1, opacity: 0.7 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section style={{ padding: "140px 48px 160px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <FadeIn>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
              <BarDivider />
            </div>
            <h2 style={{ ...S.serif, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "#f1f5f9", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Navigate your strategy with clarity.
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p style={{ fontSize: 16, color: "#475569", marginBottom: 12, lineHeight: 1.7 }}>
              Cairn is in early access.
            </p>
            <p style={{ fontSize: 16, color: "#475569", marginBottom: 48, lineHeight: 1.7 }}>
              We&rsquo;re working with a small number of leadership teams
              to shape the product.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <a
              href="mailto:hello@cairnpath.io"
              style={{ ...ctaStyle, fontSize: 15, padding: "14px 36px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#4f46e5"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#6366f1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >Request early access</a>
            <p style={{ fontSize: 13, color: "#334155", marginTop: 20, letterSpacing: "0.02em" }}>cairnpath.io</p>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "40px 48px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CairnMark size={0.38} />
            <span style={{ ...S.serif, fontSize: 15, color: "#334155" }}>Cairn</span>
            <span style={{ fontSize: 11, color: "#1e293b", marginLeft: 12 }}>&copy; 2026 · navigate the fog</span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {["Privacy", "Terms", "Contact"].map(item => (
              <span
                key={item}
                style={{ fontSize: 11, color: "#1e293b", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#64748b")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1e293b")}
              >{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
