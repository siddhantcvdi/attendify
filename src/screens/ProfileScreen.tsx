import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, ChevronRight, Minus, Plus, BookOpen, Upload, Download, Trash2, RefreshCw, Pencil, LocateFixed } from "lucide-react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirestoreError } from "firebase/firestore";
import { useProfile } from "../context/ProfileContext";
import { useSubjects } from "../context/SubjectsContext";
import { useSchedule } from "../context/ScheduleContext";
import { useAppReset } from "../context/AppResetContext";
import LocationSetupScreen from "./LocationSetupScreen";
import { NamedLocation, Lecture, Subject } from "../data/types";
import { ensureFirestoreConfigured } from "../services/firebase";
import { Storage } from "../storage";
import { requestAutoAttendancePermissions } from "../utils/autoAttendancePermissions";

type ScheduleTemplate = Omit<Lecture, "id" | "status">;
type WeekdaySchedules = Record<number, ScheduleTemplate[]>;

interface TimetablePayload {
  version: "1";
  subjects: Subject[];
  schedule: WeekdaySchedules;
  locations?: NamedLocation[];
}

const TIMETABLE_EXPORT_CODE_KEY = "@attendify:timetable_export_code";

function getFirestoreErrorMessage(error: unknown): string {
  const fallback = "Something went wrong. Please try again.";
  if (!error || typeof error !== "object") return fallback;

  const firestoreError = error as Partial<FirestoreError>;
  switch (firestoreError.code) {
    case "permission-denied":
      return "Access denied. Please try again later.";
    case "failed-precondition":
      return "Service not ready. Please try again later.";
    case "unavailable":
      return "Service unavailable. Check your internet and retry.";
    case "unauthenticated":
      return "Authentication required. Please try again.";
    default:
      return fallback;
  }
}

