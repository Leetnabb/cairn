import type { Initiative, ValueChain } from '../../types';

interface Props {
  initiatives: Initiative[];
  valueChains: ValueChain[];
}

export function ValueChainView({ initiatives, valueChains }: Props) {
  if (valueChains.length === 0) {
    return <p className="text-[10px] text-text-tertiary italic">Ingen verdikjeder definert</p>;
  }

  return (
    <div className="space-y-2">
      {valueChains.map(vc => {
        const related = initiatives.filter(i => i.valueChains.includes(vc.id));
        return (
          <div key={vc.id}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: vc.color }} />
              <span className="text-[11px] font-medium">{vc.name}</span>
              <span className="text-[9px] text-text-tertiary">({related.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 ml-4">
              {related.map(i => (
                <span key={i.id} className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--bg-hover)] text-text-secondary">
                  {i.name}
                </span>
              ))}
              {related.length === 0 && (
                <span className="text-[9px] text-text-tertiary italic">Ingen aktiviteter</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
