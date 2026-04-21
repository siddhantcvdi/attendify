import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus, Trash2 } from "lucide-react-native";
import TimePicker from "./TimePicker";
import { Subject, NamedLocation } from "../data/types";
import { useProfile } from "../context/ProfileContext";
import { useSchedule } from "../context/ScheduleContext";

const DAY_TO_NUM: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
const NUM_TO_DAY: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

interface LectureSlot {
  id: string;
  days: string[];
  startTime: string;
  endTime: string;
}

function emptySlot(): LectureSlot {
  return {
    id: Math.random().toString(36).slice(2),
    days: [],
    startTime: "",
    endTime: "",
  };
}

interface EditSubjectModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onSave: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

export default function EditSubjectModal({
  visible,
  subject,
  onClose,
  onSave,
  onDelete,
}: EditSubjectModalProps) {
  const { profile } = useProfile();
  const { weekdaySchedules, setSchedule } = useSchedule();
  const locations: NamedLocation[] = profile.locations ?? [];
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [attended, setAttended] = useState("");
  const [total, setTotal] = useState("");
  const [room, setRoom] = useState("");
  const [professor, setProfessor] = useState("");
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [slots, setSlots] = useState<LectureSlot[]>([emptySlot()]);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setCode(subject.code);
      setAttended(subject.attendedClasses > 0 ? String(subject.attendedClasses) : "");
      setTotal(subject.totalClasses > 0 ? String(subject.totalClasses) : "");
      setRoom(subject.room ?? "");
      setProfessor(subject.professor ?? "");
      setLocationId(subject.locationId);
      setErrors({});

      // Load existing schedule slots for this subject
      const slotMap: Record<string, LectureSlot> = {};
      for (const [dayStr, templates] of Object.entries(weekdaySchedules)) {
        const dayNum = parseInt(dayStr);
        const dayName = NUM_TO_DAY[dayNum];
        if (!dayName) continue;
        for (const t of templates) {
          if (t.subjectId !== subject.id) continue;
          const key = `${t.startTime}|${t.endTime}`;
          if (!slotMap[key]) {
            slotMap[key] = {
              id: Math.random().toString(36).slice(2),
              days: [],
              startTime: t.startTime,
              endTime: t.endTime,
            };
          }
          slotMap[key].days.push(dayName);
        }
      }
      const loaded = Object.values(slotMap);
      setSlots(loaded.length > 0 ? loaded : [emptySlot()]);
    }
  }, [subject, weekdaySchedules]);

  const reset = useCallback(() => {
    setName("");
    setCode("");
    setAttended("");
    setTotal("");
    setRoom("");
    setProfessor("");
    setLocationId(undefined);
    setSlots([emptySlot()]);
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSave = useCallback(() => {
    if (!subject) return;
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Subject name is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const parsedTotal = parseInt(total, 10);
    const parsedAttended = parseInt(attended, 10);
    onSave({
      ...subject,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      room: room.trim(),
      professor: professor.trim(),
      locationId,
      totalClasses: isNaN(parsedTotal) ? subject.totalClasses : parsedTotal,
      attendedClasses: isNaN(parsedAttended) ? subject.attendedClasses : Math.min(parsedAttended, isNaN(parsedTotal) ? subject.totalClasses : parsedTotal),
    });

    // Remove old schedule entries for this subject, then add updated ones
    const updated: typeof weekdaySchedules = {};
    for (const [dayStr, templates] of Object.entries(weekdaySchedules)) {
      const dayNum = parseInt(dayStr);
      updated[dayNum] = templates.filter((t) => t.subjectId !== subject.id);
    }
    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime) continue;
      for (const day of slot.days) {
        const dayNum = DAY_TO_NUM[day];
        if (dayNum === undefined) continue;
        updated[dayNum] = [
          ...(updated[dayNum] ?? []),
          {
            subjectId: subject.id,
            subjectName: name.trim(),
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: room.trim(),
            professor: professor.trim(),
            topic: "",
          },
        ];
      }
    }
    setSchedule(updated);

    reset();
    onClose();
  }, [subject, name, code, total, attended, room, professor, locationId, slots, weekdaySchedules, setSchedule, onSave, onClose, reset]);

  const handleDelete = useCallback(() => {
    if (!subject) return;
    onDelete(subject.id);
    // Remove all schedule entries for this subject
    const updated: typeof weekdaySchedules = {};
    for (const [dayStr, templates] of Object.entries(weekdaySchedules)) {
      updated[parseInt(dayStr)] = templates.filter((t) => t.subjectId !== subject.id);
    }
    setSchedule(updated);
    reset();
    onClose();
  }, [subject, onDelete, weekdaySchedules, setSchedule, reset, onClose]);

  const updateSlot = useCallback((id: string, patch: Partial<LectureSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const toggleDay = useCallback((slotId: string, day: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, days: s.days.includes(day) ? s.days.filter((d) => d !== day) : [...s.days, day] }
          : s
      )
    );
  }, []);

  const addSlot = useCallback(() => setSlots((prev) => [...prev, emptySlot()]), []);
  const removeSlot = useCallback((id: string) => setSlots((prev) => prev.filter((s) => s.id !== id)), []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
            <Text className="text-text text-xl font-bold">Edit Subject</Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDelete}
                className="w-9 h-9 rounded-full bg-[#ff7648]/10 items-center justify-center"
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#ff7648" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                activeOpacity={0.7}
              >
                <X size={18} color="#5f8a85" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Subject Details Card */}
            <View className="bg-white rounded-3xl border border-neutral-200 p-4 mb-4">
              <Text className="text-text text-sm font-semibold mb-3">Subject Details</Text>

              <Text className="text-text text-xs font-medium mb-1">Subject Name</Text>
              <TextInput
                value={name}
                onChangeText={(t) => { setName(t); if (t.trim()) setErrors((e) => ({ ...e, name: undefined })); }}
                placeholder="e.g. Data Structures"
                placeholderTextColor="#bcc1cd"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm mb-1"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
              {errors.name && <Text className="text-[#ff7648] text-xs mb-2">{errors.name}</Text>}

              <Text className="text-text-muted text-xs mb-1 mt-2">Subject Code</Text>
              <TextInput
                value={code}
                onChangeText={(t) => { setCode(t); if (t.trim()) setErrors((e) => ({ ...e, code: undefined })); }}
                placeholder="e.g. CS201"
                placeholderTextColor="#bcc1cd"
                autoCapitalize="characters"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm mb-1"
                style={{ fontFamily: "Poppins_400Regular" }}
              />
              {errors.code && <Text className="text-[#ff7648] text-xs mb-2">{errors.code}</Text>}

              {/* Attendance (optional) */}
              <Text className="text-text-muted text-xs mb-1 mt-3">
                Attendance <Text className="text-text-muted text-xs font-normal">(optional)</Text>
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-text-muted text-xs mb-1">Attended</Text>
                  <TextInput
                    value={attended}
                    onChangeText={setAttended}
                    placeholder="0"
                    placeholderTextColor="#bcc1cd"
                    keyboardType="number-pad"
                    className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                    style={{ fontFamily: "Poppins_400Regular" }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-text-muted text-xs mb-1">Total</Text>
                  <TextInput
                    value={total}
                    onChangeText={setTotal}
                    placeholder="0"
                    placeholderTextColor="#bcc1cd"
                    keyboardType="number-pad"
                    className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                    style={{ fontFamily: "Poppins_400Regular" }}
                  />
                </View>
              </View>

              {/* Room */}
              <Text className="text-text-muted text-xs mb-1 mt-3">Room</Text>
              <TextInput
                value={room}
                onChangeText={setRoom}
                placeholder="e.g. LT-3"
                placeholderTextColor="#bcc1cd"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                style={{ fontFamily: "Poppins_400Regular" }}
              />

              {/* Professor */}
              <Text className="text-text-muted text-xs mb-1 mt-3">Professor</Text>
              <TextInput
                value={professor}
                onChangeText={setProfessor}
                placeholder="e.g. Dr. Smith"
                placeholderTextColor="#bcc1cd"
                className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-text text-sm"
                style={{ fontFamily: "Poppins_400Regular" }}
              />

              {locations.length > 0 && (
                <>
                  <Text className="text-text text-xs font-medium mb-1 mt-2">Location</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {locations.map((loc, idx) => {
                      const selected = locationId === loc.id || (locationId === undefined && idx === 0);
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          onPress={() => setLocationId(idx === 0 ? undefined : loc.id)}
                          activeOpacity={0.7}
                          className={`px-3 py-1.5 rounded-xl border ${selected ? "bg-[#4dc591]/15 border-[#4dc591]/30" : "bg-surface border-neutral-200"}`}
                        >
                          <Text className={`text-xs font-semibold ${selected ? "text-[#4dc591]" : "text-text-muted"}`}>
                            {loc.name}{idx === 0 ? " (default)" : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>

            {/* Lecture Slots */}
            <Text className="text-text text-sm font-semibold mb-3 px-1">Lecture Schedule</Text>

            {slots.map((slot, index) => (
              <View key={slot.id} className="bg-white rounded-3xl border border-neutral-200 p-4 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-text-muted text-xs font-medium">Slot {index + 1}</Text>
                  {slots.length > 1 && (
                    <TouchableOpacity onPress={() => removeSlot(slot.id)} activeOpacity={0.7}>
                      <Trash2 size={15} color="#ff7648" />
                    </TouchableOpacity>
                  )}
                </View>

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
                        <Text className={`text-xs font-semibold ${selected ? "text-[#4dc591]" : "text-text-muted"}`}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-text text-xs font-medium mb-1">Start Time</Text>
                    <TimePicker
                      value={slot.startTime}
                      onChange={(t) => updateSlot(slot.id, { startTime: t })}
                      placeholder="09:00"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text text-xs font-medium mb-1">End Time</Text>
                    <TimePicker
                      value={slot.endTime}
                      onChange={(t) => updateSlot(slot.id, { endTime: t })}
                      placeholder="10:00"
                    />
                  </View>
                </View>

              </View>
            ))}

            <TouchableOpacity
              onPress={addSlot}
              activeOpacity={0.7}
              className="flex-row items-center justify-center bg-white rounded-3xl border border-dashed border-neutral-300 py-3"
            >
              <Plus size={15} color="#5f8a85" />
              <Text className="text-[#5f8a85] text-sm font-medium ml-1.5">Add another slot</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Save Button */}
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
              <Text className="text-white text-base font-bold">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
