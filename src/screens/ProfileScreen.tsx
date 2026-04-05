import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, ChevronRight, Minus, Plus, BookOpen, Upload, Download, Trash2, RefreshCw } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { useProfile } from "../context/ProfileContext";
import { useSubjects } from "../context/SubjectsContext";
import { useSchedule } from "../context/ScheduleContext";
import { useAppReset } from "../context/AppResetContext";
import LocationSetupScreen from "./LocationSetupScreen";
import { ClassLocation } from "../data/types";

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const { subjects, importSubjects, clearSubjects } = useSubjects();
  const { weekdaySchedules, setSchedule } = useSchedule();
  const { resetApp } = useAppReset();
  const [name, setName] = useState(profile.name);
  const [showLocationSetup, setShowLocationSetup] = useState(false);

  async function handleExport() {
    try {
      const data = { version: "1", subjects, schedule: weekdaySchedules };
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: "Attendify Timetable" });
    } catch (e) {
      Alert.alert("Export failed", "Could not export timetable.");
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const response = await fetch(result.assets[0].uri);
      const raw = await response.text();
      const data = JSON.parse(raw);
      if (!data.version || !data.subjects || !data.schedule) {
        Alert.alert("Invalid file", "This file doesn't look like an Attendify timetable.");
        return;
      }
      setSchedule(data.schedule);
      importSubjects(data.subjects);
      Alert.alert("Imported", "Timetable imported successfully.");
    } catch (e) {
      Alert.alert("Import failed", "Could not read the selected file.");
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
            onPress={handleImport}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#4dc591]/15 items-center justify-center mr-3">
                <Download size={16} color="#4dc591" />
              </View>
              <View>
                <Text className="text-text text-sm font-semibold">Import Timetable</Text>
                <Text className="text-text-muted text-xs mt-0.5">Load from a file</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#bcc1cd" />
          </TouchableOpacity>

          <View className="h-px bg-neutral-100 mx-4" />

          <TouchableOpacity
            onPress={handleExport}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#ff7648]/10 items-center justify-center mr-3">
                <Upload size={16} color="#ff7648" />
              </View>
              <View>
                <Text className="text-text text-sm font-semibold">Export Timetable</Text>
                <Text className="text-text-muted text-xs mt-0.5">Save as a file</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#bcc1cd" />
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
    </SafeAreaView>
  );
}
