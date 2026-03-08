interface Props {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}

export function KPICard({ label, value, sublabel, color }: Props) {
  return (
    <div className="px-3 py-2 bg-white rounded border border-border">
      <div className="text-[9px] text-text-tertiary uppercase">{label}</div>
      <div className="text-[18px] font-bold" style={{ color }}>{value}</div>
      {sublabel && <div className="text-[9px] text-text-tertiary">{sublabel}</div>}
    </div>
  );
}
