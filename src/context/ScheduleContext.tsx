import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Lecture } from "../data/types";
import { Storage } from "../storage";

type ScheduleTemplate = Omit<Lecture, "id" | "status">;
type WeekdaySchedules = Record<number, ScheduleTemplate[]>;

interface ScheduleContextValue {
  weekdaySchedules: WeekdaySchedules;
  getLecturesForDate: (date: Date) => Lecture[];
  setSchedule: (schedules: WeekdaySchedules) => void;
}

const ScheduleContext = createContext<ScheduleContextValue>({
  weekdaySchedules: {},
  getLecturesForDate: () => [],
  setSchedule: () => {},
});

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [weekdaySchedules, setWeekdaySchedules] = useState<WeekdaySchedules>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Storage.get<WeekdaySchedules>(Storage.KEYS.SCHEDULE).then((saved) => {
      if (saved) setWeekdaySchedules(saved);
      setLoaded(true);
    });
  }, []);

  const setSchedule = useCallback((schedules: WeekdaySchedules) => {
    setWeekdaySchedules(schedules);
    Storage.set(Storage.KEYS.SCHEDULE, schedules);
  }, []);

  const getLecturesForDate = useCallback((date: Date): Lecture[] => {
    const dayOfWeek = date.getDay();
    const templates = weekdaySchedules[dayOfWeek];
    if (!templates || templates.length === 0) return [];

    const today = new Date();
    const isToday = isSameDay(date, today);
    const isPast = date < today && !isToday;

    return templates.map((t, i) => ({
      ...t,
      id: `lec-${dayOfWeek}-${i}`,
      status: isPast
        ? ((i + dayOfWeek) % 7 === 0 ? "cancelled" : (i + dayOfWeek) % 5 === 0 ? "absent" : "present")
        : isToday
        ? (i < 2 ? "present" : null)
        : null,
    }));
  }, [weekdaySchedules]);

  if (!loaded) return null;

  return (
    <ScheduleContext.Provider value={{ weekdaySchedules, getLecturesForDate, setSchedule }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  return useContext(ScheduleContext);
}
