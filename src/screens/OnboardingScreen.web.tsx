import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, MapPin } from "lucide-react-native";
import { useProfile } from "../context/ProfileContext";

const { width } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { updateProfile } = useProfile();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [minAttendance, setMinAttendance] = useState(75);

  function goToSetup() {
    setStep(1);
    scrollRef.current?.scrollTo({ x: width, animated: true });
  }

  function handleFinish() {
    updateProfile({ name: name.trim() || "Student", minAttendance });
    onComplete();
  }

  const canFinish = name.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <View className="flex-row justify-center gap-1.5 pt-4 pb-2">
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === step ? "#4dc591" : "#e2e8f0",
            }}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      >
        {/* Page 1 — Welcome */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <View className="w-28 h-28 rounded-full bg-[#4dc591]/15 items-center justify-center mb-8">
            <Text style={{ fontSize: 56 }}>📚</Text>
          </View>
          <Text className="text-text text-3xl font-bold text-center mb-4">
            Stay above{"\n"}the bar
          </Text>
          <Text className="text-text-muted text-sm text-center leading-relaxed">
            Attendify tracks your attendance across all subjects and warns you before you fall below your requirement.
          </Text>
        </View>

        {/* Page 2 — Setup */}
        <KeyboardAvoidingView
          style={{ width }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="text-text text-2xl font-bold mb-1">Let's set you up</Text>
            <Text className="text-text-muted text-sm mb-6">Fill in a few details to get started.</Text>

            {/* Name */}
            <View className="bg-white rounded-3xl border border-neutral-200 p-4 mb-4">
              <Text className="text-text text-xs font-medium mb-1">Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Siddhant"
                placeholderTextColor="#bcc1cd"
                returnKeyType="done"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
            </View>

            {/* Min attendance */}
            <View className="bg-white rounded-3xl border border-neutral-200 p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-text text-xs font-medium mb-0.5">Min. Attendance</Text>
                  <Text className="text-text-muted text-xs">Warn when a subject drops below this</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => minAttendance > 50 && setMinAttendance(minAttendance - 5)}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl bg-surface border border-neutral-200 items-center justify-center"
                  >
                    <Minus size={13} color="#5f8a85" />
                  </TouchableOpacity>
                  <Text className="text-text text-sm font-bold w-10 text-center">
                    {minAttendance}%
                  </Text>
                  <TouchableOpacity
                    onPress={() => minAttendance < 100 && setMinAttendance(minAttendance + 5)}
                    activeOpacity={0.7}
                    className="w-8 h-8 rounded-xl bg-surface border border-neutral-200 items-center justify-center"
                  >
                    <Plus size={13} color="#5f8a85" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Map placeholder */}
            <View className="bg-white rounded-3xl border border-neutral-200 p-4">
              <Text className="text-text text-xs font-medium mb-0.5">Class Location</Text>
              <Text className="text-text-muted text-xs mb-3">Set your class location on the mobile app</Text>
              <View className="h-28 bg-surface rounded-2xl items-center justify-center">
                <MapPin size={24} color="#bcc1cd" />
                <Text className="text-text-muted text-xs mt-2">Map available on iOS & Android</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Bottom button */}
      <View className="px-6 pb-8 pt-2 absolute bottom-0 left-0 right-0">
        {step === 0 ? (
          <TouchableOpacity
            onPress={goToSetup}
            activeOpacity={0.8}
            className="rounded-3xl py-4 items-center"
            style={{ backgroundColor: "#4dc591", shadowColor: "#4dc591", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
          >
            <Text className="text-white text-base font-bold">Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={canFinish ? 0.8 : 1}
            className="rounded-3xl py-4 items-center"
            style={{ backgroundColor: canFinish ? "#4dc591" : "#d1d5db", shadowColor: canFinish ? "#4dc591" : "transparent", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: canFinish ? 8 : 0 }}
          >
            <Text className="text-white text-base font-bold">Start Tracking 🎯</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
