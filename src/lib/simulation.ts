import type { Capability, Initiative } from '../types';

export interface SimulatedCapability extends Capability {
  simulatedMaturity: number;
  improved: boolean;
}

export function simulateMaturity(capabilities: Capability[], initiatives: Initiative[]): SimulatedCapability[] {
  // Stopped/pivoted initiatives are cancelled or redirected — they should not
  // project maturity uplift in the simulation.
  const contributing = initiatives.filter(i => i.status !== 'stopped' && i.status !== 'pivoted');
  return capabilities.map(cap => {
    let bestMaturity = cap.maturity;
    for (const init of contributing) {
      const effect = init.maturityEffect[cap.id];
      // Only accept valid in-range integer effects (guards against NaN/out-of-range).
      if (typeof effect === 'number' && effect >= 1 && effect <= 3) {
        bestMaturity = Math.max(bestMaturity, effect) as 1 | 2 | 3;
      }
    }
    return {
      ...cap,
      simulatedMaturity: bestMaturity,
      improved: bestMaturity > cap.maturity,
    };
  });
}
