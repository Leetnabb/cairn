import type { DimensionKey, EffectType } from '../../../types';

// --- Analysis (first AI call) ---

export interface AnalysisResult {
  summary: string;
  findings: Finding[];
  questions: Question[];
  readiness: number;
}

export interface Finding {
  text: string;
  type: 'initiative' | 'effect' | 'goal';
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface Question {
  id: string;
  text: string;
  context: string;
  options: string[];
  allowFreeText: boolean;
}

// --- Generation (second AI call) ---

export interface OnboardingResult {
  initiatives: OnboardingInitiative[];
  effects: OnboardingEffect[];
  insights: string[];
}

export interface OnboardingInitiative {
  name: string;
  dimension: DimensionKey;
  horizon: 'near' | 'far';
  description: string;
  confidence: 'high' | 'low';
  reasoning: string;
  effectNames: string[];
}

export interface OnboardingEffect {
  name: string;
  type: EffectType;
  description: string;
  confidence: 'high' | 'low';
}

// --- Industry/Size options ---

export const INDUSTRY_OPTIONS = [
  'offentlig_forvaltning',
  'helse',
  'finans',
  'teknologi',
  'industri_produksjon',
  'handel_retail',
  'utdanning',
  'annet',
] as const;

export type IndustryKey = typeof INDUSTRY_OPTIONS[number];

export const SIZE_OPTIONS = [
  'under_50',
  '50_200',
  '200_1000',
  '1000_5000',
  'over_5000',
] as const;

export type SizeKey = typeof SIZE_OPTIONS[number];
