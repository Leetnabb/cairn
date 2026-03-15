import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { DIMENSION_MAP, MATURITY_COLORS, EFFECT_TYPE_COLORS } from '../../types';
import type { Initiative } from '../../types';
import { EditInitiativeForm } from '../forms/EditInitiativeForm';
import { Button } from '../ui/Button';
import { CommentsSection } from './CommentsSection';
import { getMergedCriticalPath } from '../../lib/criticalPath';

interface Props {
  initiative: Initiative;
}

export function InitiativeDetail({ initiative }: Props) {
  const { t } = useTranslation();
  const editingId = useStore(s => s.ui.editingId);
  const setEditingId = useStore(s => s.setEditingId);
  const deleteInitiative = useStore(s => s.deleteInitiative);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const valueChains = useStore(s => s.valueChains);

  const updateInitiative = useStore(s => s.updateInitiative);
  const criticalPathEnabled = useStore(s => s.ui.criticalPathEnabled);
  const roleMode = useStore(s => s.ui.roleMode);
  const modules = useStore(s => s.modules);
  const isGovernance = roleMode === 'governance';

  const isEditing = editingId === initiative.id;
  const dim = DIMENSION_MAP[initiative.dimension];

  const criticalPathInfo = useMemo(() => {
    if (!criticalPathEnabled) return null;
    const { merged, auto } = getMergedCriticalPath(initiatives);
    return {
      isOnMerged: merged.has(initiative.id),
      isOnAuto: auto.has(initiative.id),
      override: initiative.criticalPathOverride,
    };
  }, [criticalPathEnabled, initiatives, initiative.id, initiative.criticalPathOverride]);

  const relatedCaps = useMemo(() =>
    capabilities.filter(c => initiative.capabilities.includes(c.id)),
    [capabilities, initiative.capabilities]
  );

  const dependsOnInits = useMemo(() =>
    initiatives.filter(i => initiative.dependsOn.includes(i.id)),
    [initiatives, initiative.dependsOn]
  );

  const blocksInits = useMemo(() =>
    initiatives.filter(i => i.dependsOn.includes(initiative.id)),
    [initiatives, initiative.id]
  );

  const overlapping = useMemo(() =>
    initiatives.filter(i =>
      i.id !== initiative.id &&
      i.capabilities.some(c => initiative.capabilities.includes(c))
    ),
    [initiatives, initiative]
  );

  const effects = useStore(s => s.effects);

  const relatedEffects = useMemo(() =>
    effects.filter(e => e.initiatives.includes(initiative.id)),
    [effects, initiative.id]
  );

  const vcItems = valueChains.filter(vc => initiative.valueChains.includes(vc.id));

  // Impact analysis: capabilities where this initiative is the sole contributor
  const impactedCapabilities = useMemo(() => {
    return initiative.capabilities.filter(capId => {
      const otherContributors = initiatives.filter(
        i => i.id !== initiative.id && i.capabilities.includes(capId)
      );
      return otherContributors.length === 0;
    }).map(capId => capabilities.find(c => c.id === capId)).filter(Boolean);
  }, [initiative, initiatives, capabilities]);

  // Compute transitive downstream cascade
  const downstreamCount = useMemo(() => {
    const visited = new Set<string>();
    const queue = [initiative.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const i of initiatives) {
        if (i.dependsOn.includes(current) && !visited.has(i.id)) {
          visited.add(i.id);
          queue.push(i.id);
        }
      }
    }
    return visited.size;
  }, [initiative.id, initiatives]);

  const handleDelete = () => {
    let msg = t('detail.confirmDelete', { name: initiative.name });
    if (downstreamCount > 0 || impactedCapabilities.length > 0) {
      msg = t('detail.cascadeDelete', {
        name: initiative.name,
        downstream: downstreamCount,
        capabilities: impactedCapabilities.length,
      });
    }
    if (confirm(msg)) {
      deleteInitiative(initiative.id);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3">
        <h3 className="text-[12px] font-semibold mb-2">{t('detail.editInitiative')}</h3>
        <EditInitiativeForm initiative={initiative} />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
            <span className="text-[9px] text-text-tertiary uppercase">{t(`labels.dimensions.${initiative.dimension}`)}</span>
            <span className="text-[9px] text-text-tertiary">&middot;</span>
            <span className="text-[9px] text-text-tertiary">{t(`labels.horizon.${initiative.horizon}`)}</span>
          </div>
          <h3 className="text-[14px] font-semibold">{initiative.name}</h3>
          <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-medium rounded-full ${
            initiative.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            initiative.status === 'done' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {t(`labels.status.${initiative.status ?? 'planned'}`)}
          </span>
        </div>
        {!isGovernance && (
          <div className="flex gap-1">
            <Button onClick={() => setEditingId(initiative.id)}>&#10000;</Button>
            <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        )}
      </div>

      <div className="px-2 py-1 rounded border border-border">
        <div className="text-[9px] text-text-tertiary uppercase">{t('common.owner')}</div>
        <div className="text-[11px] font-medium">{initiative.owner}</div>
      </div>

      {initiative.description && (
        <p className="text-[11px] text-text-secondary">{initiative.description}</p>
      )}

      {/* Notes banner */}
      {initiative.notes && (
        <div className="px-2 py-1.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-blue-800">
          <span className="font-medium">{t('common.note')}:</span> {initiative.notes}
        </div>
      )}

      {/* Critical path banner */}
      {criticalPathInfo && (() => {
        const { isOnMerged, isOnAuto, override } = criticalPathInfo;
        if (override === true) {
          return (
            <div className="px-2 py-1.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-800 flex items-center justify-between">
              <span>\ud83d\udd34 {t('detail.criticalPath.onManual')}</span>
              <button onClick={() => updateInitiative(initiative.id, { criticalPathOverride: null })}
                className="text-[9px] text-red-600 hover:text-red-800 font-medium">{t('detail.criticalPath.removeFrom')}</button>
            </div>
          );
        }
        if (override === false) {
          return (
            <div className="px-2 py-1.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-600 flex items-center justify-between">
              <span>\u26aa {t('detail.criticalPath.excluded')}</span>
              <button onClick={() => updateInitiative(initiative.id, { criticalPathOverride: null })}
                className="text-[9px] text-gray-500 hover:text-gray-700 font-medium">{t('detail.criticalPath.resetAuto')}</button>
            </div>
          );
        }
        if (isOnMerged && isOnAuto) {
          return (
            <div className="px-2 py-1.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-800 flex items-center justify-between">
              <span>\ud83d\udd34 {t('detail.criticalPath.onAuto')}</span>
              <button onClick={() => updateInitiative(initiative.id, { criticalPathOverride: false })}
                className="text-[9px] text-red-600 hover:text-red-800 font-medium">{t('detail.criticalPath.removeFrom')}</button>
            </div>
          );
        }
        return (
          <div className="px-2 py-1.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-600 flex items-center justify-between">
            <span>\u26aa {t('detail.criticalPath.notOn')}</span>
            <button onClick={() => updateInitiative(initiative.id, { criticalPathOverride: true })}
              className="text-[9px] text-gray-500 hover:text-gray-700 font-medium">{t('detail.criticalPath.addTo')}</button>
          </div>
        );
      })()}

      {/* Maturity effects */}
      {modules.capabilities && Object.keys(initiative.maturityEffect).length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.maturityEffect')}</div>
          <div className="space-y-0.5">
            {Object.entries(initiative.maturityEffect).map(([capId, level]) => {
              const cap = capabilities.find(c => c.id === capId);
              return cap ? (
                <div key={capId} className="flex items-center gap-1 text-[10px]">
                  <button onClick={() => setSelectedItem({ type: 'capability', id: capId })} className="text-primary hover:underline">
                    {cap.name}
                  </button>
                  <span className="text-text-tertiary">&rarr;</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[level] }} />
                  <span>{t(`labels.maturity.${level}`)}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {dependsOnInits.length > 0 && (
        <div>
          <div className="text-[9px] text-yellow-600 uppercase mb-1 font-medium">{t('detail.dependsOn')}</div>
          <div className="space-y-0.5">
            {dependsOnInits.map(i => (
              <button key={i.id}
                onClick={() => setSelectedItem({ type: 'initiative', id: i.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded bg-yellow-50 hover:bg-yellow-100 text-yellow-800">
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {blocksInits.length > 0 && (
        <div>
          <div className="text-[9px] text-blue-600 uppercase mb-1 font-medium">{t('detail.blocks')}</div>
          <div className="space-y-0.5">
            {blocksInits.map(i => (
              <button key={i.id}
                onClick={() => setSelectedItem({ type: 'initiative', id: i.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded bg-blue-50 hover:bg-blue-100 text-blue-800">
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Capabilities */}
      {modules.capabilities && relatedCaps.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.capabilities')}</div>
          <div className="flex flex-wrap gap-1">
            {relatedCaps.map(c => (
              <button key={c.id}
                onClick={() => setSelectedItem({ type: 'capability', id: c.id })}
                className="px-1.5 py-0.5 text-[9px] rounded bg-gray-100 text-primary hover:bg-gray-200">
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Effects */}
      {modules.effects && (relatedEffects.length > 0 ? (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('effects.contributesToEffects')}</div>
          <div className="space-y-0.5">
            {relatedEffects.map(e => (
              <button key={e.id}
                onClick={() => setSelectedItem({ type: 'effect', id: e.id })}
                className="flex items-center gap-1.5 w-full text-left px-2 py-1 text-[10px] rounded hover:bg-gray-50 text-primary">
                <span className="px-1 py-0.5 text-[7px] font-medium rounded text-white shrink-0" style={{ backgroundColor: EFFECT_TYPE_COLORS[e.type] }}>
                  {t(`effects.types.${e.type}`)}
                </span>
                {e.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-2 py-1.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-text-tertiary italic">
          {t('detail.noEffectLink')}
        </div>
      ))}

      {/* Value chains */}
      {vcItems.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.valueChains')}</div>
          <div className="flex flex-wrap gap-1">
            {vcItems.map(vc => (
              <span key={vc.id} className="px-1.5 py-0.5 text-[9px] rounded text-white" style={{ backgroundColor: vc.color }}>
                {vc.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Overlapping */}
      {overlapping.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.overlapping')}</div>
          <div className="space-y-0.5">
            {overlapping.map(i => (
              <button key={i.id}
                onClick={() => setSelectedItem({ type: 'initiative', id: i.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded hover:bg-gray-50 text-primary">
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Impact analysis */}
      {(modules.capabilities && impactedCapabilities.length > 0 || blocksInits.length > 0) && (
        <div className="px-2 py-1.5 rounded bg-orange-50 border border-orange-200">
          <div className="text-[9px] text-orange-700 uppercase font-medium mb-1">{t('detail.impactAnalysis')}</div>
          {impactedCapabilities.length > 0 && (
            <div className="mb-1">
              <div className="text-[9px] text-orange-600 mb-0.5">{t('detail.soleContributor')}</div>
              <div className="space-y-0.5">
                {impactedCapabilities.map(cap => (
                  <button key={cap!.id}
                    onClick={() => setSelectedItem({ type: 'capability', id: cap!.id })}
                    className="block w-full text-left px-1.5 py-0.5 text-[10px] rounded bg-orange-100 hover:bg-orange-200 text-orange-800">
                    {cap!.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {blocksInits.length > 0 && (
            <div>
              <div className="text-[9px] text-orange-600 mb-0.5">{t('detail.willBlock')}</div>
              <div className="space-y-0.5">
                {blocksInits.map(i => (
                  <button key={i.id}
                    onClick={() => setSelectedItem({ type: 'initiative', id: i.id })}
                    className="block w-full text-left px-1.5 py-0.5 text-[10px] rounded bg-orange-100 hover:bg-orange-200 text-orange-800">
                    {i.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CommentsSection itemId={initiative.id} />
    </div>
  );
}
