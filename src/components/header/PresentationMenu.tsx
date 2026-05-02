import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { useMode } from '../../hooks/useMode';

export function PresentationMenu() {
  const { t } = useTranslation();
  const enterMeetingMode = useStore(s => s.enterMeetingMode);
  const { enterBoardView } = useMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 rounded text-[11px] font-medium text-text-secondary hover:bg-[var(--bg-hover)] transition-colors"
      >
        {t('nav.presentation')}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
          <button
            onClick={() => { setOpen(false); enterMeetingMode(); }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)]"
          >
            {t('nav.presentation')}
          </button>
          <button
            onClick={() => { setOpen(false); enterBoardView(); }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)]"
          >
            {t('board.title')}
          </button>
        </div>
      )}
    </div>
  );
}
