import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, MapPin } from "lucide-react-native";
import { ClassLocation } from "../data/types";

interface LocationSetupScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (location: ClassLocation) => void;
  initialLocation?: ClassLocation | null;
}

export default function LocationSetupScreen({
  visible,
  onClose,
}: LocationSetupScreenProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"

      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
          <Text className="text-text text-xl font-bold">Class Location</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={18} color="#5f8a85" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-[#4dc591]/15 items-center justify-center mb-4">
            <MapPin size={28} color="#4dc591" />
          </View>
          <Text className="text-text text-lg font-bold mb-2 text-center">
            Map not available on web
          </Text>
          <Text className="text-text-muted text-sm text-center">
            Open the app on iOS or Android to set your class location using the map.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
