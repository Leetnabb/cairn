import { useRef } from 'react';

const PALETTE_COLORS = [
  '#94a3b8', // slate
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // emerald
  '#06b6d4', // cyan
  '#6366f1', // violet
  '#a855f7', // purple
  '#ec4899', // fuchsia/rose
  '#e11d48', // rose
];

interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPalette({ value, onChange }: ColorPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = !PALETTE_COLORS.includes(value);

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {PALETTE_COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-5 h-5 rounded-full border-2 transition-all duration-150 hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: value === color ? '#1e293b' : 'transparent',
            boxShadow: value === color ? '0 0 0 2px white, 0 0 0 3.5px ' + color : 'none',
          }}
          title={color}
        />
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-5 h-5 rounded-full border-2 transition-all duration-150 hover:scale-110 flex items-center justify-center text-[8px]"
        style={{
          background: isCustom ? value : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
          borderColor: isCustom ? '#1e293b' : 'transparent',
          boxShadow: isCustom ? '0 0 0 2px white, 0 0 0 3.5px ' + value : 'none',
        }}
        title="Egendefinert farge"
      >
        {!isCustom && <span className="text-white font-bold drop-shadow-sm">+</span>}
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
