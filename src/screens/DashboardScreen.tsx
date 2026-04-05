import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useProfile } from "../context/ProfileContext";
import HeroCard from "../components/HeroCard";
import OngoingLectureCard from "../components/OngoingLectureCard";
import SubjectCard from "../components/SubjectCard";
import AddSubjectScreen from "./AddSubjectScreen";
import { subjects as initialSubjects, todayLectures as initialLectures } from "../data/mockData";
import {
  getTodayAttendancePercentage,
  getTodayProgress,
  getOngoingOrNextLecture,
  getAttendancePercentage,
} from "../utils/attendance";
import { AttendanceStatus, Subject } from "../data/types";

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning,", emoji: "🌅" };
  if (hour < 17) return { text: "Good afternoon,", emoji: "☀️" };
  if (hour < 21) return { text: "Good evening,", emoji: "🌆" };
  return { text: "Burning midnight oil,", emoji: "🌙" };
}

export default function DashboardScreen() {
  const { profile } = useProfile();
  const { text: greetingText, emoji } = getGreeting();
  const [lectures, setLectures] = useState(initialLectures);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showAddSubject, setShowAddSubject] = useState(false);

  const todayPercentage = useMemo(() => getTodayAttendancePercentage(lectures), [lectures]);
  const { attended, total } = useMemo(() => getTodayProgress(lectures), [lectures]);
  const currentLecture = useMemo(() => getOngoingOrNextLecture(lectures), [lectures]);

  const handleStatusChange = useCallback((lectureId: string, status: AttendanceStatus) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === lectureId ? { ...l, status } : l))
    );
  }, []);

  const handleAddSubject = useCallback((subject: Subject) => {
    setSubjects((prev) => [...prev, subject]);
  }, []);

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
            <Text className="text-text text-xs font-medium">
              {greetingText}
            </Text>
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

        {/* Ongoing / Next Lecture */}
        {currentLecture && (
          <OngoingLectureCard
            lecture={currentLecture.lecture}
            isOngoing={currentLecture.isOngoing}
            onStatusChange={handleStatusChange}
            className="mx-4 mt-5"
          />
        )}

        {/* No lectures indicator */}
        {!currentLecture && (
          <View className="bg-white rounded-3xl border border-neutral-200 p-5 mx-4 mt-5 items-center">
            <Text className="text-text-secondary text-sm">
              No more lectures today
            </Text>
          </View>
        )}

        {/* Subjects Overview */}
        <View className="mt-6 mb-2">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-text text-lg font-bold">
              Subjects Overview
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddSubject(true)}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-xl bg-[#4dc591]/20 items-center justify-center"
            >
              <Plus size={16} color="#4dc591" />
            </TouchableOpacity>
          </View>
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
              />
            )}
          />
        </View>
      </ScrollView>

      <AddSubjectScreen
        visible={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        onSave={handleAddSubject}
      />
    </SafeAreaView>
  );
}
