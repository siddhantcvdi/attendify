import { useCallback } from "react";
import { useAttendance } from "../context/AttendanceContext";
import { useSubjects } from "../context/SubjectsContext";
import { AttendanceStatus, Lecture } from "../data/types";

/**
 * Marks attendance for a lecture and keeps subject.attendedClasses /
 * subject.totalClasses in sync with the statusOverrides.
 */
export function useAttendanceActions() {
  const { setStatus, statusOverrides } = useAttendance();
  const { subjects, updateSubject } = useSubjects();

  const markAttendance = useCallback(
    (dateKey: string, lecture: Lecture, newStatus: AttendanceStatus) => {
      const oldStatus: AttendanceStatus =
        statusOverrides[`${dateKey}:${lecture.id}`] ?? null;

      setStatus(dateKey, lecture.id, newStatus);

      const subject = subjects.find((s) => s.id === lecture.subjectId);
      if (!subject) return;

      // present counts toward both attended + total
      // absent counts toward total only
      // cancelled / null count toward neither
      const deltaAttended =
        (newStatus === "present" ? 1 : 0) - (oldStatus === "present" ? 1 : 0);
      const deltaTotal =
        (newStatus !== null && newStatus !== "cancelled" ? 1 : 0) -
        (oldStatus !== null && oldStatus !== "cancelled" ? 1 : 0);

      if (deltaAttended !== 0 || deltaTotal !== 0) {
        updateSubject({
          ...subject,
          attendedClasses: Math.max(0, subject.attendedClasses + deltaAttended),
          totalClasses: Math.max(0, subject.totalClasses + deltaTotal),
        });
      }
    },
    [setStatus, statusOverrides, subjects, updateSubject]
  );

  return { markAttendance };
}
