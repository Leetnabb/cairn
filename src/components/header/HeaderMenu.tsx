import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

export function HeaderMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const setView = useStore(s => s.setView);
  const toggleSimulation = useStore(s => s.toggleSimulation);
  const toggleCriticalPath = useStore(s => s.toggleCriticalPath);
  const simulationEnabled = useStore(s => s.ui.simulationEnabled);
  const criticalPathEnabled = useStore(s => s.ui.criticalPathEnabled);
  const setImportModalOpen = useStore(s => s.setImportModalOpen);
  const saveSnapshot = useStore(s => s.saveSnapshot);
  const setCapabilityOverlayOpen = useStore(s => s.setCapabilityOverlayOpen);
  const openWizard = useOnboardingStore(s => s.openWizard);
  const roleMode = useStore(s => s.ui.roleMode);
  const modules = useStore(s => s.modules);
  const setModules = useStore(s => s.setModules);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const items = [
    { label: t('nav.compare'), action: () => setView('compare'), hide: false },
    { label: t('nav.capabilityMap'), action: () => setCapabilityOverlayOpen(true), hide: !modules.capabilities },
    { label: t('nav.simulation'), action: toggleSimulation, toggle: simulationEnabled, hide: !modules.capabilities },
    { label: t('nav.criticalPath'), action: toggleCriticalPath, toggle: criticalPathEnabled, hide: false },
    { divider: true },
    { label: t('nav.importExport'), action: () => setImportModalOpen(true), hide: false },
    { label: t('nav.saveSnapshot'), action: () => saveSnapshot(), hide: roleMode === 'governance' },
    { label: t('nav.getStarted'), action: openWizard, hide: false },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center text-[14px] text-text-secondary hover:bg-gray-100 rounded transition-colors"
        title={t('nav.menu')}
      >
        &#x22EF;
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
          {items.map((item, idx) => {
            if (item.hide) return null;
            if ('divider' in item && item.divider) {
              return <div key={idx} className="border-t border-border my-1" />;
            }
            return (
              <button
                key={idx}
                onClick={() => { item.action?.(); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-gray-50 flex items-center justify-between"
              >
                <span>{item.label}</span>
                {'toggle' in item && item.toggle !== undefined && (
                  <span className={`w-2 h-2 rounded-full ${item.toggle ? 'bg-primary' : 'bg-gray-300'}`} />
                )}
              </button>
            );
          })}

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
              className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{t('modules.capabilities')}</span>
              <span className={`w-2 h-2 rounded-full ${modules.capabilities ? 'bg-primary' : 'bg-gray-300'}`} />
            </button>
            {/* Effects toggle */}
            <button
              onClick={() => setModules({ effects: !modules.effects })}
              className="w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-gray-50 flex items-center justify-between"
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
