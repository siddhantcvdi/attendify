import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,

  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Circle, MapPressEvent, Region } from "react-native-maps";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { X, Locate } from "lucide-react-native";
import { ClassLocation } from "../data/types";

interface LocationSetupScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (location: ClassLocation) => void;
  initialLocation?: ClassLocation | null;
}

const DEFAULT_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

export default function LocationSetupScreen({
  visible,
  onClose,
  onSave,
  initialLocation,
}: LocationSetupScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null
  );
  const [radius, setRadius] = useState(initialLocation?.radius ?? 50);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialLocation) {
      setPin({ latitude: initialLocation.latitude, longitude: initialLocation.longitude });
      setRadius(initialLocation.radius);
      mapRef.current?.animateToRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    } else {
      setPin(null);
      setRadius(50);
      handleUseMyLocation();
    }
  }, [visible]);

  function handleMapPress(e: MapPressEvent) {
    setPin(e.nativeEvent.coordinate);
  }

  async function handleUseMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(coord);
      mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
    } finally {
      setLocating(false);
    }
  }

  function handleSave() {
    if (!pin) return;
    onSave({ latitude: pin.latitude, longitude: pin.longitude, radius });
    onClose();
  }

  const initialRegion = initialLocation
    ? {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  return (
    <Modal
      visible={visible}
      animationType="slide"

      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        {/* Header */}
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

        {/* Map */}
        <View className="flex-1">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation
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

          {/* Use my location button */}
          <TouchableOpacity
            onPress={handleUseMyLocation}
            activeOpacity={0.8}
            className="absolute top-3 right-3 bg-white rounded-2xl px-3 py-2 flex-row items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#4dc591" />
            ) : (
              <Locate size={15} color="#4dc591" />
            )}
            <Text className="text-text text-xs font-semibold ml-1.5">
              My location
            </Text>
          </TouchableOpacity>

          {!pin && (
            <View
              style={{ pointerEvents: "none", position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center" }}
            >
              <View className="bg-black/50 rounded-2xl px-4 py-2">
                <Text className="text-white text-xs font-medium">
                  Tap on the map to drop a pin
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom sheet */}
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-text text-sm font-medium">Radius</Text>
            <Text className="text-text text-base font-bold">
              {radius}{" "}
              <Text className="text-text-muted text-sm font-normal">m</Text>
            </Text>
          </View>

          <Slider
            style={{ width: "100%", height: 36 }}
            minimumValue={10}
            maximumValue={100}
            step={10}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor="#4dc591"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#4dc591"
          />

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={pin ? 0.8 : 1}
            className="rounded-3xl py-4 items-center mt-3"
            style={{
              backgroundColor: pin ? "#4dc591" : "#d1d5db",
              shadowColor: pin ? "#4dc591" : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: pin ? 8 : 0,
            }}
          >
            <Text className="text-white text-base font-bold">
              Save Location
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
