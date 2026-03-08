interface CairnLogoProps {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  dark?: boolean;
  className?: string;
}

const BARS = [
  { w: 16, color: "#ef4444" },  // Ledelse
  { w: 26, color: "#22c55e" },  // Virksomhet
  { w: 36, color: "#eab308" },  // Organisasjon
  { w: 46, color: "#6366f1" },  // Teknologi
];

export function CairnMark({ size = 1 }: { size?: number; dark?: boolean }) {
  return (
    <svg width={48 * size} height={52 * size} viewBox="0 0 48 52" fill="none">
      {BARS.map((bar, i) => (
        <rect
          key={i}
          x={(48 - bar.w) / 2}
          y={2 + i * 13}
          width={bar.w}
          height={8}
          rx={2}
          fill={bar.color}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

export function CairnLogo({
  size = 1,
  showText = true,
  showTagline = true,
  dark = false,
  className,
}: CairnLogoProps) {
  const fg = dark ? "#f1f5f9" : "#1e293b";
  const sub = dark ? "#94a3b8" : "#64748b";

  if (!showText) return <CairnMark size={size} dark={dark} />;

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 12 * size }}>
      <CairnMark size={size} dark={dark} />
      <div>
        <div
          style={{
            fontSize: 28 * size,
            fontFamily: "'Instrument Serif', Georgia, serif",
            color: fg,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Cairn
        </div>
        {showTagline && (
          <div
            style={{
              fontSize: 11.5 * size,
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              color: sub,
              fontWeight: 400,
              marginTop: 2 * size,
              letterSpacing: "0.03em",
            }}
          >
            navigate the fog
          </div>
        )}
      </div>
    </div>
  );
}

export default CairnLogo;
