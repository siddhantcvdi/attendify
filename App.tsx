import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabNavigator from "./src/navigation/TabNavigator";
import { ProfileProvider } from "./src/context/ProfileContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";

const ONBOARDING_KEY = "onboarding_complete";

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  if (!ready) return null;

  return (
  <SafeAreaProvider>
    <ProfileProvider>
      <NavigationContainer>
        <StatusBar style="dark" />

        {showOnboarding ? (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        ) : (
          <TabNavigator />
        )}

      </NavigationContainer>
    </ProfileProvider>
  </SafeAreaProvider>
);
}
