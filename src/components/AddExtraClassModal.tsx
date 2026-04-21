import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useSubjects } from "../context/SubjectsContext";
import { Lecture } from "../data/types";

interface AddExtraClassModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (lecture: Lecture) => void;
}

export default function AddExtraClassModal({
  visible,
  onClose,
  onAdd,
}: AddExtraClassModalProps) {
  const { subjects } = useSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const isValid =
    selectedSubjectId &&
    /^\d{2}:\d{2}$/.test(startTime) &&
    /^\d{2}:\d{2}$/.test(endTime);

  const handleAdd = useCallback(() => {
    if (!isValid || !selectedSubject) return;

    const lecture: Lecture = {
      id: `extra-${Date.now()}`,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      startTime,
      endTime,
      room: "TBD",
      professor: "TBD",
      topic: "Extra Class",
      status: null,
    };

    onAdd(lecture);
    setSelectedSubjectId(null);
    setStartTime("");
    setEndTime("");
    onClose();
  }, [isValid, selectedSubject, startTime, endTime, onAdd, onClose]);

  const handleClose = useCallback(() => {
    setSelectedSubjectId(null);
    setStartTime("");
    setEndTime("");
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
            <Text className="text-text text-xl font-bold">Add Extra Class</Text>
            <TouchableOpacity
              onPress={handleClose}
              className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={18} color="#5f8a85" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Subject */}
            <Text className="text-text text-sm font-semibold mb-2">Subject</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedSubjectId(s.id)}
                  activeOpacity={0.7}
                  className={`px-3 py-2 rounded-xl border ${
                    selectedSubjectId === s.id
                      ? "bg-[#4dc591] border-[#4dc591]"
                      : "bg-white border-neutral-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedSubjectId === s.id ? "text-white" : "text-text"
                    }`}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time row */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold mb-2">Start Time</Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor="#94a9a6"
                  className="bg-white border border-neutral-200 rounded-2xl px-4 py-3 text-text"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold mb-2">End Time</Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor="#94a9a6"
                  className="bg-white border border-neutral-200 rounded-2xl px-4 py-3 text-text"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>

            {/* Add button */}
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!isValid}
              activeOpacity={0.8}
              className={`rounded-2xl py-4 items-center ${
                isValid ? "bg-[#4dc591]" : "bg-neutral-200"
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  isValid ? "text-white" : "text-neutral-400"
                }`}
              >
                Add Class
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
