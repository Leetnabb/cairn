import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { generateNarrative } from '../../lib/narrativeEngine';
import { computeStrategicInsights } from '../../lib/strategicInsights';
import type { StrategicInsight } from '../../lib/strategicInsights';
import { StrategicNarrative } from '../ui/StrategicNarrative';
import { ChangeIndicators } from './ChangeIndicators';
import { InsightCards } from './InsightCards';
import { StrategicHealth } from './StrategicHealth';
import { DeepDive } from './DeepDive';

export function Dashboard() {
  const { t } = useTranslation();
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const capabilities = useStore(s => s.capabilities);
  const effects = useStore(s => s.effects);
  const valueChains = useStore(s => s.valueChains);
  const snapshots = useStore(s => s.snapshots);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const strategicFrame = useStore(s => s.strategicFrame);

  const narrative = useMemo(
    () => generateNarrative(initiatives, capabilities, effects, undefined, strategicFrame),
    [initiatives, capabilities, effects, strategicFrame]
  );

  const strategicInsights = useMemo(
    () => computeStrategicInsights(initiatives, capabilities, effects),
    [initiatives, capabilities, effects]
  );

  function handleInsightClick(insight: StrategicInsight) {
    if (insight.relatedIds.length > 0) {
      // Select the first related item — type is unknown here, try initiative first
      const firstId = insight.relatedIds[0];
      const isInitiative = initiatives.some(i => i.id === firstId);
      const isCapability = capabilities.some(c => c.id === firstId);
      if (isInitiative) {
        setSelectedItem({ type: 'initiative', id: firstId });
      } else if (isCapability) {
        setSelectedItem({ type: 'capability', id: firstId });
      }
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Strategic frame summary */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        {strategicFrame ? (
          <>
            <p className="text-lg font-medium text-text-primary mb-2">{strategicFrame.direction}</p>
            {strategicFrame.themes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {strategicFrame.themes.map(theme => (
                  <span
                    key={theme.id}
                    className="inline-flex bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 text-xs"
                  >
                    {theme.name}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-secondary">{t('dashboard.noStrategicFrame')}</p>
        )}
      </div>

      {/* Change indicators */}
      <ChangeIndicators snapshots={snapshots} initiatives={initiatives} capabilities={capabilities} />

      {/* Layer 1: Strategic insights — "What should you discuss?" */}
      <section className="mb-4">
        <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
          {t('dashboard.layer1Title')}
        </h2>
        <InsightCards insights={strategicInsights} onInsightClick={handleInsightClick} />
      </section>

      {/* Narrative — strategic reading */}
      <StrategicNarrative narrative={narrative} />

      {/* Layer 2: Strategic health KPIs */}
      <section className="mb-4">
        <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
          {t('dashboard.layer2Title')}
        </h2>
        <StrategicHealth
          initiatives={initiatives}
          capabilities={capabilities}
          effects={effects}
          snapshots={snapshots}
        />
      </section>

      {/* Layer 3: Deep dive (complexity level 2+ only) */}
      <DeepDive
        initiatives={initiatives}
        capabilities={capabilities}
        effects={effects}
        valueChains={valueChains}
      />
    </div>
  );
}
