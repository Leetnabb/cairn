import type { Capability, Initiative } from '../types';

export interface SimulatedCapability extends Capability {
  simulatedMaturity: number;
  improved: boolean;
}

export function simulateMaturity(capabilities: Capability[], initiatives: Initiative[]): SimulatedCapability[] {
  return capabilities.map(cap => {
    let bestMaturity = cap.maturity;
    for (const init of initiatives) {
      const effect = init.maturityEffect[cap.id];
      if (effect !== undefined) {
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
