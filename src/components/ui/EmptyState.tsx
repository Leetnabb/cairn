import { CairnMark } from '../CairnLogo';

interface EmptyStateProps {
  title: string;
  body?: string;
  cta?: { label: string; onClick: () => void };
  icon?: 'cairn';
  className?: string;
}

export function EmptyState({ title, body, cta, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-10 ${className}`}>
      {icon === 'cairn' && (
        <div className="mb-4 opacity-30" aria-hidden="true">
          <CairnMark size={0.6} />
        </div>
      )}
      <h3 className="text-[14px] font-medium text-text-primary mb-1">{title}</h3>
      {body && (
        <p className="text-[12px] text-text-tertiary max-w-sm mb-4 leading-relaxed">{body}</p>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          className="px-3 py-1.5 rounded text-[11px] font-medium bg-primary text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
