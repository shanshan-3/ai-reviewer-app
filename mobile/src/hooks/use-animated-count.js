import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number from its current value to the target value.
 * Uses requestAnimationFrame with cubic ease-out for native 60/120fps smoothness.
 *
 * @param {number} target The target number to animate to.
 * @param {number} [duration=450] Animation duration in milliseconds.
 * @returns {number} The current animated number.
 */
export function useAnimatedCount(target, duration = 450) {
  const [count, setCount] = useState(() => (typeof target === 'number' ? target : 0));
  const currentVal = useRef(count);

  useEffect(() => {
    const startVal = currentVal.current;
    const endVal = typeof target === 'number' && !Number.isNaN(target) ? target : 0;

    if (startVal === endVal) return;

    let startTime = null;
    let frameId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic curve for snappy, satisfying count-up
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startVal + (endVal - startVal) * eased);
      currentVal.current = next;
      setCount(next);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return count;
}
