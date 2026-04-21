import { useState, useEffect, useRef } from "react";

/**
 * Returns a counter that increments every minute, aligned to the clock.
 * Forces re-renders so time-dependent UI (ongoing/upcoming) stays current.
 */
export function useMinuteTick(): number {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      setTick((t) => t + 1);
      intervalRef.current = setInterval(() => setTick((t) => t + 1), 60_000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return tick;
}
