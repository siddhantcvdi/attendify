import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";

/**
 * Request all permissions needed for auto-attendance:
 * 1. Foreground location
 * 2. Background location ("Allow all the time")
 * 3. Notifications
 *
 * Returns true only if ALL are granted.
 */
export async function requestAutoAttendancePermissions(): Promise<boolean> {
  // 1. Foreground location
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== "granted") {
    Alert.alert("Location Required", "Foreground location access is needed for auto-attendance.");
    return false;
  }

  // 2. Background location
  const { status: bg } = await Location.getBackgroundPermissionsAsync();
  if (bg !== "granted") {
    const { status: bgReq } = await Location.requestBackgroundPermissionsAsync();
    if (bgReq !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Background Location Needed",
          'To auto-mark attendance when the app is closed, go to Settings \u2192 Location \u2192 select "Allow all the time".',
          [
            { text: "Not Now", style: "cancel", onPress: () => resolve() },
            {
              text: "Open Settings",
              onPress: async () => {
                await Linking.openSettings();
                resolve();
              },
            },
          ]
        );
      });
      const { status: bgAfter } = await Location.getBackgroundPermissionsAsync();
      if (bgAfter !== "granted") return false;
    }
  }

  // 3. Notifications
  const { status: notif } = await Notifications.requestPermissionsAsync();
  if (notif !== "granted") {
    Alert.alert("Notifications Required", "Notification permission is needed to trigger background attendance checks.");
    return false;
  }

  // 4. Exact alarms (Android 12+) — needed for on-time attendance notifications
  if (Platform.OS === "android") {
    const perms = await Notifications.getPermissionsAsync();
    if (perms.android?.canScheduleExactNotifications === false) {
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Exact Alarms Needed",
          'For precise attendance timing, enable "Alarms & reminders" for Attendify in Settings → Special app access.',
          [
            { text: "Not Now", style: "cancel", onPress: () => resolve() },
            { text: "Open Settings", onPress: async () => { await Linking.openSettings(); resolve(); } },
          ]
        );
      });
    }
  }

  return true;
}
