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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, Locate, MapPin } from "lucide-react-native";
import MapView, { Marker, Circle, MapPressEvent } from "react-native-maps";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useProfile } from "../context/ProfileContext";
import { ClassLocation } from "../data/types";

const { width } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { updateProfile } = useProfile();
  const scrollRef = useRef<ScrollView>(null);
  const mapRef = useRef<MapView>(null);

  const [step, setStep] = useState(0);

  // Setup page state
  const [name, setName] = useState("");
  const [minAttendance, setMinAttendance] = useState(75);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const [locating, setLocating] = useState(false);

  function goToSetup() {
    setStep(1);
    scrollRef.current?.scrollTo({ x: width, animated: true });
  }

  async function handleUseMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(coord);
      mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 600);
    } finally {
      setLocating(false);
    }
  }

  function handleMapPress(e: MapPressEvent) {
    setPin(e.nativeEvent.coordinate);
  }

  function handleFinish() {
    const finalName = name.trim() || "Student";
    const classLocation: ClassLocation | null = pin
      ? { latitude: pin.latitude, longitude: pin.longitude, radius }
      : null;
    updateProfile({ name: finalName, minAttendance, classLocation });
    onComplete();
  }

  const canFinish = name.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Step dots */}
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

            {/* Map */}
            <View className="bg-white rounded-3xl border border-neutral-200 mb-4" style={{ overflow: "hidden" }}>
              <View className="p-4 pb-0">
                <Text className="text-text text-xs font-medium mb-0.5">Class Location</Text>
                <Text className="text-text-muted text-xs mb-3">Tap the map to drop a pin where your classes are held</Text>
              </View>

              <View style={{ height: 200 }}>
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={{ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 5, longitudeDelta: 5 }}
                  onPress={handleMapPress}
                >
                  {pin && (
                    <>
                      <Marker
                        coordinate={pin}
                        draggable
                        onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
                        pinColor="#4dc591"
                      />
                      <Circle
                        center={pin}
                        radius={radius}
                        fillColor="rgba(77,197,145,0.18)"
                        strokeColor="#4dc591"
                        strokeWidth={1.5}
                      />
                    </>
                  )}
                </MapView>

                <TouchableOpacity
                  onPress={handleUseMyLocation}
                  activeOpacity={0.8}
                  className="absolute top-2 right-2 bg-white rounded-2xl px-3 py-1.5 flex-row items-center"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color="#4dc591" />
                  ) : (
                    <Locate size={13} color="#4dc591" />
                  )}
                  <Text className="text-text text-xs font-semibold ml-1">My location</Text>
                </TouchableOpacity>
              </View>

              {pin && (
                <View className="p-4 pt-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-text text-xs font-medium">Radius</Text>
                    <Text className="text-text text-xs font-bold">{radius} m</Text>
                  </View>
                  <Slider
                    style={{ width: "100%", height: 32 }}
                    minimumValue={10}
                    maximumValue={100}
                    step={5}
                    value={radius}
                    onValueChange={setRadius}
                    minimumTrackTintColor="#4dc591"
                    maximumTrackTintColor="#e5e7eb"
                    thumbTintColor="#4dc591"
                  />
                </View>
              )}

              {!pin && (
                <View className="flex-row items-center p-4 pt-3">
                  <MapPin size={13} color="#bcc1cd" />
                  <Text className="text-text-muted text-xs ml-1.5">No pin dropped — you can set this later in Settings</Text>
                </View>
              )}
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
