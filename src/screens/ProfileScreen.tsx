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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, ChevronRight, Minus, Plus, BookOpen, Upload, Download, Trash2, RefreshCw } from "lucide-react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirestoreError } from "firebase/firestore";
import { useProfile } from "../context/ProfileContext";
import { useSubjects } from "../context/SubjectsContext";
import { useSchedule } from "../context/ScheduleContext";
import { useAppReset } from "../context/AppResetContext";
import LocationSetupScreen from "./LocationSetupScreen";
import { ClassLocation, Lecture, Subject } from "../data/types";
import { ensureFirestoreConfigured } from "../services/firebase";
import { Storage } from "../storage";

type ScheduleTemplate = Omit<Lecture, "id" | "status">;
type WeekdaySchedules = Record<number, ScheduleTemplate[]>;

interface TimetablePayload {
  version: "1";
  subjects: Subject[];
  schedule: WeekdaySchedules;
}

const TIMETABLE_EXPORT_CODE_KEY = "@lectur:timetable_export_code";

function getFirestoreErrorMessage(error: unknown): string {
  const fallback = "Unexpected error while contacting Firestore.";
  if (!error || typeof error !== "object") return fallback;

  const firestoreError = error as Partial<FirestoreError>;
  switch (firestoreError.code) {
    case "permission-denied":
      return "Firestore denied access. Update rules to allow reads/writes for timetable_exports.";
    case "failed-precondition":
      return "Firestore is not fully enabled for this project yet. Open Firebase Console and create the Firestore database.";
    case "unavailable":
      return "Firestore is currently unavailable. Check internet and retry.";
    case "unauthenticated":
      return "This operation requires authentication in your current Firestore rules.";
    default:
      return typeof firestoreError.message === "string" && firestoreError.message.length > 0
        ? firestoreError.message
        : fallback;
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function getOrCreateExportCode(): Promise<string> {
    const existing = await Storage.get<string>(TIMETABLE_EXPORT_CODE_KEY);
    if (existing && existing.trim().length > 0) return existing;

    const code = `lectur_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
        subjects,
        schedule: weekdaySchedules,
      };

      const code = await getOrCreateExportCode();
      await setDoc(doc(db, "timetable_exports", code), {
        ...payload,
        updatedAt: serverTimestamp(),
      });

      await Share.share({
        message: `Attendify timetable code: ${code}`,
        title: "Attendify Timetable",
      });
      Alert.alert("Exported", `Share this code to import on another device:\n\n${code}`);
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
        Alert.alert("Invalid data", "The Firestore entry is not a valid Attendify timetable.");
        return;
      }

      setSchedule(schedule);
      importSubjects(raw.subjects as Subject[]);
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

  function incrementAttendance() {
    if (profile.minAttendance < 100)
      updateProfile({ minAttendance: profile.minAttendance + 5 });
  }

  function decrementAttendance() {
    if (profile.minAttendance > 50)
      updateProfile({ minAttendance: profile.minAttendance - 5 });
  }

  function handleSaveLocation(loc: ClassLocation) {
    updateProfile({ classLocation: loc });
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

  const loc = profile.classLocation;

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
                <Text className="text-text-muted text-xs mt-0.5">Load using Lectur code</Text>
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

        {/* Class Location */}
        <Text className="text-text text-lg font-bold px-5 mb-3">Class Location</Text>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 overflow-hidden">
          <TouchableOpacity
            onPress={() => setShowLocationSetup(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-9 h-9 rounded-xl bg-surface items-center justify-center mr-3">
                <MapPin size={16} color={loc ? "#4dc591" : "#5f8a85"} />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">
                  {loc ? "Location set" : "Set location"}
                </Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  {loc
                    ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} · ${loc.radius} m`
                    : "Where your classes are held"}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#bcc1cd" />
          </TouchableOpacity>
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
        onClose={() => setShowLocationSetup(false)}
        onSave={handleSaveLocation}
        initialLocation={profile.classLocation}
      />

      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowImportModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
        >
          <View className="flex-1 bg-black/40" />
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
            <Text className="text-text text-lg font-bold">Import from Firestore</Text>
            <Text className="text-text-muted text-sm mt-1 mb-4">
              Enter the code generated during export.
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
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
