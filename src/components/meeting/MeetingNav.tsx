import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { MeetingLens } from '../../types';

const LENS_ORDER: MeetingLens[] = ['narrative', 'path', 'capabilities', 'effects'];

const LENS_KEY_MAP: Record<string, MeetingLens> = {
  '1': 'narrative',
  '2': 'path',
  '3': 'capabilities',
  '4': 'effects',
};

export function MeetingNav() {
  const { t } = useTranslation();
  const currentLens = useStore(s => s.ui.meetingLens);
  const setMeetingLens = useStore(s => s.setMeetingLens);
  const exitMeetingMode = useStore(s => s.exitMeetingMode);

  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = () => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  };

  useEffect(() => {
    resetHideTimer();
    const handleMouseMove = () => resetHideTimer();
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitMeetingMode();
        return;
      }

      const lensFromKey = LENS_KEY_MAP[e.key];
      if (lensFromKey) {
        setMeetingLens(lensFromKey);
        return;
      }

      if (e.key === 'ArrowRight') {
        const currentIdx = LENS_ORDER.indexOf(currentLens);
        const nextIdx = (currentIdx + 1) % LENS_ORDER.length;
        setMeetingLens(LENS_ORDER[nextIdx]);
        return;
      }

      if (e.key === 'ArrowLeft') {
        const currentIdx = LENS_ORDER.indexOf(currentLens);
        const prevIdx = (currentIdx - 1 + LENS_ORDER.length) % LENS_ORDER.length;
        setMeetingLens(LENS_ORDER[prevIdx]);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLens, setMeetingLens, exitMeetingMode]);

  const lensLabels: Record<MeetingLens, string> = {
    narrative: t('meeting.narrative'),
    path: t('meeting.path'),
    capabilities: t('meeting.capabilities'),
    effects: t('meeting.effects'),
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 transition-all duration-300"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div
        className="flex items-center justify-between px-8 min-h-14"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #1e293b',
        }}
      >
        {/* Left: Logo + mode label */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <span
            className="font-semibold text-base tracking-tight"
            style={{ color: '#f1f5f9' }}
          >
            Cairn
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: '#1e293b', color: '#64748b', border: '1px solid #334155' }}
          >
            {t('meeting.title')}
          </span>
        </div>

        {/* Center: Lens buttons */}
        <div className="flex items-center gap-1">
          {LENS_ORDER.map((lens, idx) => {
            const isActive = currentLens === lens;
            return (
              <button
                key={lens}
                onClick={() => setMeetingLens(lens)}
                className="relative px-5 py-2 text-sm font-medium rounded transition-colors min-h-10"
                style={{
                  color: isActive ? '#e2e8f0' : '#64748b',
                  backgroundColor: isActive ? '#1e293b' : 'transparent',
                }}
                title={`${lensLabels[lens]} (${idx + 1})`}
              >
                {lensLabels[lens]}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ backgroundColor: '#6366f1' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Export + Exit */}
        <div className="flex items-center gap-3 min-w-[160px] justify-end">
          <button
            className="px-4 py-2 text-sm rounded transition-colors min-h-10"
            style={{
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
            }}
          >
            {t('meeting.export')}
          </button>

          <button
            onClick={exitMeetingMode}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded transition-colors min-h-10"
            style={{
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
            }}
            title={`${t('meeting.exit')} (Esc)`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {t('meeting.exit')}
          </button>
        </div>
      </div>
    </div>
  );
}
