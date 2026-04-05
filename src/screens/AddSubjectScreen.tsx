import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus, Trash2 } from "lucide-react-native";
import { Subject } from "../data/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

interface LectureSlot {
  id: string;
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  professor: string;
}

function emptySlot(): LectureSlot {
  return {
    id: Math.random().toString(36).slice(2),
    days: [],
    startTime: "",
    endTime: "",
    room: "",
    professor: "",
  };
}

interface AddSubjectScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (subject: Subject) => void;
}

export default function AddSubjectScreen({
  visible,
  onClose,
  onSave,
}: AddSubjectScreenProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [slots, setSlots] = useState<LectureSlot[]>([emptySlot()]);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  const reset = useCallback(() => {
    setName("");
    setCode("");
    setSlots([emptySlot()]);
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSave = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Subject name is required";
    if (!code.trim()) newErrors.code = "Subject code is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave({
      id: Date.now().toString(),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      totalClasses: 0,
      attendedClasses: 0,
    });
    reset();
    onClose();
  }, [name, code, onSave, onClose, reset]);

  const updateSlot = useCallback(
    (id: string, patch: Partial<LectureSlot>) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const toggleDay = useCallback((slotId: string, day: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              days: s.days.includes(day)
                ? s.days.filter((d) => d !== day)
                : [...s.days, day],
            }
          : s
      )
    );
  }, []);

  const addSlot = useCallback(() => {
    setSlots((prev) => [...prev, emptySlot()]);
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"

      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
            <Text className="text-text text-xl font-bold">Add Subject</Text>
            <TouchableOpacity
              onPress={handleClose}
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={18} color="#5f8a85" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Subject Details Card */}
            <View className="bg-white rounded-3xl border border-neutral-200 p-4 mb-4">
              <Text className="text-text text-sm font-semibold mb-3">
                Subject Details
              </Text>

              {/* Name */}
              <Text className="text-text text-xs font-medium mb-1">Subject Name</Text>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (t.trim()) setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="e.g. Data Structures"
                placeholderTextColor="#bcc1cd"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm mb-1"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
              {errors.name && (
                <Text className="text-[#ff7648] text-xs mb-2">
                  {errors.name}
                </Text>
              )}

              {/* Code */}
              <Text className="text-text-muted text-xs mb-1 mt-2">
                Subject Code
              </Text>
              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  if (t.trim()) setErrors((e) => ({ ...e, code: undefined }));
                }}
                placeholder="e.g. CS201"
                placeholderTextColor="#bcc1cd"
                autoCapitalize="characters"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm mb-1"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
              {errors.code && (
                <Text className="text-[#ff7648] text-xs mb-2">
                  {errors.code}
                </Text>
              )}

            </View>

            {/* Lecture Slots */}
            <Text className="text-text text-sm font-semibold mb-3 px-1">
              Lecture Schedule
            </Text>

            {slots.map((slot, index) => (
              <View
                key={slot.id}
                className="bg-white rounded-3xl border border-neutral-200 p-4 mb-3"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-text-muted text-xs font-medium">
                    Slot {index + 1}
                  </Text>
                  {slots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSlot(slot.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color="#ff7648" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Days */}
                <Text className="text-text text-xs font-medium mb-2">Days</Text>
                <View className="flex-row gap-2 mb-3 flex-wrap">
                  {DAYS.map((day) => {
                    const selected = slot.days.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(slot.id, day)}
                        activeOpacity={0.7}
                        className={`px-3 py-1.5 rounded-xl ${selected ? "bg-[#4dc591]/15" : "bg-surface"}`}
                      >
                        <Text
                          className={`text-xs font-semibold ${selected ? "text-[#4dc591]" : "text-text-muted"}`}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Times */}
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-text text-xs font-medium mb-1">
                      Start Time
                    </Text>
                    <TextInput
                      value={slot.startTime}
                      onChangeText={(t) => updateSlot(slot.id, { startTime: t })}
                      placeholder="09:00"
                      placeholderTextColor="#bcc1cd"
                      keyboardType="numbers-and-punctuation"
                      className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                      style={{ fontFamily: "Poppins_400Regular" }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text text-xs font-medium mb-1">
                      End Time
                    </Text>
                    <TextInput
                      value={slot.endTime}
                      onChangeText={(t) => updateSlot(slot.id, { endTime: t })}
                      placeholder="10:00"
                      placeholderTextColor="#bcc1cd"
                      keyboardType="numbers-and-punctuation"
                      className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                      style={{ fontFamily: "Poppins_400Regular" }}
                    />
                  </View>
                </View>

                {/* Room */}
                <Text className="text-text text-xs font-medium mb-1">Room</Text>
                <TextInput
                  value={slot.room}
                  onChangeText={(t) => updateSlot(slot.id, { room: t })}
                  placeholder="e.g. LT-3"
                  placeholderTextColor="#bcc1cd"
                  className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm mb-3"
                  style={{ fontFamily: "Poppins_400Regular" }}
                />

                {/* Professor */}
                <Text className="text-text text-xs font-medium mb-1">Professor</Text>
                <TextInput
                  value={slot.professor}
                  onChangeText={(t) => updateSlot(slot.id, { professor: t })}
                  placeholder="e.g. Dr. Smith"
                  placeholderTextColor="#bcc1cd"
                  className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                  style={{ fontFamily: "Poppins_400Regular" }}
                />
              </View>
            ))}

            {/* Add Slot */}
            <TouchableOpacity
              onPress={addSlot}
              activeOpacity={0.7}
              className="flex-row items-center justify-center bg-white rounded-3xl border border-dashed border-neutral-300 py-3"
            >
              <Plus size={15} color="#5f8a85" />
              <Text className="text-[#5f8a85] text-sm font-medium ml-1.5">
                Add another slot
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Save Button — floating at bottom */}
          <View className="px-5 py-4 absolute bottom-0 left-0 right-0">
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              className="rounded-3xl py-4 items-center"
              style={{
                backgroundColor: "#4dc591",
                shadowColor: "#4dc591",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-white text-base font-bold">
                Save Subject
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
