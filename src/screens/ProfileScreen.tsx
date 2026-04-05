import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, ChevronRight, Minus, Plus, BookOpen, Upload, Download } from "lucide-react-native";
import { useProfile } from "../context/ProfileContext";
import LocationSetupScreen from "./LocationSetupScreen";
import { ClassLocation } from "../data/types";

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const [name, setName] = useState(profile.name);
  const [showLocationSetup, setShowLocationSetup] = useState(false);

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
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={handleNameBlur}
            returnKeyType="done"
            className="text-text text-2xl font-bold"
            style={{ fontFamily: "Poppins_700Bold" }}
          />
        </View>

        {/* Attendance section */}
        <Text className="text-text text-lg font-bold px-5 mb-3">
          Preferences
        </Text>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 mb-5 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-4">
              <View className="w-9 h-9 rounded-xl bg-[#ff7648]/10 items-center justify-center mr-3">
                <BookOpen size={16} color="#ff7648" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">
                  Min. Attendance
                </Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  Warn when a subject drops below this
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={decrementAttendance}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-xl bg-surface border border-neutral-200 items-center justify-center"
              >
                <Minus size={13} color="#5f8a85" />
              </TouchableOpacity>
              <Text className="text-text text-sm font-bold w-10 text-center">
                {profile.minAttendance}%
              </Text>
              <TouchableOpacity
                onPress={incrementAttendance}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-xl bg-surface border border-neutral-200 items-center justify-center"
              >
                <Plus size={13} color="#5f8a85" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Timetable section */}
        <Text className="text-text text-lg font-bold px-5 mb-3">
          Timetable
        </Text>
        <View className="bg-white rounded-3xl border border-neutral-200 mx-4 mb-5" style={{ overflow: "hidden" }}>
          <TouchableOpacity
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

        {/* Class location section */}
        <Text className="text-text text-lg font-bold px-5 mb-3">
          Class Location
        </Text>
        <TouchableOpacity
          onPress={() => setShowLocationSetup(true)}
          activeOpacity={0.7}
          className="bg-white rounded-3xl border border-neutral-200 mx-4 p-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{
                  backgroundColor: loc ? "rgba(77,197,145,0.12)" : undefined,
                }}
                {...(!loc && { className: "w-9 h-9 rounded-xl bg-surface items-center justify-center mr-3" })}
              >
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
          </View>
        </TouchableOpacity>
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
