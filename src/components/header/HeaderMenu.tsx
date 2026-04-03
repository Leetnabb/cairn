import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useComplexityLevel } from '../../hooks/useComplexityLevel';
import type { ComplexityLevel } from '../../types';


export function HeaderMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toggleSimulation = useStore(s => s.toggleSimulation);
  const toggleCriticalPath = useStore(s => s.toggleCriticalPath);
  const simulationEnabled = useStore(s => s.ui.simulationEnabled);
  const criticalPathEnabled = useStore(s => s.ui.criticalPathEnabled);
  const setImportModalOpen = useStore(s => s.setImportModalOpen);
  const saveSnapshot = useStore(s => s.saveSnapshot);
  const setCapabilityOverlayOpen = useStore(s => s.setCapabilityOverlayOpen);
  const openWizard = useOnboardingStore(s => s.open);
  const roleMode = useStore(s => s.ui.roleMode);
  const modules = useStore(s => s.modules);
  const setModules = useStore(s => s.setModules);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);
  const setPresentationMode = useStore(s => s.setPresentationMode);
  const setComplexityLevel = useStore(s => s.setComplexityLevel);
  const { level } = useComplexityLevel();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const items = [
    // Compare view removed
    { label: t('nav.capabilityMap'), action: () => setCapabilityOverlayOpen(true), hide: !modules.capabilities },
    { label: t('nav.simulation'), action: toggleSimulation, toggle: simulationEnabled, hide: !modules.capabilities },
    { label: t('nav.criticalPath'), action: toggleCriticalPath, toggle: criticalPathEnabled, hide: false },
    { label: t('meeting.classicSlides'), action: () => setPresentationMode(true), hide: false },
    { divider: true },
    { label: t('nav.importExport'), action: () => setImportModalOpen(true), hide: false },
    { label: t('nav.saveSnapshot'), action: () => saveSnapshot(), hide: roleMode === 'governance' },
    { label: t('nav.getStarted'), action: openWizard, hide: false },
    { divider: true },
    { label: t('settings.title'), action: () => setSettingsOpen(true), hide: false },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center text-[14px] text-text-secondary hover:bg-[var(--bg-hover)] rounded transition-colors"
        title={t('nav.menu')}
      >
        &#x22EF;
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
          {items.map((item, idx) => {
            if (item.hide) return null;
            if ('divider' in item && item.divider) {
              return <div key={idx} className="border-t border-border my-1" />;
            }
            return (
              <button
                key={idx}
                onClick={() => { item.action?.(); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
              >
                <span>{item.label}</span>
                {'toggle' in item && item.toggle !== undefined && (
                  <span className={`w-2 h-2 rounded-full ${item.toggle ? 'bg-primary' : 'bg-gray-300'}`} />
                )}
              </button>
            );
          })}

          {/* Complexity level section */}
          <div className="border-t border-border mt-1 pt-1">
            <div className="px-3 py-1 text-[9px] text-text-tertiary uppercase tracking-wider font-medium">
              {t('complexity.current')}
            </div>
            <div className="px-3 py-1 text-[11px] text-text-secondary">
              {level === 1 ? t('complexity.level1') : level === 2 ? t('complexity.level2') : t('complexity.level3')}
            </div>
            {level < 3 && (
              <button
                onClick={() => { setComplexityLevel((level + 1) as ComplexityLevel); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
              >
                <span>{t('complexity.unlock')} →</span>
              </button>
            )}
            {level > 1 && (
              <button
                onClick={() => { setComplexityLevel((level - 1) as ComplexityLevel); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
              >
                <span>← {t('complexity.simplify')}</span>
              </button>
            )}
          </div>

          {/* Module settings section */}
          <div className="border-t border-border mt-1 pt-1">
            <div className="px-3 py-1 text-[9px] text-text-tertiary uppercase tracking-wider font-medium">
              {t('modules.title')}
            </div>
            {/* Roadmap – always on */}
            <div className="w-full px-3 py-1.5 text-[11px] text-text-tertiary flex items-center justify-between cursor-default">
              <span>{t('modules.roadmap')}</span>
              <span className="w-2 h-2 rounded-full bg-primary opacity-40" title={t('modules.core')} />
            </div>
            {/* Capabilities toggle */}
            <button
              onClick={() => setModules({ capabilities: !modules.capabilities })}
              className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
            >
              <span>{t('modules.capabilities')}</span>
              <span className={`w-2 h-2 rounded-full ${modules.capabilities ? 'bg-primary' : 'bg-gray-300'}`} />
            </button>
            {/* Effects toggle */}
            <button
              onClick={() => setModules({ effects: !modules.effects })}
              className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-[var(--bg-hover)] flex items-center justify-between"
            >
              <span>{t('modules.effects')}</span>
              <span className={`w-2 h-2 rounded-full ${modules.effects ? 'bg-primary' : 'bg-gray-300'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
