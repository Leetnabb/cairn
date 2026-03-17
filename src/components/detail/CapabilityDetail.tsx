import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { MATURITY_COLORS, RISK_COLORS, EFFECT_TYPE_COLORS } from '../../types';
import type { Capability } from '../../types';
import { EditCapabilityForm } from '../forms/EditCapabilityForm';
import { Button } from '../ui/Button';
import { CommentsSection } from './CommentsSection';

interface Props {
  capability: Capability;
}

export function CapabilityDetail({ capability }: Props) {
  const { t } = useTranslation();
  const editingId = useStore(s => s.ui.editingId);
  const setEditingId = useStore(s => s.setEditingId);
  const deleteCapability = useStore(s => s.deleteCapability);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);

  const isEditing = editingId === capability.id;
  const children = capabilities.filter(c => c.parent === capability.id);
  const effects = useStore(s => s.effects);
  const modules = useStore(s => s.modules);
  const strategies = useStore(s => s.strategies);
  const updateCapability = useStore(s => s.updateCapability);
  const roleMode = useStore(s => s.ui.roleMode);
  const isGovernance = roleMode === 'governance';

  const relatedInitiatives = useMemo(() =>
    initiatives.filter(i => i.capabilities.includes(capability.id)),
    [initiatives, capability.id]
  );

  const relatedEffects = useMemo(() =>
    effects.filter(e => e.capabilities.includes(capability.id)),
    [effects, capability.id]
  );

  const handleDelete = () => {
    if (confirm(t('detail.confirmDelete', { name: capability.name }))) {
      deleteCapability(capability.id);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3">
        <h3 className="text-[12px] font-semibold mb-2">{t('detail.editCapability')}</h3>
        <EditCapabilityForm capability={capability} />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] text-text-tertiary uppercase">
            {capability.level === 1 ? t('detail.domain') : t('detail.subCapability')}
          </div>
          <h3 className="text-[14px] font-semibold">{capability.name}</h3>
        </div>
        <div className="flex gap-1">
          <Button onClick={() => setEditingId(capability.id)}>&#10000;</Button>
          <Button variant="danger" onClick={handleDelete}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="inline mr-1" aria-hidden="true">
              <path d="M6 2h4v1H6V2zM3 4h10v1H3V4zm1 2h8l-.8 9H4.8L4 6zm2 1v7h1V7H6zm3 0v7h1V7H9z"/>
            </svg>
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {capability.description && (
        <p className="text-[11px] text-text-secondary">{capability.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="px-2 py-1.5 rounded border border-border">
          <div className="text-[9px] text-text-tertiary uppercase">{t('labels.maturity.label')}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MATURITY_COLORS[capability.maturity] }} />
            <span className="text-[11px] font-medium">{t(`labels.maturity.${capability.maturity}`)}</span>
          </div>
        </div>
        <div className="px-2 py-1.5 rounded border border-border">
          <div className="text-[9px] text-text-tertiary uppercase">{t('labels.risk.label')}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[capability.risk] }} />
            <span className="text-[11px] font-medium">{t(`labels.risk.${capability.risk}`)}</span>
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.subCapabilities')}</div>
          <div className="space-y-0.5">
            {children.map(c => (
              <button key={c.id}
                onClick={() => setSelectedItem({ type: 'capability', id: c.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded hover:bg-gray-50 text-primary">
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {capability.parent && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.parent')}</div>
          <button
            onClick={() => setSelectedItem({ type: 'capability', id: capability.parent! })}
            className="text-[10px] text-primary hover:underline">
            {capabilities.find(c => c.id === capability.parent)?.name}
          </button>
        </div>
      )}

      {/* Linked strategies */}
      {strategies.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('strategy.singular')}</div>
          <div className="flex flex-wrap gap-1">
            {strategies.map(s => {
              const linked = capability.strategyIds?.includes(s.id) ?? false;
              if (isGovernance && !linked) return null;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (isGovernance) {
                      setSelectedItem({ type: 'strategy', id: s.id });
                      return;
                    }
                    const current = capability.strategyIds ?? [];
                    const next = linked
                      ? current.filter(id => id !== s.id)
                      : [...current, s.id];
                    updateCapability(capability.id, { strategyIds: next });
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors ${
                    linked
                      ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {s.name}
                  {linked && !isGovernance && <span className="text-[8px] leading-none">×</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {modules.roadmap && relatedInitiatives.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('detail.relatedActivities')}</div>
          <div className="space-y-0.5">
            {relatedInitiatives.map(i => (
              <button key={i.id}
                onClick={() => setSelectedItem({ type: 'initiative', id: i.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded hover:bg-gray-50 text-primary">
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Effects */}
      {modules.effects && relatedEffects.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('effects.enablesEffects')}</div>
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
      )}

      <CommentsSection itemId={capability.id} />
    </div>
  );
}
