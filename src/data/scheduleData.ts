import { Lecture } from "./types";

// Weekday schedules: populated when user imports/sets up their timetable
const weekdaySchedules: Record<number, Omit<Lecture, "id" | "status">[]> = {};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getLecturesForDate(date: Date): Lecture[] {
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
}
