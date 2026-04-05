import { Subject, Lecture } from "../data/types";

export function getAttendancePercentage(subject: Subject): number {
  if (subject.totalClasses === 0) return 0;
  return Math.round((subject.attendedClasses / subject.totalClasses) * 100);
}

export function getTodayAttendancePercentage(lectures: Lecture[]): number {
  // Cancelled lectures don't count toward attendance
  const relevant = lectures.filter((l) => l.status === "present" || l.status === "absent");
  if (relevant.length === 0) return 0;
  const attended = relevant.filter((l) => l.status === "present").length;
  return Math.round((attended / relevant.length) * 100);
}

export function getAttendanceColor(percentage: number): string {
  if (percentage < 75) return "#ff7648";
  return "#4dc591";
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function getOngoingOrNextLecture(
  lectures: Lecture[]
): { lecture: Lecture; isOngoing: boolean } | null {
  const currentMinutes = getCurrentMinutes();

  // Only consider non-cancelled lectures
  const active = lectures.filter((l) => l.status !== "cancelled");

  // Check for ongoing lecture
  const ongoing = active.find((l) => {
    const start = parseTime(l.startTime);
    const end = parseTime(l.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  if (ongoing) {
    return { lecture: ongoing, isOngoing: true };
  }

  // Find next upcoming lecture
  const upcoming = active
    .filter((l) => parseTime(l.startTime) > currentMinutes)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  if (upcoming.length > 0) {
    return { lecture: upcoming[0], isOngoing: false };
  }

  return null;
}

export function getDashboardLectures(
  lectures: Lecture[]
): { lecture: Lecture; isOngoing: boolean }[] {
  const currentMinutes = getCurrentMinutes();
  const active = lectures.filter((l) => l.status !== "cancelled");

  const ongoing = active.find((l) => {
    const start = parseTime(l.startTime);
    const end = parseTime(l.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  const upcoming = active
    .filter((l) => parseTime(l.startTime) > currentMinutes)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  const result: { lecture: Lecture; isOngoing: boolean }[] = [];

  if (ongoing) {
    result.push({ lecture: ongoing, isOngoing: true });
    if (upcoming.length > 0) result.push({ lecture: upcoming[0], isOngoing: false });
  } else {
    upcoming.slice(0, 2).forEach((l) => result.push({ lecture: l, isOngoing: false }));
  }

  return result;
}

export function getTodayProgress(lectures: Lecture[]): {
  attended: number;
  total: number;
  cancelled: number;
} {
  const cancelled = lectures.filter((l) => l.status === "cancelled").length;
  const attended = lectures.filter((l) => l.status === "present").length;
  return { attended, total: lectures.length, cancelled };
}
