import { useState, useEffect, useMemo } from 'react';

interface DependencyOverlayProps {
  connections: { fromId: string; toId: string }[];
  cardRefs: Map<string, HTMLElement>;
  containerRef: React.RefObject<HTMLElement | null>;
}

function computeBezierPath(fromRect: DOMRect, toRect: DOMRect, containerRect: DOMRect, scrollLeft: number, scrollTop: number): string {
  // Determine smart edge points based on relative positions
  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRect.left + toRect.width / 2;
  const toCenterY = toRect.top + toRect.height / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  let fromX: number, fromY: number, toX: number, toY: number;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection: right edge -> left edge (or vice versa)
    if (dx > 0) {
      fromX = fromRect.right - containerRect.left + scrollLeft;
      fromY = fromRect.top + fromRect.height / 2 - containerRect.top + scrollTop;
      toX = toRect.left - containerRect.left + scrollLeft;
      toY = toRect.top + toRect.height / 2 - containerRect.top + scrollTop;
    } else {
      fromX = fromRect.left - containerRect.left + scrollLeft;
      fromY = fromRect.top + fromRect.height / 2 - containerRect.top + scrollTop;
      toX = toRect.right - containerRect.left + scrollLeft;
      toY = toRect.top + toRect.height / 2 - containerRect.top + scrollTop;
    }
    const dist = Math.abs(toX - fromX);
    const cp = Math.max(dist * 0.4, 40);
    const cpSign = dx > 0 ? 1 : -1;
    return `M ${fromX} ${fromY} C ${fromX + cp * cpSign} ${fromY}, ${toX - cp * cpSign} ${toY}, ${toX} ${toY}`;
  } else {
    // Vertical connection: bottom edge -> top edge (or vice versa)
    if (dy > 0) {
      fromX = fromRect.left + fromRect.width / 2 - containerRect.left + scrollLeft;
      fromY = fromRect.bottom - containerRect.top + scrollTop;
      toX = toRect.left + toRect.width / 2 - containerRect.left + scrollLeft;
      toY = toRect.top - containerRect.top + scrollTop;
    } else {
      fromX = fromRect.left + fromRect.width / 2 - containerRect.left + scrollLeft;
      fromY = fromRect.top - containerRect.top + scrollTop;
      toX = toRect.left + toRect.width / 2 - containerRect.left + scrollLeft;
      toY = toRect.bottom - containerRect.top + scrollTop;
    }
    const dist = Math.abs(toY - fromY);
    const cp = Math.max(dist * 0.4, 40);
    const cpSign = dy > 0 ? 1 : -1;
    return `M ${fromX} ${fromY} C ${fromX} ${fromY + cp * cpSign}, ${toX} ${toY - cp * cpSign}, ${toX} ${toY}`;
  }
}

export function DependencyOverlay({ connections, cardRefs, containerRef }: DependencyOverlayProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId: number | null = null;
    const throttledUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setTick(t => t + 1);
        rafId = null;
      });
    };
    const ro = new ResizeObserver(throttledUpdate);
    ro.observe(container);
    container.addEventListener('scroll', throttledUpdate, { passive: true });
    window.addEventListener('resize', throttledUpdate, { passive: true });
    return () => {
      ro.disconnect();
      container.removeEventListener('scroll', throttledUpdate);
      window.removeEventListener('resize', throttledUpdate);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef]);

  const paths = useMemo(() => {
    void tick; // dependency for recalculation
    const container = containerRef.current;
    if (!container || connections.length === 0) return [];

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    return connections
      .map(({ fromId, toId }) => {
        const fromEl = cardRefs.get(fromId);
        const toEl = cardRefs.get(toId);
        if (!fromEl || !toEl) return null;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        return {
          key: `${fromId}-${toId}`,
          d: computeBezierPath(fromRect, toRect, containerRect, scrollLeft, scrollTop),
        };
      })
      .filter((p): p is { key: string; d: string } => p !== null);
  }, [tick, connections, cardRefs, containerRef]);

  if (paths.length === 0) return null;

  const container = containerRef.current;
  if (!container) return null;

  return (
    <svg
      className="dependency-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: container.scrollWidth,
        height: container.scrollHeight,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {paths.map(({ key, d }) => (
        <path
          key={key}
          d={d}
          stroke="var(--dependency-line)"
          strokeWidth={2}
          opacity={0.6}
          fill="none"
          strokeDasharray="8 4"
          style={{ animation: 'dependency-flow 0.6s linear infinite' }}
        />
      ))}
    </svg>
  );
}
