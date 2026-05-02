interface AvatarProps {
  name: string | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  title?: string;
  className?: string;
}

const SIZE_PX: Record<NonNullable<AvatarProps['size']>, { box: number; text: number }> = {
  xs: { box: 16, text: 8 },
  sm: { box: 24, text: 10 },
  md: { box: 32, text: 12 },
};

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const local = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  const parts = local.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (local[0] ?? '?').toUpperCase();
}

export function Avatar({ name, size = 'sm', title, className = '' }: AvatarProps) {
  const { box, text } = SIZE_PX[size];
  const initials = getInitials(name);
  const empty = !name || !name.trim();
  const bg = empty ? '#cbd5e1' : 'var(--accent)';

  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center rounded-full text-white font-semibold ${className}`}
      style={{ width: box, height: box, fontSize: text, backgroundColor: bg, lineHeight: 1 }}
      title={title ?? name ?? ''}
      aria-label={name ?? 'unassigned'}
    >
      {initials}
    </span>
  );
}
