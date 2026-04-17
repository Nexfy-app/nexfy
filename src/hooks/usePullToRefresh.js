import { useState, useEffect, useRef, useCallback } from 'react';

const THRESHOLD = 72; // px to pull before triggering

export default function usePullToRefresh(onRefresh, containerRef) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = containerRef?.current;
    if (el && el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, [containerRef]);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { setPullY(0); setPulling(false); return; }
    // Resistance
    const capped = Math.min(dy * 0.45, THRESHOLD * 1.3);
    setPullY(capped);
    setPulling(capped > 10);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    setPulling(false);
    startY.current = null;
  }, [pullY, onRefresh]);

  return { pulling, pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}