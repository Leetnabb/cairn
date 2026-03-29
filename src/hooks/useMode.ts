import { useCallback, useState } from 'react';

type Mode = 'work' | 'board';

export function useMode() {
  const [mode, setMode] = useState<Mode>('work');
  const [transitioning, setTransitioning] = useState(false);

  const enterBoardView = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      document.documentElement.setAttribute('data-mode', 'board');
      document.body.classList.add('board-view-active');
      setMode('board');
      setTimeout(() => setTransitioning(false), 200);
    }, 200);
  }, []);

  const exitBoardView = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      document.documentElement.setAttribute('data-mode', 'work');
      document.body.classList.remove('board-view-active');
      setMode('work');
      setTimeout(() => setTransitioning(false), 200);
    }, 200);
  }, []);

  return { mode, transitioning, enterBoardView, exitBoardView };
}
