import type { AppState } from '../types';

/** Bumped when the export shape changes in a way importers must migrate. */
export const CAIRN_EXPORT_VERSION = 1;

export function exportJson(state: AppState) {
  const { snapshots: _snapshots, ...rest } = state;
  const exportData = { version: CAIRN_EXPORT_VERSION, ...rest };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cairn-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
