import { useStore as useZustandStore } from 'zustand';
import { useStore } from '../../stores/useStore';

export function UndoRedoButtons() {
  const { pastStates, futureStates, undo, redo } = useZustandStore(useStore.temporal);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className="w-7 h-7 flex items-center justify-center rounded text-text-secondary hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M3 13C5 7 10 4 16 5.5a9 9 0 0 1 5 7.5" />
        </svg>
      </button>
      <button
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className="w-7 h-7 flex items-center justify-center rounded text-text-secondary hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M21 13C19 7 14 4 8 5.5a9 9 0 0 0-5 7.5" />
        </svg>
      </button>
    </div>
  );
}
