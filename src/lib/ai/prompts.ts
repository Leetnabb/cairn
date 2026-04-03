import type { AppState } from '../../types';
import i18n from '../../i18n';
import { computeStrategicDiagnostics } from '../strategicDiagnostics';

function serializeContext(state: AppState): string {
  const scenario = state.scenarioStates[state.activeScenario];
  const initiatives = scenario?.initiatives || [];
  const caps = state.capabilities;
  const vcs = state.valueChains;
  const milestones = state.milestones;

  const lines: string[] = [];

  if (state.strategicFrame) {
    lines.push(`## Strategisk retning`);
    lines.push(state.strategicFrame.direction);
    if (state.strategicFrame.themes.length > 0) {
      lines.push(`\n### Strategiske temaer`);
      for (const theme of state.strategicFrame.themes) {
        lines.push(`- ${theme.name}: ${theme.description}`);
      }
    }
    lines.push('');
  }

  lines.push(`## ${i18n.t('ai.contextCapabilities')}`);
  const l1 = caps.filter(c => c.level === 1);
  for (const c of l1) {
    const subs = caps.filter(s => s.level === 2 && s.parent === c.id);
    const subNames = subs.map(s => s.name).join(', ');
    lines.push(`- ${c.name} (id:${c.id}, ${i18n.t('ai.contextMaturity')}:${c.maturity}, ${i18n.t('ai.contextRisk')}:${c.risk})${subNames ? ` \u2192 [${subNames}]` : ''}`);
  }

  lines.push(`\n## ${i18n.t('ai.contextActivities')}`);
  for (const init of initiatives) {
    const capNames = init.capabilities
      .map(cid => caps.find(c => c.id === cid)?.name)
      .filter(Boolean)
      .join(', ');
    lines.push(`- ${init.name} (id:${init.id}, ${i18n.t('ai.contextDim')}:${init.dimension}, ${i18n.t('ai.contextHorizon')}:${init.horizon}, ${i18n.t('ai.contextOwner')}:${init.owner || i18n.t('ai.contextNone')})${capNames ? ` [${i18n.t('ai.contextCap')}: ${capNames}]` : ''}`);
  }

  if (vcs.length > 0) {
    lines.push(`\n## ${i18n.t('ai.contextValueChains')}`);
    for (const vc of vcs) {
      lines.push(`- ${vc.name} (id:${vc.id})`);
    }
  }

  if (milestones.length > 0) {
    lines.push(`\n## ${i18n.t('ai.contextMilestones')}`);
    for (const m of milestones) {
      lines.push(`- ${m.name} (${i18n.t('ai.contextHorizon')}:${m.horizon}, ${i18n.t('common.position').toLowerCase()}:${Math.round(m.position * 100)}%)`);
    }
  }

  return lines.join('\n');
}

export function buildChatSystemPrompt(state: AppState): string {
  const context = serializeContext(state);
  const basePrompt = i18n.t('ai.chatSystemPrompt');

  const actionInstructions = i18n.language === 'en'
    ? `## Updating existing elements
When the user asks to update an existing activity or capability, use this format:

\`\`\`json:suggestion
{
  "action": "update",
  "type": "initiative",
  "targetName": "Exact name of existing element",
  "updates": { "description": "New description", "status": "in_progress" }
}
\`\`\`

## Deleting elements
When the user asks to delete an existing activity or capability:

\`\`\`json:suggestion
{
  "action": "delete",
  "type": "initiative",
  "targetName": "Exact name of existing element"
}
\`\`\`

## Status values
Activities can have a status: "planned", "in_progress", "done", "stopped", or "changed_direction".`
    : `## Oppdatering av eksisterende elementer
Når brukeren ber om å oppdatere en eksisterende aktivitet eller kapabilitet, bruk dette formatet:

\`\`\`json:suggestion
{
  "action": "update",
  "type": "initiative",
  "targetName": "Eksakt navn på eksisterende element",
  "updates": { "description": "Ny beskrivelse", "status": "in_progress" }
}
\`\`\`

## Sletting av elementer
Når brukeren ber om å slette en eksisterende aktivitet eller kapabilitet:

\`\`\`json:suggestion
{
  "action": "delete",
  "type": "initiative",
  "targetName": "Eksakt navn på eksisterende element"
}
\`\`\`

## Status-verdier
Aktiviteter kan ha status: "planned", "in_progress", "done", "stopped", eller "changed_direction".`;

  const scenario = state.scenarioStates[state.activeScenario];
  const diagnostics = computeStrategicDiagnostics(
    scenario?.initiatives || [],
    state.effects,
    state.strategicFrame
  );
  let diagnosticsSection = '';
  if (diagnostics.length > 0) {
    diagnosticsSection = `\n\n## Strategisk diagnostikk\nFølgende observasjoner er gjort:\n${diagnostics.map(d => `- ${d.message}`).join('\n')}`;
  }

  return `${basePrompt}

${actionInstructions}

## ${i18n.language === 'en' ? 'Current path' : 'Gjeldende veikart'}
${context}${diagnosticsSection}`;
}

export function buildFormSuggestionPrompt(
  tabType: 'initiative' | 'capability',
): string {
  if (tabType === 'initiative') {
    return i18n.t('ai.formPromptInitiative');
  }
  return i18n.t('ai.formPromptCapability');
}
