import { useState } from 'react';
import { useComplexityLevel } from '../../hooks/useComplexityLevel';
import type { Initiative, Capability, Effect, ValueChain } from '../../types';
import { DimensionHealth } from './DimensionHealth';
import { MaturityJourney } from './MaturityJourney';
import { OwnerLoad } from './OwnerLoad';
import { CriticalPathNarrative } from './CriticalPathNarrative';
import { StrategicBottlenecks } from './StrategicBottlenecks';
import { ValueChainView } from './ValueChainView';
import { EffectFunnel } from './EffectFunnel';
import { SnapshotList } from './SnapshotList';

interface Props {
  initiatives: Initiative[];
  capabilities: Capability[];
  effects: Effect[];
  valueChains: ValueChain[];
}

export function DeepDive({ initiatives, capabilities, effects, valueChains }: Props) {
  const { level } = useComplexityLevel();
  const [expanded, setExpanded] = useState(false);

  if (level < 2) return null;

  return (
    <div className="mb-4">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 rounded border border-slate-700 hover:brightness-105 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500"
      >
        <span className="text-sm font-semibold text-slate-200">
          Dypdykk / Deep dive
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Collapsible content */}
      {expanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DimensionHealth */}
          <div className="bg-card rounded border border-border p-3">
            <h3 className="text-[11px] font-semibold mb-2">Dimensjonshelse</h3>
            <DimensionHealth initiatives={initiatives} />
          </div>

          {/* MaturityJourney */}
          <div className="bg-card rounded border border-border p-3">
            <h3 className="text-[11px] font-semibold mb-2">Modenhetreise</h3>
            <MaturityJourney capabilities={capabilities} />
          </div>

          {/* OwnerLoad */}
          <div className="bg-card rounded border border-border p-3">
            <h3 className="text-[11px] font-semibold mb-2">Eierbelastning</h3>
            <OwnerLoad initiatives={initiatives} />
          </div>

          {/* CriticalPathNarrative */}
          <div className="bg-card rounded border border-border p-3">
            <h3 className="text-[11px] font-semibold mb-2">Kritisk sti</h3>
            <CriticalPathNarrative initiatives={initiatives} />
          </div>

          {/* StrategicBottlenecks */}
          <div className="bg-card rounded border border-border p-3">
            <h3 className="text-[11px] font-semibold mb-2">Strategiske flaskehalser</h3>
            <StrategicBottlenecks />
          </div>

          {/* ValueChainView */}
          <div className="bg-card rounded border border-border p-3">
            <h3 className="text-[11px] font-semibold mb-2">Verdikjeder</h3>
            <ValueChainView initiatives={initiatives} valueChains={valueChains} />
          </div>

          {/* EffectFunnel */}
          <div className="bg-card rounded border border-border p-3">
            <EffectFunnel initiatives={initiatives} capabilities={capabilities} effects={effects} />
          </div>

          {/* SnapshotList */}
          <div className="bg-card rounded border border-border p-3">
            <SnapshotList />
          </div>
        </div>
      )}
    </div>
  );
}
