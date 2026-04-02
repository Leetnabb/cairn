import { useCallback, useState, useRef, useEffect } from 'react';

type Mode = 'work' | 'board';

export function useMode() {
  const [mode, setMode] = useState<Mode>('work');
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const enterBoardView = useCallback(() => {
    setTransitioning(true);
    document.documentElement.classList.add('mode-transitioning');
    timeoutRef.current = window.setTimeout(() => {
      document.documentElement.setAttribute('data-mode', 'board');
      document.body.classList.add('board-view-active');
      setMode('board');
      timeoutRef.current = window.setTimeout(() => {
        setTransitioning(false);
        document.documentElement.classList.remove('mode-transitioning');
      }, 200);
    }, 200);
  }, []);

  const exitBoardView = useCallback(() => {
    setTransitioning(true);
    document.documentElement.classList.add('mode-transitioning');
    timeoutRef.current = window.setTimeout(() => {
      document.documentElement.setAttribute('data-mode', 'work');
      document.body.classList.remove('board-view-active');
      setMode('work');
      timeoutRef.current = window.setTimeout(() => {
        setTransitioning(false);
        document.documentElement.classList.remove('mode-transitioning');
      }, 200);
    }, 200);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.documentElement.classList.remove('mode-transitioning');
    };
  }, []);

  return { mode, transitioning, enterBoardView, exitBoardView };
}
