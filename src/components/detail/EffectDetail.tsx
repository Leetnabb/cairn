import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { EFFECT_TYPE_COLORS } from '../../types';
import type { Effect } from '../../types';
import { EditEffectForm } from '../forms/EditEffectForm';
import { Button } from '../ui/Button';
import { CommentsSection } from './CommentsSection';

interface Props {
  effect: Effect;
}

export function EffectDetail({ effect }: Props) {
  const { t } = useTranslation();
  const editingId = useStore(s => s.ui.editingId);
  const setEditingId = useStore(s => s.setEditingId);
  const deleteEffect = useStore(s => s.deleteEffect);
  const setSelectedItem = useStore(s => s.setSelectedItem);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);

  const isEditing = editingId === effect.id;
  const modules = useStore(s => s.modules);

  const relatedCaps = useMemo(() =>
    capabilities.filter(c => effect.capabilities.includes(c.id)),
    [capabilities, effect.capabilities]
  );

  const relatedInits = useMemo(() =>
    initiatives.filter(i => effect.initiatives.includes(i.id)),
    [initiatives, effect.initiatives]
  );

  const handleDelete = () => {
    if (confirm(t('detail.confirmDelete', { name: effect.name }))) {
      deleteEffect(effect.id);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3">
        <h3 className="text-[12px] font-semibold mb-2">{t('effects.editEffect')}</h3>
        <EditEffectForm effect={effect} />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="px-1.5 py-0.5 text-[8px] font-medium rounded-full text-white"
              style={{ backgroundColor: EFFECT_TYPE_COLORS[effect.type] }}
            >
              {t(`effects.types.${effect.type}`)}
            </span>
          </div>
          <h3 className="text-[14px] font-semibold">{effect.name}</h3>
        </div>
        <div className="flex gap-1">
          <Button onClick={() => setEditingId(effect.id)}>&#10000;</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </div>

      {effect.description && (
        <p className="text-[11px] text-text-secondary">{effect.description}</p>
      )}

      {/* Indicator with baseline → target */}
      {effect.indicator && (
        <div className="px-2 py-1.5 rounded border border-border">
          <div className="text-[9px] text-text-tertiary uppercase">{t('effects.indicator')}</div>
          <div className="text-[11px] font-medium">{effect.indicator}</div>
          {(effect.baseline || effect.target) && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-text-secondary">
              {effect.baseline && <span>{effect.baseline}</span>}
              {effect.baseline && effect.target && <span>&rarr;</span>}
              {effect.target && <span className="font-medium text-primary">{effect.target}</span>}
            </div>
          )}
        </div>
      )}

      {/* Linked capabilities */}
      {modules.capabilities && relatedCaps.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('effects.linkedCapabilities')}</div>
          <div className="space-y-0.5">
            {relatedCaps.map(c => (
              <button key={c.id}
                onClick={() => setSelectedItem({ type: 'capability', id: c.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded hover:bg-[var(--bg-hover)] text-primary">
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Linked initiatives */}
      {modules.roadmap && relatedInits.length > 0 && (
        <div>
          <div className="text-[9px] text-text-tertiary uppercase mb-1">{t('effects.linkedInitiatives')}</div>
          <div className="space-y-0.5">
            {relatedInits.map(i => (
              <button key={i.id}
                onClick={() => setSelectedItem({ type: 'initiative', id: i.id })}
                className="block w-full text-left px-2 py-1 text-[10px] rounded hover:bg-[var(--bg-hover)] text-primary">
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <CommentsSection itemId={effect.id} />
    </div>
  );
}
