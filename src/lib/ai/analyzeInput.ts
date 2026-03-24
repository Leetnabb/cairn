import { parseJsonObjectFromAI } from './parseJsonResponse';
import type { AnalysisResult } from './frameworks/onboardingFramework';

export function buildOnboardingInput(
  uploadedFiles: Array<{ name: string; text: string }>,
  orgDescription: string,
): string {
  const totalBudget = 150_000;
  const descText = orgDescription.trim();
  const descBudget = Math.min(descText.length, 10_000);
  const fileBudget = uploadedFiles.length > 0
    ? Math.floor((totalBudget - descBudget) / uploadedFiles.length)
    : 0;

  const fileParts = uploadedFiles
    .map(f => `--- [${f.name}] ---\n${f.text.slice(0, fileBudget)}`)
    .join('\n\n');
  const descPart = descText
    ? `--- Organisasjonsbeskrivelse ---\n${descText.slice(0, descBudget)}`
    : '';
  return [fileParts, descPart].filter(Boolean).join('\n\n');
}

export async function analyzeInput(
  input: string,
  accessToken: string,
  industry?: string,
  orgSize?: string,
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-input`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ input, industry, orgSize }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const parsed = parseJsonObjectFromAI(data.text) as unknown as AnalysisResult;

  if (!parsed.findings || !Array.isArray(parsed.findings)) {
    throw new Error('Invalid analysis response');
  }

  return parsed;
}
