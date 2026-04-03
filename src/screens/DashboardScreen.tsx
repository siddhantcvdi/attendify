import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar, { DashboardHeader } from "../components/TopBar";
import HeroCard from "../components/HeroCard";
import OngoingLectureCard from "../components/OngoingLectureCard";
import SubjectCard from "../components/SubjectCard";
import { subjects, todayLectures as initialLectures } from "../data/mockData";
import {
  getTodayAttendancePercentage,
  getTodayProgress,
  getOngoingOrNextLecture,
  getAttendancePercentage,
} from "../utils/attendance";
import { AttendanceStatus } from "../data/types";

export default function DashboardScreen() {
  const [lectures, setLectures] = useState(initialLectures);

  const todayPercentage = useMemo(() => getTodayAttendancePercentage(lectures), [lectures]);
  const { attended, total } = useMemo(() => getTodayProgress(lectures), [lectures]);
  const currentLecture = useMemo(() => getOngoingOrNextLecture(lectures), [lectures]);

  const handleStatusChange = useCallback((lectureId: string, status: AttendanceStatus) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === lectureId ? { ...l, status } : l))
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-gray-300 items-center justify-center mr-3">
            <Text className="text-black text-lg font-light">S</Text>
          </View>
          <View>
            <Text className="text-text-muted text-sm font-medium">
              Hello there,
            </Text>
            <Text className="text-text text-2xl font-bold">Siddhant</Text>
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
          <View className="bg-white rounded-2xl p-5 mx-4 mt-5 items-center">
            <Text className="text-text-secondary text-sm">
              No more lectures today
            </Text>
          </View>
        )}

        {/* Subjects Overview */}
        <View className="mt-6 mb-2">
          <Text className="text-text text-lg font-bold px-5 mb-3">
            Subjects Overview
          </Text>
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              name={subject.name}
              code={subject.code}
              percentage={getAttendancePercentage(subject)}
              attended={subject.attendedClasses}
              total={subject.totalClasses}
              className="mx-4 mb-3"
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