function normalizeSchedule(input: unknown): WeekdaySchedules | null {
  if (!input || typeof input !== "object") return null;

  const output: WeekdaySchedules = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const day = Number(key);
    if (!Number.isInteger(day) || day < 0 || day > 6 || !Array.isArray(value)) {
      return null;
    }
    output[day] = value as ScheduleTemplate[];
  }

  return output;
}

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const { subjects, importSubjects, clearSubjects } = useSubjects();
  const { weekdaySchedules, setSchedule } = useSchedule();
  const { resetApp } = useAppReset();
  const [name, setName] = useState(profile.name);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [editingLocation, setEditingLocation] = useState<NamedLocation | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [togglingAuto, setTogglingAuto] = useState(false);

  async function getOrCreateExportCode(): Promise<string> {
    const existing = await Storage.get<string>(TIMETABLE_EXPORT_CODE_KEY);
    if (existing && existing.trim().length > 0) return existing;

    const code = `attendify_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await Storage.set(TIMETABLE_EXPORT_CODE_KEY, code);
    return code;
  }

  async function handleExport() {
    if (isExporting) return;

    try {
      setIsExporting(true);
      const db = ensureFirestoreConfigured();

      const payload: TimetablePayload = {
        version: "1",
        subjects: subjects.map((s) => ({ ...s, attendedClasses: 0, totalClasses: 0 })),
        schedule: weekdaySchedules,
        locations: profile.locations ?? [],
      };

      const code = await getOrCreateExportCode();
      await setDoc(doc(db, "timetable_exports", code), {
        ...payload,
        updatedAt: serverTimestamp(),
      });

      await Share.share({
        message: `Here's my Attendify timetable code:\n\n${code}\n\nOpen Attendify → Settings → Import Timetable and paste this code.`,
        title: "Attendify Timetable",
      });
    } catch (e) {
      Alert.alert("Export failed", getFirestoreErrorMessage(e));
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFromFirestore() {
    if (isImporting) return;

    const code = importCode.trim();
    if (!code) {
      Alert.alert("Code required", "Enter an export code to import your timetable.");
      return;
    }

    try {
      setIsImporting(true);
      const db = ensureFirestoreConfigured();
      const snap = await getDoc(doc(db, "timetable_exports", code));

      if (!snap.exists()) {
        Alert.alert("Code not found", "No export exists for this code.");
        return;
      }

      const raw = snap.data() as Partial<TimetablePayload>;
      const schedule = normalizeSchedule(raw.schedule);
      if (raw.version !== "1" || !Array.isArray(raw.subjects) || !schedule) {
        Alert.alert("Invalid code", "This code doesn't contain a valid Attendify timetable.");
        return;
      }

      setSchedule(schedule);
      // Always zero out attendance on import — only the timetable structure is shared
      const cleanSubjects = (raw.subjects as Subject[]).map((s) => ({
        ...s,
        attendedClasses: 0,
        totalClasses: 0,
      }));
      importSubjects(cleanSubjects);
      if (Array.isArray(raw.locations) && raw.locations.length > 0) {
        updateProfile({ locations: raw.locations as NamedLocation[] });
      }
      setImportCode("");
      setShowImportModal(false);
      Alert.alert("Imported", "Timetable imported successfully.");
    } catch (e) {
      Alert.alert("Import failed", getFirestoreErrorMessage(e));
    } finally {
      setIsImporting(false);
    }
  }

  useEffect(() => {
    setName(profile.name);
  }, [profile.name]);

  function handleNameBlur() {
    if (name.trim()) updateProfile({ name: name.trim() });
    else setName(profile.name);
  }

  async function handleToggleAutoAttendance() {
    if (profile.autoAttendance) {
      updateProfile({ autoAttendance: false });
      return;
    }
    if (!profile.locations || profile.locations.length === 0) {
      Alert.alert(
        "Location Required",
        "Add a class location first before enabling auto attendance.",
      );
      return;
    }
    setTogglingAuto(true);
    const granted = await requestAutoAttendancePermissions();
    setTogglingAuto(false);
    if (granted) updateProfile({ autoAttendance: true });
  }

  function incrementAttendance() {
    if (profile.minAttendance < 100)
      updateProfile({ minAttendance: profile.minAttendance + 5 });
  }

  function decrementAttendance() {
    if (profile.minAttendance > 50)
      updateProfile({ minAttendance: profile.minAttendance - 5 });
  }

  function handleSaveLocation(loc: NamedLocation) {
    const existing = profile.locations ?? [];
    const idx = existing.findIndex((l) => l.id === loc.id);
    const next = idx >= 0
      ? existing.map((l) => (l.id === loc.id ? loc : l))
      : [...existing, loc];
    updateProfile({ locations: next });
    setEditingLocation(null);
  }

  function handleDeleteLocation(id: string) {
    Alert.alert("Remove Location", "Remove this location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => updateProfile({ locations: (profile.locations ?? []).filter((l) => l.id !== id) }),
      },
    ]);
  }

  function handleClearTimetable() {
    Alert.alert(
      "Clear Timetable",
      "This will remove your schedule and all subjects. Attendance records will be kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setSchedule({});
            clearSubjects();
          },
        },
      ]
    );
  }

  function handleResetApp() {
    Alert.alert(
      "Reset App Data",
      "This will clear everything — subjects, schedule, attendance records, and reset your profile to defaults. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetApp(),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page heading */}
        <View className="px-5 pt-4 pb-5">
          <Text className="text-text-muted text-sm font-medium">Account</Text>
          <Text className="text-text text-3xl font-bold mt-0.5">Settings</Text>
        </View>

        {/* Name card */}
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 mb-6 px-4 py-4">
          <Text className="text-text text-sm font-medium mb-2">Name</Text>
          <View className="border border-neutral-200 rounded-2xl px-3">
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={handleNameBlur}
              returnKeyType="done"
              className="text-text text-sm"
              style={{ fontFamily: "Poppins_400Regular" }}
            />
          </View>
        </View>

        {/* Preferences */}
        <Text className="text-text text-lg font-bold px-5 mb-3">Preferences</Text>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 mb-6 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-4">
              <View className="w-9 h-9 rounded-xl bg-[#ff7648]/10 items-center justify-center mr-3">
                <BookOpen size={16} color="#ff7648" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">Min. Attendance</Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  Warn when a subject drops below this
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={decrementAttendance}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-surface border border-neutral-200 items-center justify-center"
              >
                <Minus size={13} color="#5f8a85" />
              </TouchableOpacity>
              <Text className="text-text text-sm font-bold w-10 text-center">
                {profile.minAttendance}%
              </Text>
              <TouchableOpacity
                onPress={incrementAttendance}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-surface border border-neutral-200 items-center justify-center"
              >
                <Plus size={13} color="#5f8a85" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-px bg-neutral-100 mx-1 my-3" />

          {/* Auto Attendance toggle */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-4">
              <View className="w-9 h-9 rounded-xl bg-[#4dc591]/15 items-center justify-center mr-3">
                <LocateFixed size={16} color="#4dc591" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">Auto Attendance</Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  Mark attendance based on location at class time
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleToggleAutoAttendance}
              disabled={togglingAuto}
              activeOpacity={0.7}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: profile.autoAttendance ? "#4dc591" : "#e2e8f0",
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              {togglingAuto ? (
                <ActivityIndicator size="small" color={profile.autoAttendance ? "#fff" : "#94a9a6"} />
              ) : (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    alignSelf: profile.autoAttendance ? "flex-end" : "flex-start",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Timetable */}
        <Text className="text-text text-lg font-bold px-5 mb-3">Timetable</Text>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 mb-6 overflow-hidden">
          <TouchableOpacity
            onPress={() => setShowImportModal(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#4dc591]/15 items-center justify-center mr-3">
                <Download size={16} color="#4dc591" />
              </View>
              <View>
                <Text className="text-text text-sm font-semibold">Import Timetable</Text>
                <Text className="text-text-muted text-xs mt-0.5">Load using Attendify code</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#bcc1cd" />
          </TouchableOpacity>

          <View className="h-px bg-neutral-100 mx-4" />

          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#ff7648]/10 items-center justify-center mr-3">
                <Upload size={16} color="#ff7648" />
              </View>
              <View>
                <Text className="text-text text-sm font-semibold">Share Timetable</Text>
                <Text className="text-text-muted text-xs mt-0.5">Upload timetable and share code</Text>
              </View>
            </View>
            {isExporting ? <ActivityIndicator size="small" color="#ff7648" /> : <ChevronRight size={16} color="#bcc1cd" />}
          </TouchableOpacity>
        </View>

        {/* Class Locations */}
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-text text-lg font-bold">Class Locations</Text>
          <TouchableOpacity
            onPress={() => { setEditingLocation(null); setShowLocationSetup(true); }}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-xl bg-[#4dc591]/20 items-center justify-center"
          >
            <Plus size={16} color="#4dc591" />
          </TouchableOpacity>
        </View>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 overflow-hidden">
          {(profile.locations ?? []).length === 0 ? (
            <TouchableOpacity
              onPress={() => { setEditingLocation(null); setShowLocationSetup(true); }}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-9 h-9 rounded-xl bg-surface items-center justify-center mr-3">
                  <MapPin size={16} color="#5f8a85" />
                </View>
                <View className="flex-1">
                  <Text className="text-text text-sm font-semibold">Add a location</Text>
                  <Text className="text-text-muted text-xs mt-0.5">Where your classes are held</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#bcc1cd" />
            </TouchableOpacity>
          ) : (
            (profile.locations ?? []).map((loc, idx) => (
              <React.Fragment key={loc.id}>
                {idx > 0 && <View className="h-px bg-neutral-100 mx-4" />}
                <View className="flex-row items-center justify-between px-4 py-3">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-9 h-9 rounded-xl bg-surface items-center justify-center mr-3">
                      <MapPin size={16} color={idx === 0 ? "#4dc591" : "#5f8a85"} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-text text-sm font-semibold">{loc.name}</Text>
                        {idx === 0 && (
                          <View className="bg-[#4dc591]/15 rounded-lg px-1.5 py-0.5">
                            <Text className="text-[#4dc591] text-xs font-semibold">Default</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-text-muted text-xs mt-0.5">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {loc.radius} m
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => { setEditingLocation(loc); setShowLocationSetup(true); }}
                      activeOpacity={0.7}
                      className="w-8 h-8 rounded-full bg-surface items-center justify-center"
                    >
                      <Pencil size={13} color="#5f8a85" />
                    </TouchableOpacity>
                    {idx > 0 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteLocation(loc.id)}
                        activeOpacity={0.7}
                        className="w-8 h-8 rounded-full bg-[#ff7648]/10 items-center justify-center"
                      >
                        <Trash2 size={13} color="#ff7648" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>

        {/* Reset */}
        <Text className="text-text text-lg font-bold px-5 mt-6 mb-3">Reset</Text>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 mb-6 overflow-hidden">
          <TouchableOpacity
            onPress={handleClearTimetable}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#ff7648]/10 items-center justify-center mr-3">
                <Trash2 size={16} color="#ff7648" />
              </View>
              <View>
                <Text className="text-text text-sm font-semibold">Clear Timetable</Text>
                <Text className="text-text-muted text-xs mt-0.5">Remove schedule and subjects</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#bcc1cd" />
          </TouchableOpacity>

          <View className="h-px bg-neutral-100 mx-4" />

          <TouchableOpacity
            onPress={handleResetApp}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center mr-3">
                <RefreshCw size={16} color="#ef4444" />
              </View>
              <View>
                <Text style={{ color: "#ef4444" }} className="text-sm font-semibold">Reset App Data</Text>
                <Text className="text-text-muted text-xs mt-0.5">Clear everything and start fresh</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#bcc1cd" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LocationSetupScreen
        visible={showLocationSetup}
        onClose={() => { setShowLocationSetup(false); setEditingLocation(null); }}
        onSave={handleSaveLocation}
        initialLocation={editingLocation}
      />

      <Modal
        visible={showImportModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImportModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-3xl px-5 pt-5 pb-6">
            <Text className="text-text text-lg font-bold">Import Timetable</Text>
            <Text className="text-text-muted text-sm mt-1 mb-4">
              Enter the code shared by your friend.
            </Text>

            <View className="border border-neutral-200 rounded-2xl px-3 py-1">
              <TextInput
                value={importCode}
                onChangeText={setImportCode}
                editable={!isImporting}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="e.g. 4aZp9JvQk2Xn"
                className="text-text text-sm"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            <View className="flex-row mt-4 gap-3">
              <TouchableOpacity
                onPress={() => {
                  if (isImporting) return;
                  setShowImportModal(false);
                }}
                activeOpacity={0.7}
                className="flex-1 h-11 rounded-2xl border border-neutral-200 items-center justify-center"
              >
                <Text className="text-text-muted text-sm font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImportFromFirestore}
                disabled={isImporting}
                activeOpacity={0.7}
                className="flex-1 h-11 rounded-2xl bg-[#4dc591] items-center justify-center"
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white text-sm font-semibold">Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
