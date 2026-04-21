import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useProfile } from "../context/ProfileContext";
import { useSchedule } from "../context/ScheduleContext";
import { useSubjects } from "../context/SubjectsContext";
import { useAttendance } from "../context/AttendanceContext";
import {
  startAttendanceTracking,
  stopAttendanceTracking,
  scheduleWeekAhead,
  cancelAllAttendanceNotifications,
  checkAndMarkAttendance,
  NOTIFICATION_CATEGORY,
} from "../services/attendanceTask";

/**
 * Three layers of auto-attendance on Android:
 *
 * 1. Scheduled notifications (DATE trigger) — fire at exact class time.
 *    The foreground service keeps the process alive so the in-process
 *    listener fires even when the app is backgrounded.
 *
 * 2. Background location task — fires on movement with fresh coords.
 *
 * 3. Background fetch — periodic timer (~5-10 min) for stationary case.
 */
export function useAutoAttendance() {
  const { profile } = useProfile();
  const { weekdaySchedules } = useSchedule();
  const { subjects, updateSubject, reload: reloadSubjects } = useSubjects();
  const { setStatus, statusOverrides, reload: reloadAttendance } = useAttendance();

  const scheduleKey = JSON.stringify(weekdaySchedules);

  // Start / stop background tracking
  useEffect(() => {
    if (profile.autoAttendance) {
      startAttendanceTracking().catch(() => {});
    } else {
      stopAttendanceTracking().catch(() => {});
      cancelAllAttendanceNotifications().catch(() => {});
    }
  }, [profile.autoAttendance]);

  // Schedule notifications whenever schedule changes
  useEffect(() => {
    if (!profile.autoAttendance) return;
    scheduleWeekAhead(weekdaySchedules, subjects).catch(() => {});
  }, [profile.autoAttendance, scheduleKey]);

  // Listen for attendance notifications (fires even when backgrounded
  // because the foreground service keeps the process alive on Android)
  useEffect(() => {
    if (!profile.autoAttendance) return;

    const sub = Notifications.addNotificationReceivedListener(async (n) => {
      if (n.request.content.categoryIdentifier !== NOTIFICATION_CATEGORY) return;

      const { lectureId, dk, subjectId } =
        (n.request.content.data as any) ?? {};
      if (!lectureId || !dk || !subjectId) return;
      if (statusOverrides[`${dk}:${lectureId}`] != null) return;

      // Run the check — this also writes to storage + sends result notification
      await checkAndMarkAttendance();

      // Sync React context so UI reflects the change
      reloadAttendance().catch(() => {});
      reloadSubjects().catch(() => {});
    });

    return () => sub.remove();
  }, [profile.autoAttendance, statusOverrides]);

  // Reload context from storage when app returns to foreground
  // (picks up writes from background location/fetch tasks)
  useEffect(() => {
    if (!profile.autoAttendance) return;

    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        checkAndMarkAttendance().catch(() => {});
        reloadAttendance().catch(() => {});
        reloadSubjects().catch(() => {});
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [profile.autoAttendance, reloadAttendance, reloadSubjects]);
}
