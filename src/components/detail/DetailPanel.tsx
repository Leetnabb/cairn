import { useStore, EMPTY_INITIATIVES } from '../../stores/useStore';
import { CapabilityDetail } from './CapabilityDetail';
import { InitiativeDetail } from './InitiativeDetail';
import { MilestoneDetail } from './MilestoneDetail';
import { EffectDetail } from './EffectDetail';
import { GoalDetail } from './GoalDetail';

export function DetailPanel() {
  const selectedItem = useStore(s => s.ui.selectedItem);
  const capabilities = useStore(s => s.capabilities);
  const initiatives = useStore(s => s.scenarioStates[s.activeScenario]?.initiatives ?? EMPTY_INITIATIVES);
  const milestones = useStore(s => s.milestones);
  const effects = useStore(s => s.effects);
  const goals = useStore(s => s.strategicFrame?.goals ?? []);

  if (!selectedItem) {
    return null;
  }

  if (selectedItem.type === 'goal') {
    const goal = goals.find(g => g.id === selectedItem.id);
    if (!goal) return null;
    return <GoalDetail goal={goal} />;
  }

  if (selectedItem.type === 'capability') {
    const cap = capabilities.find(c => c.id === selectedItem.id);
    if (!cap) return null;
    return <CapabilityDetail capability={cap} />;
  }

  if (selectedItem.type === 'milestone') {
    const m = milestones.find(m => m.id === selectedItem.id);
    if (!m) return null;
    return <MilestoneDetail milestone={m} />;
  }

  if (selectedItem.type === 'effect') {
    const eff = effects.find(e => e.id === selectedItem.id);
    if (!eff) return null;
    return <EffectDetail effect={eff} />;
  }

  const init = initiatives.find(i => i.id === selectedItem.id);
  if (!init) return null;
  return <InitiativeDetail initiative={init} />;
}
