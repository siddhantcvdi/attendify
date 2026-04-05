import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useProfile } from "../context/ProfileContext";
import { useSubjects } from "../context/SubjectsContext";
import { useAttendance } from "../context/AttendanceContext";
import { useSchedule } from "../context/ScheduleContext";
import HeroCard from "../components/HeroCard";
import OngoingLectureCard from "../components/OngoingLectureCard";
import SubjectCard from "../components/SubjectCard";
import AddSubjectScreen from "./AddSubjectScreen";
import EditSubjectModal from "../components/EditSubjectModal";
import BunkCalculator from "../components/BunkCalculator";
import {
  getTodayAttendancePercentage,
  getTodayProgress,
  getDashboardLectures,
  getAttendancePercentage,
} from "../utils/attendance";
import { AttendanceStatus, Lecture, Subject } from "../data/types";

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning,", emoji: "🍵" };
  if (hour < 17) return { text: "Good afternoon,", emoji: "☀️" };
  if (hour < 21) return { text: "Good evening,", emoji: "🍁" };
  return { text: "Day wrapped up,", emoji: "🌙" };
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function DashboardScreen() {
  const { profile } = useProfile();
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects();
  const { statusOverrides, extraClasses, setStatus } = useAttendance();
  const { getLecturesForDate } = useSchedule();
  const { text: greetingText, emoji } = getGreeting();
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const today = new Date();
  const dk = dateKey(today);

  const lectures: Lecture[] = useMemo(() => {
    const base = getLecturesForDate(today);
    const extras = extraClasses[dk] ?? [];
    return [...base, ...extras].map((l) => {
      const key = `${dk}:${l.id}`;
      return key in statusOverrides ? { ...l, status: statusOverrides[key] } : l;
    });
  }, [dk, statusOverrides, extraClasses, getLecturesForDate]);

  const todayPercentage = useMemo(() => getTodayAttendancePercentage(lectures), [lectures]);
  const { attended, total } = useMemo(() => getTodayProgress(lectures), [lectures]);
  const dashboardLectures = useMemo(() => getDashboardLectures(lectures), [lectures]);

  const handleStatusChange = useCallback((lectureId: string, status: AttendanceStatus) => {
    setStatus(dk, lectureId, status);
  }, [dk, setStatus]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-[#ff7648]/15 items-center justify-center mr-1">
            <Text style={{ fontSize: 24 }}>{emoji}</Text>
          </View>
          <View>
            <Text className="text-text text-xs font-medium">{greetingText}</Text>
            <Text className="text-text text-2xl font-bold">{profile.name}</Text>
          </View>
        </View>

        {/* Hero Card */}
        <HeroCard
          percentage={todayPercentage}
          attended={attended}
          total={total}
          className="mx-4 mt-2"
        />

        {/* Bunk Calculator */}
        <BunkCalculator subjects={subjects} />

        {/* Ongoing / Upcoming Lectures */}
        {dashboardLectures.length > 0 ? (
          dashboardLectures.map((item, index) => (
            <OngoingLectureCard
              key={item.lecture.id}
              lecture={item.lecture}
              isOngoing={item.isOngoing}
              onStatusChange={handleStatusChange}
              className={`mx-4 ${index === 0 ? "mt-5" : "mt-3"}`}
            />
          ))
        ) : (
          <View
            className="bg-white rounded-3xl p-4 mx-4 mt-5"
            style={{ borderWidth: 1, borderStyle: "dashed", borderColor: "#e5e5e5" }}
          >
            <Text className="text-text-secondary text-sm font-medium mb-1">
              {lectures.length === 0 ? "No schedule set up" : "No More Lectures"}
            </Text>
            <Text className="text-text text-lg font-bold mb-1">
              {lectures.length === 0 ? "Nothing here yet" : "All done for today"}
            </Text>
            <Text className="text-text-muted text-xs">
              {lectures.length === 0
                ? "Import your timetable from Settings to get started"
                : "You're free for the rest of the day 🎉"}
            </Text>
          </View>
        )}

        {/* Subjects Overview */}
        <View className="mt-6 mb-2">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-text text-lg font-bold">Subjects Overview</Text>
            <TouchableOpacity
              onPress={() => setShowAddSubject(true)}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-xl bg-[#4dc591]/20 items-center justify-center"
            >
              <Plus size={16} color="#4dc591" />
            </TouchableOpacity>
          </View>
          {subjects.length === 0 ? (
            <View className="mx-4 px-4 py-5 bg-white rounded-3xl border border-dashed border-neutral-200 items-center">
              <Text className="text-text-muted text-sm">No subjects yet</Text>
              <Text className="text-text-muted text-xs mt-1">Tap + to add your first subject</Text>
            </View>
          ) : (
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              scrollEnabled
              renderItem={({ item: subject }) => (
                <SubjectCard
                  name={subject.name}
                  code={subject.code}
                  percentage={getAttendancePercentage(subject)}
                  attended={subject.attendedClasses}
                  total={subject.totalClasses}
                  onEdit={() => setEditingSubject(subject)}
                />
              )}
            />
          )}
        </View>
      </ScrollView>

      <AddSubjectScreen
        visible={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        onSave={addSubject}
      />

      <EditSubjectModal
        visible={editingSubject !== null}
        subject={editingSubject}
        onClose={() => setEditingSubject(null)}
        onSave={updateSubject}
        onDelete={deleteSubject}
      />
    </SafeAreaView>
  );
}
