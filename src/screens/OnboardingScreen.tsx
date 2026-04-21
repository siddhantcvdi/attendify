import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Animated,
  Alert,
  Modal,
} from "react-native";
import GlobeIllustration from "../../assets/image.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, Locate, MapPin } from "lucide-react-native";
import { WebView } from "react-native-webview";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useProfile } from "../context/ProfileContext";
import { buildLeafletHTML } from "../utils/leafletMap";
import { requestAutoAttendancePermissions } from "../utils/autoAttendancePermissions";

const { width } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { updateProfile } = useProfile();
  const scrollRef = useRef<ScrollView>(null);
  const webRef = useRef<WebView>(null);
  const webLoaded = useRef(false);
  const pendingFlyTo = useRef<{ lat: number; lng: number } | null>(null);

  const [step, setStep] = useState(0);

  // Entrance animations
  const bannerY = useRef(new Animated.Value(-40)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const globeScale = useRef(new Animated.Value(1)).current;
  const textY = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Banner slides down
      Animated.parallel([
        Animated.timing(bannerY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(bannerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Text fades up slightly after banner
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Button comes up last
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(buttonY, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Setup page state
  const [name, setName] = useState("");
  const [minAttendance, setMinAttendance] = useState(75);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const [locating, setLocating] = useState(false);
  const [autoAttendance, setAutoAttendance] = useState(false);
  const [togglingAuto, setTogglingAuto] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Build HTML once — never rebuild to avoid WebView reload on pin/radius change
  const mapHtml = useMemo(() => buildLeafletHTML(20.5937, 78.9629, null, null, 50), []);

  function goToSetup() {
    setStep(1);
    scrollRef.current?.scrollTo({ x: width, animated: true });
  }

  async function handleUseMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const last = await Location.getLastKnownPositionAsync();
      const loc = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(coord);
      if (webLoaded.current) {
        webRef.current?.injectJavaScript(`flyTo(${coord.latitude}, ${coord.longitude}); true;`);
      } else {
        pendingFlyTo.current = { lat: coord.latitude, lng: coord.longitude };
      }
    } finally {
      setLocating(false);
    }
  }

  function handleWebLoad() {
    webLoaded.current = true;
    if (pendingFlyTo.current) {
      const { lat, lng } = pendingFlyTo.current;
      webRef.current?.injectJavaScript(`flyTo(${lat}, ${lng}); true;`);
      pendingFlyTo.current = null;
    }
  }

  function handleWebMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "pin") setPin({ latitude: data.lat, longitude: data.lng });
    } catch {}
  }

  async function handleToggleAutoAttendance() {
    if (autoAttendance) {
      setAutoAttendance(false);
      setShowLocationModal(false);
      webLoaded.current = false;
      pendingFlyTo.current = null;
      return;
    }

    const shouldContinue = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Permissions needed",
        "Auto Attendance checks your location at class time to mark you present or absent.\n\n• When asked for location access, tap \"Allow all the time\" — this lets it work even when the app is closed.\n• Notifications are used to trigger the check at the right moment.",
        [
          { text: "Not Now", style: "cancel", onPress: () => resolve(false) },
          { text: "Continue", onPress: () => resolve(true) },
        ]
      );
    });

    if (!shouldContinue) return;

    setTogglingAuto(true);
    const granted = await requestAutoAttendancePermissions();
    setTogglingAuto(false);
    if (granted) {
      setAutoAttendance(true);
      setShowLocationModal(true);
      handleUseMyLocation();
    }
  }

  function handleCloseLocationModal() {
    webLoaded.current = false;
    pendingFlyTo.current = null;
    setShowLocationModal(false);
  }

  function handleFinish() {
    const finalName = name.trim() || "Student";
    const locations = pin
      ? [{ id: `loc-${Date.now()}`, name: "Main Campus", latitude: pin.latitude, longitude: pin.longitude, radius }]
      : [];
    updateProfile({ name: finalName, minAttendance, locations, autoAttendance });
    onComplete();
  }

  const needsLocation = autoAttendance && !pin;
  const canFinish = name.trim().length > 0 && !needsLocation;

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
        <View style={{ width }} className="flex-1">
          {/* Green banner */}
          <Animated.View
            style={{ backgroundColor: "#05795a", height: 400, borderBottomLeftRadius: 0, zIndex: 1, opacity: bannerOpacity, transform: [{ translateY: bannerY }] }}
            className="items-center justify-end"
          >
            {/* Decorative circles clipped inside their own container */}
            <View style={{ position: "absolute", inset: 0, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: "hidden" }}>
              <View style={{ position: "absolute", top: 30, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)" }} />
              <View style={{ position: "absolute", top: 80, right: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.05)" }} />
              <View style={{ position: "absolute", bottom: 80, left: 24, width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.06)" }} />
              <View style={{ position: "absolute", top: 50, right: 60, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)" }} />
            </View>

            {/* App name badge */}
            <View style={{ position: "absolute", top: 28, left: 0, right: 0, alignItems: "center" }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5 }}>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700", letterSpacing: 1.5 }}>ATTENDIFY</Text>
              </View>
            </View>

            {/* Globe pinned to right, bleeds below the banner */}
            <Animated.View style={{ position: "absolute", right: 0, bottom: -20, zIndex: 2, transform: [{ scale: globeScale }] }}>
              <GlobeIllustration width={280} height={260} />
            </Animated.View>
          </Animated.View>

          {/* Text content */}
          <Animated.View className="flex-1 items-center justify-center px-8" style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
            <Text className="text-text text-5xl font-bold text-center mb-4 -mt-8">
              Stay above{"\n"}the bar.
            </Text>
            <Text className="text-gray-500 text-base text-center leading-relaxed">
              Track attendance across every subject and get warned before you slip below your minimum.
            </Text>
          </Animated.View>
        </View>

        {/* Page 2 — Setup */}
        <KeyboardAvoidingView
          style={{ width, flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ flex: 1 }}>
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
                  placeholder="e.g. Alex Johnson"
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

              {/* Auto Attendance toggle */}
              <View className="bg-white rounded-3xl border border-neutral-200 p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-text text-xs font-medium mb-0.5">Auto Attendance</Text>
                    <Text className="text-text-muted text-xs">
                      Automatically mark attendance based on your location at class time
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleToggleAutoAttendance}
                    disabled={togglingAuto}
                    activeOpacity={0.7}
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: autoAttendance ? "#4dc591" : "#e2e8f0",
                      justifyContent: "center",
                      paddingHorizontal: 2,
                    }}
                  >
                    {togglingAuto ? (
                      <ActivityIndicator size="small" color={autoAttendance ? "#fff" : "#94a9a6"} />
                    ) : (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "#fff",
                          alignSelf: autoAttendance ? "flex-end" : "flex-start",
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

                {autoAttendance && (
                  <TouchableOpacity
                    onPress={() => { setShowLocationModal(true); handleUseMyLocation(); }}
                    activeOpacity={0.7}
                    className="flex-row items-center mt-3 pt-3 border-t border-neutral-100"
                  >
                    <MapPin size={12} color={pin ? "#4dc591" : "#f59e0b"} />
                    <Text className="text-xs ml-1.5 flex-1" style={{ color: pin ? "#4dc591" : "#f59e0b" }}>
                      {pin ? "Location set — tap to change" : "Tap to set your class location"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Location modal */}
      <Modal visible={showLocationModal} animationType="slide" onRequestClose={handleCloseLocationModal}>
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
            <Text className="text-text text-lg font-bold">Class Location</Text>
            <TouchableOpacity
              onPress={handleCloseLocationModal}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text style={{ fontSize: 16, color: "#5f8a85" }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <WebView
              ref={webRef}
              style={{ flex: 1 }}
              source={{ html: mapHtml }}
              onMessage={handleWebMessage}
              onLoad={handleWebLoad}
              javaScriptEnabled
              originWhitelist={["*"]}
              scrollEnabled={false}
            />

            <TouchableOpacity
              onPress={handleUseMyLocation}
              activeOpacity={0.8}
              className="absolute top-3 right-3 bg-white rounded-2xl px-3 py-2 flex-row items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 }}
            >
              {locating ? (
                <ActivityIndicator size="small" color="#4dc591" />
              ) : (
                <Locate size={14} color="#4dc591" />
              )}
              <Text className="text-text text-xs font-semibold ml-1.5">My location</Text>
            </TouchableOpacity>

            {!pin && (
              <View style={{ pointerEvents: "none", position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center" }}>
                <View className="bg-black/50 rounded-2xl px-4 py-2">
                  <Text className="text-white text-xs font-medium">Tap on the map to drop a pin</Text>
                </View>
              </View>
            )}
          </View>

          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-4">
            {pin && (
              <>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-text text-sm font-medium">Radius</Text>
                  <Text className="text-text text-base font-bold">{radius} <Text className="text-text-muted text-sm font-normal">m</Text></Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 36, marginBottom: 12 }}
                  minimumValue={10}
                  maximumValue={100}
                  step={5}
                  value={radius}
                  onValueChange={(r) => { setRadius(r); webRef.current?.injectJavaScript(`updateRadius(${r}); true;`); }}
                  minimumTrackTintColor="#4dc591"
                  maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#4dc591"
                />
              </>
            )}
            <TouchableOpacity
              onPress={handleCloseLocationModal}
              activeOpacity={0.8}
              className="rounded-3xl py-4 items-center"
              style={{ backgroundColor: "#4dc591", shadowColor: "#4dc591", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
            >
              <Text className="text-white text-base font-bold">{pin ? "Confirm Location" : "Skip for now"}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Bottom button */}
      <Animated.View className="px-6 pb-8 pt-2 absolute bottom-0 left-0 right-0" style={{ opacity: buttonOpacity, transform: [{ translateY: buttonY }] }}>
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
            disabled={!canFinish}
            activeOpacity={canFinish ? 0.8 : 1}
            className="rounded-3xl py-4 items-center"
            style={{ backgroundColor: canFinish ? "#4dc591" : "#d1d5db", shadowColor: canFinish ? "#4dc591" : "transparent", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: canFinish ? 8 : 0 }}
          >
            <Text className="text-white text-base font-bold">Start Tracking 🎯</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
