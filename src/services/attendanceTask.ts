import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import { Storage } from "../storage";
import { NamedLocation, Subject, UserProfile, Lecture, AttendanceStatus } from "../data/types";

const LOCATION_TASK = "ATTENDIFY_LOCATION_TASK";
const FETCH_TASK = "ATTENDIFY_FETCH_TASK";
const CHANNEL_ID = "attendify-attendance";

type StatusOverrides = Record<string, AttendanceStatus>;
type ScheduleTemplate = Omit<Lecture, "id" | "status">;
type WeekdaySchedules = Record<number, ScheduleTemplate[]>;

// Android 8+ requires a notification channel
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Attendance Checks",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Core attendance check. Compares given coordinates against schedule.
 * Marks any lectures currently in session and sends a notification.
 */
async function markAttendanceIfNeeded(
  latitude: number,
  longitude: number
): Promise<void> {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();
  const dk = dateKey(now);

  const [profile, subjects, schedule, statusOverrides] = await Promise.all([
    Storage.get<UserProfile>(Storage.KEYS.PROFILE),
    Storage.get<Subject[]>(Storage.KEYS.SUBJECTS),
    Storage.get<WeekdaySchedules>(Storage.KEYS.SCHEDULE),
    Storage.get<StatusOverrides>(Storage.KEYS.ATTENDANCE),
  ]);

  if (!profile?.autoAttendance || !subjects || !schedule) return;
  if (!profile.locations || profile.locations.length === 0) return;

  const templates = schedule[dayOfWeek];
  if (!templates || templates.length === 0) return;

  const overrides: StatusOverrides = statusOverrides ?? {};
  let changed = false;
  const updatedSubjects = [...subjects];
  let subjectsChanged = false;

  for (let index = 0; index < templates.length; index++) {
    const tmpl = templates[index];
    if (!tmpl.startTime) continue;

    const [h, m] = tmpl.startTime.split(":").map(Number);
    const startMinutes = h * 60 + m;

    // Check window: from class start to 20 min after (covers bg fetch delays)
    if (currentMinutes < startMinutes || currentMinutes > startMinutes + 20) continue;

    const lectureId = `lec-${dayOfWeek}-${index}`;
    const key = `${dk}:${lectureId}`;

    if (overrides[key] != null) continue;

    // Find subject's expected location
    const subject = subjects.find((s) => s.id === tmpl.subjectId);
    const locationId = subject?.locationId;
    const loc: NamedLocation | undefined = locationId
      ? profile.locations.find((l) => l.id === locationId)
      : profile.locations[0];

    if (!loc) continue;

    const distance = haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
    const status: AttendanceStatus = distance <= loc.radius ? "present" : "absent";

    overrides[key] = status;
    changed = true;

    // Update subject counters
    const subjectIdx = updatedSubjects.findIndex((s) => s.id === tmpl.subjectId);
    if (subjectIdx >= 0) {
      updatedSubjects[subjectIdx] = {
        ...updatedSubjects[subjectIdx],
        totalClasses: updatedSubjects[subjectIdx].totalClasses + 1,
        attendedClasses:
          updatedSubjects[subjectIdx].attendedClasses + (status === "present" ? 1 : 0),
      };
      subjectsChanged = true;
    }

    // Notify user
    const subjectName = subject?.name ?? tmpl.subjectName ?? "Class";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: status === "present" ? "Marked Present" : "Marked Absent",
        body: subjectName,
        sound: true,
        ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
      },
      trigger: null,
    });
  }

  if (changed) await Storage.set(Storage.KEYS.ATTENDANCE, overrides);
  if (subjectsChanged) await Storage.set(Storage.KEYS.SUBJECTS, updatedSubjects);
}

/**
 * Public wrapper — resolves location then checks attendance.
 * Called from the hook when app comes to foreground.
 */
export async function checkAndMarkAttendance(): Promise<void> {
  try {
    // Use cached location only if < 3 min old; otherwise get a fresh fix
    const last = await Location.getLastKnownPositionAsync({ maxAge: 3 * 60 * 1000 });
    const pos = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    if (!pos) return;
    await markAttendanceIfNeeded(pos.coords.latitude, pos.coords.longitude);
  } catch {}
}

// ── Background location task ────────────────────────────────────────────
// Fires on movement — uses the fresh coordinates directly (no GPS query needed)
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const latest = locations[locations.length - 1];
  await markAttendanceIfNeeded(latest.coords.latitude, latest.coords.longitude);
});

// ── Background fetch task ───────────────────────────────────────────────
// Safety net — fires periodically even when user is stationary
TaskManager.defineTask(FETCH_TASK, async () => {
  try {
    await checkAndMarkAttendance();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const NOTIFICATION_CATEGORY = "ATTENDIFY_AUTO_ATTENDANCE";

/**
 * Schedule notifications at exact class times for the next 7 days.
 * On Android with a foreground service running, the in-process
 * notification listener fires even when the app is backgrounded —
 * making this the most time-precise trigger.
 */
export async function scheduleWeekAhead(
  weekdaySchedules: WeekdaySchedules,
  subjects: { id: string; name: string }[]
): Promise<void> {
  // Cancel previous attendance notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.categoryIdentifier === NOTIFICATION_CATEGORY) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const now = Date.now();
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    const templates = weekdaySchedules[dayOfWeek];
    if (!templates || templates.length === 0) continue;

    const dk = dateKey(date);

    for (let index = 0; index < templates.length; index++) {
      const tmpl = templates[index];
      if (!tmpl.startTime) continue;

      const lectureId = `lec-${dayOfWeek}-${index}`;
      const subjectName = subjectMap.get(tmpl.subjectId) ?? tmpl.subjectName ?? "Class";
      const [h, m] = tmpl.startTime.split(":").map(Number);

      const content: Notifications.NotificationContentInput = {
        title: "Attendify",
        body: `Checking attendance for ${subjectName}`,
        data: { lectureId, dk, subjectId: tmpl.subjectId },
        categoryIdentifier: NOTIFICATION_CATEGORY,
        sound: true,
      };

      const startTime = new Date(date);
      startTime.setHours(h, m, 0, 0);
      if (startTime.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: startTime,
            channelId: CHANNEL_ID,
          },
        });
      }
    }
  }
}

/**
 * Cancel all scheduled attendance notifications.
 */
export async function cancelAllAttendanceNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.categoryIdentifier === NOTIFICATION_CATEGORY) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/**
 * Start all background tracking:
 * 1. Foreground service + location updates (keeps process alive + movement trigger)
 * 2. Background fetch (periodic timer for stationary case)
 * 3. Scheduled notifications (precise class-time trigger via DATE)
 */
export async function startAttendanceTracking(): Promise<void> {
  const locationRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (!locationRunning) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 20,
      deferredUpdatesInterval: 3 * 60 * 1000,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: "Attendify",
        notificationBody: "Auto-attendance is active",
        notificationColor: "#4dc591",
      },
    });
  }

  const fetchRegistered = await TaskManager.isTaskRegisteredAsync(FETCH_TASK);
  if (!fetchRegistered) {
    await BackgroundFetch.registerTaskAsync(FETCH_TASK, {
      minimumInterval: 5 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

/**
 * Stop all background tracking.
 */
export async function stopAttendanceTracking(): Promise<void> {
  const locationRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (locationRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }

  const fetchRegistered = await TaskManager.isTaskRegisteredAsync(FETCH_TASK);
  if (fetchRegistered) {
    await BackgroundFetch.unregisterTaskAsync(FETCH_TASK);
  }
}
