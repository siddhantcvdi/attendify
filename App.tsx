import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabNavigator from "./src/navigation/TabNavigator";
import { ProfileProvider } from "./src/context/ProfileContext";
import { SubjectsProvider } from "./src/context/SubjectsContext";
import { ScheduleProvider } from "./src/context/ScheduleContext";
import { AttendanceProvider } from "./src/context/AttendanceContext";
import { AppResetProvider } from "./src/context/AppResetContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";

const ONBOARDING_KEY = "onboarding_complete";

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setShowOnboarding(value !== "true");
      setReady(true);
    });
  }, []);

  async function handleOnboardingComplete() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }

  async function handleReset() {
    await AsyncStorage.multiRemove([
      ONBOARDING_KEY,
      "@attendify:profile",
      "@attendify:subjects",
      "@attendify:schedule",
      "@attendify:attendance",
      "@attendify:extra_classes",
    ]);
    setInstanceKey((k) => k + 1);
    setShowOnboarding(true);
  }

  if (!ready) return null;

  return (
  <SafeAreaProvider>
    <ProfileProvider key={instanceKey}>
    <SubjectsProvider key={instanceKey}>
    <ScheduleProvider key={instanceKey}>
    <AttendanceProvider key={instanceKey}>
    <AppResetProvider onReset={handleReset}>
      <NavigationContainer>
        <StatusBar style="dark" />

        {showOnboarding ? (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        ) : (
          <TabNavigator />
        )}

      </NavigationContainer>
    </AppResetProvider>
    </AttendanceProvider>
    </ScheduleProvider>
    </SubjectsProvider>
    </ProfileProvider>
  </SafeAreaProvider>
);
}
