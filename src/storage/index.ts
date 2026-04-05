import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PROFILE: "@attendify:profile",
  SUBJECTS: "@attendify:subjects",
  ATTENDANCE: "@attendify:attendance",
  EXTRA_CLASSES: "@attendify:extra_classes",
} as const;

async function get<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const Storage = { KEYS, get, set };
