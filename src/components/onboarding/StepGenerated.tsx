import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import type { GeneratedStrategicPicture } from '../../lib/ai/generateStrategicPicture';
import { DIMENSION_MAP, type DimensionKey } from '../../types';

type GeneratedItem = { name: string; included: boolean };

function useEditableList<T extends { name: string }>(initial: T[]) {
  const [items, setItems] = useState(() =>
    initial.map((item) => ({ ...item, included: true }))
  );

  const toggle = (index: number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, included: !item.included } : item))
    );

  const rename = (index: number, name: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    );

  const remove = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  return { items, toggle, rename, remove };
}

interface EditableRowProps {
  name: string;
  included: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  accent?: string;
  badge?: string;
}

function EditableRow({ name, included, onToggle, onRename, onRemove, accent, badge }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    if (draft.trim()) onRename(draft.trim());
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-md group transition-colors ${
      included ? 'hover:bg-surface-hover' : 'opacity-50 hover:bg-surface-hover'
    }`}>
      <input
        type="checkbox"
        checked={included}
        onChange={onToggle}
        className="w-3.5 h-3.5 accent-primary shrink-0 cursor-pointer"
      />
      {badge && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 text-white"
          style={{ backgroundColor: accent ?? '#6366f1' }}
        >
          {badge}
        </span>
      )}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="flex-1 text-[12px] bg-white border border-primary rounded px-1.5 py-0.5 focus:outline-none text-text-primary"
        />
      ) : (
        <span
          className="flex-1 text-[12px] text-text-primary cursor-text truncate"
          onClick={() => setEditing(true)}
          title="Klikk for å redigere"
        >
          {name}
        </span>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-text-tertiary hover:text-red-500 transition-all shrink-0"
        title="Fjern"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-text-tertiary uppercase mb-1.5">{title}</h3>
      <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

interface StepGeneratedInnerProps {
  picture: GeneratedStrategicPicture;
}

function StepGeneratedInner({ picture }: StepGeneratedInnerProps) {
  const { t } = useTranslation();
  const { nextStep, prevStep, setGeneratedPicture } = useOnboardingStore();

  const strategies = useEditableList(picture.strategies);
  const capabilities = useEditableList(picture.capabilities);
  const initiatives = useEditableList(picture.initiatives);
  const effects = useEditableList(picture.effects);

  const handleNext = () => {
    // Write back any edits to the store before advancing
    const updatedPicture: GeneratedStrategicPicture = {
      ...picture,
      strategies: strategies.items
        .filter((s) => s.included)
        .map(({ name, ...rest }) => ({ ...rest, name })),
      capabilities: capabilities.items
        .filter((c) => c.included)
        .map(({ name, ...rest }) => ({ ...rest, name })),
      initiatives: initiatives.items
        .filter((i) => i.included)
        .map(({ name, ...rest }) => ({ ...rest, name })),
      effects: effects.items
        .filter((e) => e.included)
        .map(({ name, ...rest }) => ({ ...rest, name })),
    };
    setGeneratedPicture(updatedPicture);
    nextStep();
  };

  // Group initiatives by dimension
  const initiativesByDimension = (['ledelse', 'virksomhet', 'organisasjon', 'teknologi'] as DimensionKey[]).map(dim => ({
    dim,
    items: initiatives.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => (item as GeneratedItem & { dimension: DimensionKey }).dimension === dim),
  })).filter(({ items }) => items.length > 0);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-text-primary">{t('onboarding.generated.title')}</h2>
        <p className="text-[12px] text-text-secondary mt-1">{t('onboarding.generated.subtitle')}</p>
      </div>

      {/* Strategies */}
      <Section title={t('onboarding.generated.strategies')}>
        {strategies.items.map((item, i) => (
          <EditableRow
            key={i}
            name={item.name}
            included={item.included}
            onToggle={() => strategies.toggle(i)}
            onRename={(name) => strategies.rename(i, name)}
            onRemove={() => strategies.remove(i)}
          />
        ))}
      </Section>

      {/* Capabilities — show level 1 with their children indented */}
      <Section title={t('onboarding.generated.capabilities')}>
        {capabilities.items.map((item, i) => {
          const cap = item as GeneratedItem & { level: 1 | 2; parent: string | null };
          return (
            <div key={i} style={{ paddingLeft: cap.level === 2 ? '16px' : '0' }}>
              <EditableRow
                name={item.name}
                included={item.included}
                onToggle={() => capabilities.toggle(i)}
                onRename={(name) => capabilities.rename(i, name)}
                onRemove={() => capabilities.remove(i)}
              />
            </div>
          );
        })}
      </Section>

      {/* Initiatives grouped by dimension */}
      <div>
        <h3 className="text-[10px] font-bold text-text-tertiary uppercase mb-1.5">{t('onboarding.generated.initiatives')}</h3>
        <div className="space-y-2">
          {initiativesByDimension.map(({ dim, items }) => {
            const dimInfo = DIMENSION_MAP[dim];
            return (
              <div key={dim} className="border border-border rounded-lg overflow-hidden">
                <div
                  className="px-3 py-1.5 text-[10px] font-bold uppercase"
                  style={{ backgroundColor: dimInfo.bgColor, color: dimInfo.textColor }}
                >
                  {dimInfo.label}
                </div>
                <div className="divide-y divide-border">
                  {items.map(({ item, index }) => (
                    <EditableRow
                      key={index}
                      name={item.name}
                      included={item.included}
                      onToggle={() => initiatives.toggle(index)}
                      onRename={(name) => initiatives.rename(index, name)}
                      onRemove={() => initiatives.remove(index)}
                      accent={dimInfo.color}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Effects */}
      <Section title={t('onboarding.generated.effects')}>
        {effects.items.map((item, i) => (
          <EditableRow
            key={i}
            name={item.name}
            included={item.included}
            onToggle={() => effects.toggle(i)}
            onRename={(name) => effects.rename(i, name)}
            onRemove={() => effects.remove(i)}
          />
        ))}
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={prevStep}
          className="px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; {t('common.back')}
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {t('common.continue')} &rarr;
        </button>
      </div>
    </div>
  );
}

export function StepGenerated() {
  const { t } = useTranslation();
  const generatedPicture = useOnboardingStore(s => s.generatedPicture);

  if (!generatedPicture) {
    return (
      <div className="py-8 text-center text-[12px] text-text-tertiary">
        {t('onboarding.generated.noData')}
      </div>
    );
  }

  return <StepGeneratedInner picture={generatedPicture} />;
}
