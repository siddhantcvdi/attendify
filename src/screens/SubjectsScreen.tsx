import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen } from "lucide-react-native";

export default function SubjectsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-primary-100 rounded-2xl p-4 mb-4">
          <BookOpen size={32} color="#16a34a" />
        </View>
        <Text className="text-text text-xl font-bold mb-2">Subjects</Text>
        <Text className="text-text-secondary text-sm text-center">
          Detailed subject information will appear here. This screen is coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
