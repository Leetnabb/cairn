import { useState, useCallback } from 'react';

export function useDragAndDrop() {
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
  }, []);

  return { dragId, handleDragStart, handleDragEnd };
}
