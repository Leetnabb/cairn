import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CairnMark } from "../CairnLogo";

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style = {} }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

const S: Record<string, CSSProperties> = {
  page: { background: "#0a0f1a", color: "#e8ecf4", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "hidden" },
  serif: { fontFamily: "'Instrument Serif', Georgia, serif" },
  sans: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
  muted: { color: "#7a8599" },
  accent: { color: "#818cf8" },
  dim: { color: "#4a5568" },
};

const navItems: { label: string; href: string }[] = [
  { label: "Product", href: "#produkt" },
  { label: "For whom", href: "#for-hvem" },
  { label: "About", href: "#om-oss" },
];

const dims = [
  { label: "Governance", color: "#ef4444", desc: "Governance models, decision structure, and strategic alignment" },
  { label: "Business", color: "#22c55e", desc: "Processes, KPIs, and value chains that drive the organisation" },
  { label: "Organisation", color: "#eab308", desc: "Competence, culture, and capacity for change" },
  { label: "Technology", color: "#6366f1", desc: "Platforms, integrations, and digital capabilities" },
];

export default function CairnLanding() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={S.page}>
      {/* Noise overlay */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.03, pointerEvents: "none", zIndex: 100,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrollY > 60 ? "rgba(10,15,26,0.85)" : "transparent",
        backdropFilter: scrollY > 60 ? "blur(20px)" : "none",
        borderBottom: scrollY > 60 ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CairnMark size={0.55} />
          <span style={{ ...S.serif, fontSize: 22, color: "#e8ecf4", letterSpacing: "-0.02em" }}>Cairn</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{ fontSize: 13, color: "#7a8599", cursor: "pointer", fontWeight: 500, letterSpacing: "0.02em", transition: "color 0.2s", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e8ecf4")}
              onMouseLeave={e => (e.currentTarget.style.color = "#7a8599")}
            >{item.label}</a>
          ))}
          <Link to="/app" style={{
            fontSize: 13, fontWeight: 600, color: "#0a0f1a", background: "#e8ecf4",
            padding: "8px 20px", borderRadius: 6, cursor: "pointer", letterSpacing: "0.01em",
            transition: "all 0.2s", textDecoration: "none",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#818cf8"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#e8ecf4"; e.currentTarget.style.color = "#0a0f1a"; }}
          >Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 48px", position: "relative", overflow: "hidden",
      }}>
        {/* Fog layers */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 80% at 50% 90%, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 80% 40%, rgba(234,179,8,0.03) 0%, transparent 60%)" }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(to top, rgba(10,15,26,0.9) 0%, transparent 100%)",
        }} />

        {/* Animated fog wisps */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: "absolute",
            top: `${55 + i * 12}%`,
            left: `${-20 + i * 15}%`,
            width: "140%",
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${0.03 - i * 0.008}) 30%, rgba(255,255,255,${0.04 - i * 0.01}) 50%, transparent 100%)`,
            transform: `translateX(${Math.sin(scrollY * 0.002 + i) * 30}px)`,
          }} />
        ))}

        <div style={{ maxWidth: 800, position: "relative", zIndex: 2 }}>
          <FadeIn>
            <p style={{ ...S.sans, fontSize: 13, fontWeight: 600, color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>Strategic wayfinding</p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <h1 style={{ ...S.serif, fontSize: 72, fontWeight: 400, lineHeight: 1.05, margin: "0 0 28px", letterSpacing: "-0.02em", color: "#f1f5f9" }}>
              When the fog rolls in,<br />
              <span style={{ ...S.serif, fontStyle: "italic", color: "#818cf8" }}>you need a cairn.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#7a8599", maxWidth: 540, margin: "0 0 40px", fontWeight: 400 }}>
              Cairn is the strategic roadmap tool that gives leaders full visibility across the entire transformation — without requiring a modelling language.
            </p>
          </FadeIn>
          <FadeIn delay={0.45}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Link to="/app" style={{
                fontSize: 14, fontWeight: 600, color: "#0a0f1a", background: "#e8ecf4",
                padding: "12px 28px", borderRadius: 6, cursor: "pointer",
                transition: "all 0.2s", textDecoration: "none",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#818cf8"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#e8ecf4"; e.currentTarget.style.color = "#0a0f1a"; }}
              >Try Cairn for free</Link>
              <span style={{ fontSize: 14, color: "#7a8599", cursor: "pointer", padding: "12px 20px", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e8ecf4")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7a8599")}
              >See demo →</span>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: scrollY > 100 ? 0 : 0.4, transition: "opacity 0.3s" }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, transparent, #7a8599)" }} />
        </div>
      </section>

      {/* Problem statement */}
      <section style={{ padding: "140px 48px", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ ...S.serif, fontSize: 42, lineHeight: 1.35, fontWeight: 400, color: "#c8d0de", letterSpacing: "-0.01em", textAlign: "center" }}>
              Everyone has a strategy. Everyone has projects.<br />
              <span style={S.dim}>No one has the path between them.</span>
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div style={{ display: "flex", gap: 1, marginTop: 80, justifyContent: "center" }}>
              {[
                { label: "Strategy", sub: "Decided and anchored", highlight: false },
                { label: "???", sub: "What everyone lacks", highlight: true },
                { label: "Execution", sub: "Projects and teams", highlight: false },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    padding: "28px 40px", borderRadius: 8, textAlign: "center", minWidth: 180,
                    background: item.highlight ? "rgba(129,140,248,0.08)" : "rgba(255,255,255,0.03)",
                    border: item.highlight ? "1.5px solid rgba(129,140,248,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ ...S.serif, fontSize: 26, color: item.highlight ? "#818cf8" : "#c8d0de", marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: item.highlight ? "#818cf8" : "#5a6577", fontWeight: 500 }}>{item.sub}</div>
                  </div>
                  {i < 2 && <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 -1px" }} />}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.35}>
            <p style={{ textAlign: "center", marginTop: 48, fontSize: 18, color: "#818cf8", fontWeight: 600, ...S.serif, fontStyle: "italic" }}>
              Cairn is the &ldquo;to&rdquo;.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Four dimensions */}
      <section id="produkt" style={{ padding: "100px 48px 140px", position: "relative" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ ...S.sans, fontSize: 13, fontWeight: 600, color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>Four dimensions</p>
            <h2 style={{ ...S.serif, fontSize: 40, fontWeight: 400, textAlign: "center", color: "#e8ecf4", marginBottom: 64, letterSpacing: "-0.01em" }}>
              Transformation is never just technology.
            </h2>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {dims.map((d, i) => (
              <FadeIn key={d.label} delay={0.1 * i}>
                <div style={{
                  padding: "32px 24px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                  position: "relative", overflow: "hidden",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${d.color}08`; e.currentTarget.style.borderColor = `${d.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <div style={{ width: 32, height: 4, borderRadius: 2, background: d.color, opacity: 0.8, marginBottom: 20 }} />
                  <h3 style={{ ...S.serif, fontSize: 22, color: "#e8ecf4", marginBottom: 10, fontWeight: 400 }}>{d.label}</h3>
                  <p style={{ fontSize: 13, color: "#5a6577", lineHeight: 1.6, margin: 0 }}>{d.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Effect chain */}
      <section style={{ padding: "100px 48px 140px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ ...S.sans, fontSize: 13, fontWeight: 600, color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>The effect chain</p>
            <h2 style={{ ...S.serif, fontSize: 40, fontWeight: 400, textAlign: "center", color: "#e8ecf4", marginBottom: 16, letterSpacing: "-0.01em" }}>
              From investment to value. Visible.
            </h2>
            <p style={{ textAlign: "center", color: "#5a6577", fontSize: 16, marginBottom: 72, maxWidth: 500, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
              Cairn shows the unbroken line from what you do, through what you build, to what you achieve.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
              {[
                { num: "23", label: "Activities", sub: "What we do", color: "#ef4444" },
                { num: "12", label: "Capability lifts", sub: "What we can do", color: "#22c55e" },
                { num: "7", label: "Effects", sub: "What we achieve", color: "#818cf8" },
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ textAlign: "center", padding: "36px 40px", minWidth: 180 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: item.color, marginBottom: 4, ...S.sans }}>{item.num}</div>
                    <div style={{ ...S.serif, fontSize: 18, color: "#c8d0de", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#5a6577" }}>{item.sub}</div>
                  </div>
                  {i < 2 && (
                    <div style={{ display: "flex", alignItems: "center", width: 60 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                      <div style={{ color: "#3a4558", fontSize: 16, margin: "0 4px" }}>&rarr;</div>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Key features */}
      <section style={{ padding: "100px 48px 140px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ ...S.sans, fontSize: 13, fontWeight: 600, color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Built for decisions</p>
            <h2 style={{ ...S.serif, fontSize: 40, fontWeight: 400, color: "#e8ecf4", marginBottom: 72, letterSpacing: "-0.01em" }}>
              Not another architecture tool.<br />
              <span style={{ color: "#5a6577" }}>A governance tool.</span>
            </h2>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {[
              { title: "Move a stone. See which paths collapse.", desc: "Drag an activity to a different horizon. Cairn immediately shows which dependencies break and which effects disappear. Consequences are visible before you commit.", tag: "Dependencies" },
              { title: "Two strategies. One budget. Compare.", desc: "Duplicate a scenario, change the priorities, and see the differences side by side. Which effects do we lose? Which dimensions are covered? Choose with open eyes.", tag: "Scenarios" },
              { title: "IT has 11 concurrent activities. Do they see it?", desc: "Cairn shows change load per owner. The most common reason transformations fail is not the wrong strategy — it's overload.", tag: "Capacity" },
              { title: "Maturity now vs. maturity after.", desc: "Toggle simulation to see what the capability map looks like after execution. Each activity has an expected effect. The board can see concretely what the investment delivers.", tag: "Simulation" },
            ].map((f, i) => (
              <FadeIn key={f.tag} delay={i * 0.08}>
                <div style={{
                  display: "grid", gridTemplateColumns: "140px 1fr", gap: 32, alignItems: "start",
                  padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase", paddingTop: 4 }}>{f.tag}</span>
                  <div>
                    <h3 style={{ ...S.serif, fontSize: 24, fontWeight: 400, color: "#e8ecf4", marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
                    <p style={{ fontSize: 15, color: "#5a6577", lineHeight: 1.7, margin: 0, maxWidth: 560 }}>{f.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section id="for-hvem" style={{ padding: "100px 48px 140px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <p style={{ ...S.sans, fontSize: 13, fontWeight: 600, color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>Same picture, different altitude</p>
            <h2 style={{ ...S.serif, fontSize: 40, fontWeight: 400, textAlign: "center", color: "#e8ecf4", marginBottom: 64, letterSpacing: "-0.01em" }}>
              The CEO sees the value. The CIO sees the path.<br />
              <span style={{ color: "#5a6577" }}>Both see the same thing.</span>
            </h2>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { role: "CEO / Chair", opens: "the Dashboard", sees: "Effect funnel, dimension health, risk picture. Three sentences that summarise status.", icon: "\u25C9" },
              { role: "CIO / CDO", opens: "the Strategy Path", sees: "Activities, dependencies, capacity, critical path. Sequence and prioritisation.", icon: "\u25C8" },
              { role: "Enterprise Architect", opens: "Work mode", sees: "Editing, scenarios, simulation, export. Preparing the next governance meeting.", icon: "\u25C7" },
            ].map((p, i) => (
              <FadeIn key={p.role} delay={i * 0.1}>
                <div style={{
                  padding: "32px 28px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  height: "100%",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.3 }}>{p.icon}</div>
                  <h3 style={{ ...S.serif, fontSize: 20, color: "#e8ecf4", marginBottom: 4, fontWeight: 400 }}>{p.role}</h3>
                  <p style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, marginBottom: 14 }}>Opens {p.opens}</p>
                  <p style={{ fontSize: 13, color: "#5a6577", lineHeight: 1.6, margin: 0 }}>{p.sees}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Not / Is */}
      <section id="om-oss" style={{ padding: "100px 48px 140px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ ...S.serif, fontSize: 40, fontWeight: 400, textAlign: "center", color: "#e8ecf4", marginBottom: 64 }}>
              What Cairn <span style={{ ...S.serif, fontStyle: "italic", color: "#5a6577" }}>is not</span>.
            </h2>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <FadeIn delay={0.1}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#5a6577", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Cairn is not</p>
                {[
                  "A project tool with Gantt charts and tasks",
                  "An EA tool with a modelling language",
                  "A PowerPoint someone made three months ago",
                  "A dashboard without actionability",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ color: "#ef4444", fontSize: 14, marginTop: 1 }}>✕</span>
                    <span style={{ fontSize: 14, color: "#5a6577", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Cairn is</p>
                {[
                  "A living strategic roadmap that updates in real time",
                  "Built for the people who fund the transformation",
                  "Intuitive enough to open and present in 30 seconds",
                  "Where strategy and execution meet in one picture",
                ].map(t => (
                  <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ color: "#22c55e", fontSize: 14, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#c8d0de", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{ padding: "120px 48px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <FadeIn>
            <p style={{ ...S.serif, fontSize: 32, fontStyle: "italic", color: "#c8d0de", lineHeight: 1.45, marginBottom: 24 }}>
              &ldquo;A cairn doesn&rsquo;t need a legend.<br />Neither should your strategy.&rdquo;
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "120px 48px 140px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />

        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <FadeIn>
            <CairnMark size={1.2} />
          </FadeIn>
          <FadeIn delay={0.15}>
            <h2 style={{ ...S.serif, fontSize: 44, fontWeight: 400, color: "#e8ecf4", margin: "32px 0 16px", letterSpacing: "-0.02em" }}>
              Stack the stones.<br />See the path.
            </h2>
            <p style={{ fontSize: 16, color: "#5a6577", marginBottom: 40, lineHeight: 1.6 }}>
              Cairn is free to try. No credit card, no onboarding meeting. Just open and start.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <Link to="/app" style={{
              display: "inline-block", fontSize: 15, fontWeight: 600, color: "#0a0f1a",
              background: "#e8ecf4", padding: "14px 36px", borderRadius: 6, cursor: "pointer",
              transition: "all 0.2s", textDecoration: "none",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#818cf8"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#e8ecf4"; e.currentTarget.style.color = "#0a0f1a"; e.currentTarget.style.transform = "translateY(0)"; }}
            >Prøv Cairn gratis</Link>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px 48px 40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CairnMark size={0.4} />
              <span style={{ ...S.serif, fontSize: 16, color: "#5a6577" }}>Cairn</span>
            </div>
            <p style={{ fontSize: 11, color: "#3a4558", margin: 0 }}>Navigate the fog. &copy; 2026</p>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Contact"].map(item => (
              <span key={item} style={{ fontSize: 11, color: "#3a4558", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#7a8599")}
                onMouseLeave={e => (e.currentTarget.style.color = "#3a4558")}
              >{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
