import type { Capability, Initiative, ValueChain, Effect } from '../../types';

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities: Capability[];
  sampleInitiatives: Initiative[];
  valueChains: ValueChain[];
  effects: Effect[];
}

// Registry — import and register templates here
import { frivilligTemplate } from './frivillig';
import { kommuneTemplate } from './kommune';
import { itSelskapTemplate } from './it-selskap';

export const templates: IndustryTemplate[] = [
  frivilligTemplate,
  kommuneTemplate,
  itSelskapTemplate,
];

export function getTemplateById(id: string): IndustryTemplate | undefined {
  return templates.find(t => t.id === id);
}
