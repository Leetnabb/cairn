import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  narrative: string;
  isEditable?: boolean;
  onEdit?: (text: string) => void;
  dark?: boolean;
}

export function StrategicNarrative({ narrative, isEditable = false, onEdit, dark = false }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(narrative);
  const [edited, setEdited] = useState(false);
  const [displayText, setDisplayText] = useState(narrative);

  const handleSave = () => {
    setDisplayText(draft);
    setEdited(true);
    setEditing(false);
    onEdit?.(draft);
  };

  const handleCancel = () => {
    setDraft(displayText);
    setEditing(false);
  };

  // Update display text when narrative prop changes (unless user has edited)
  if (!edited && narrative !== displayText && !editing) {
    setDisplayText(narrative);
    setDraft(narrative);
  }

  return (
    <div
      className={`relative rounded-none border-l-[3px] pl-4 pr-4 py-4 ${dark ? 'bg-[#111827]' : 'bg-[#f8fafc]'}`}
      style={{ borderLeftColor: '#6366f1' }}
    >
      <div
        className="text-[11px] uppercase tracking-wider mb-2 font-medium"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#94a3b8' }}
      >
        {t('board.strategicReading')}
        {edited && (
          <span className="ml-2 text-[10px] text-indigo-400 normal-case tracking-normal">
            · {t('board.narrativeEdited')}
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 text-[15px] leading-relaxed rounded border focus:outline-none focus:border-indigo-400 resize-none ${
              dark ? 'bg-[#1e2a3a] border-[#2d3748] text-[#f1f5f9]' : 'bg-card border-border text-[#1e293b]'
            }`}
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1.6 }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-[11px] bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              {t('board.saveNarrative')}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              {t('board.cancelEdit')}
            </button>
          </div>
        </div>
      ) : (
        <div className="group relative">
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 18,
              lineHeight: 1.6,
              color: dark ? '#f1f5f9' : '#1e293b',
            }}
          >
            {displayText}
          </p>
          {isEditable && (
            <button
              onClick={() => setEditing(true)}
              title={t('board.editNarrative')}
              aria-label={t('board.editNarrative')}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 rounded text-text-tertiary hover:text-indigo-600 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
