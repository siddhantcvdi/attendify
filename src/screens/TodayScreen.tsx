import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListFilter } from "lucide-react-native";
import WeekDaySelector from "../components/WeekDaySelector";
import LectureTimelineCard from "../components/LectureTimelineCard";
import { getLecturesForDate } from "../data/scheduleData";
import { getOngoingOrNextLecture } from "../utils/attendance";
import { AttendanceStatus, Lecture } from "../data/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function TodayScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, AttendanceStatus>
  >({});

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const lectures: Lecture[] = useMemo(() => {
    const base = getLecturesForDate(selectedDate);
    const dk = dateKey(selectedDate);
    return base.map((l) => {
      const key = `${dk}:${l.id}`;
      return key in statusOverrides
        ? { ...l, status: statusOverrides[key] }
        : l;
    });
  }, [
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    statusOverrides,
  ]);

  const currentLecture = isToday ? getOngoingOrNextLecture(lectures) : null;
  const activeLectureId = currentLecture?.lecture.id ?? null;

  const day = selectedDate.getDate();
  const dayName = DAYS[selectedDate.getDay()].slice(0, 3);
  const monthYear = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleWeekChange = useCallback(
    (offset: number) => {
      setWeekOffset(offset);
      const diff = offset - weekOffset;
      setSelectedDate((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + diff * 7);
        return next;
      });
    },
    [weekOffset],
  );

  const handleGoToToday = useCallback(() => {
    setSelectedDate(new Date());
    setWeekOffset(0);
  }, []);

  const handleStatusChange = useCallback(
    (lectureId: string, status: AttendanceStatus) => {
      const dk = dateKey(selectedDate);
      setStatusOverrides((prev) => ({
        ...prev,
        [`${dk}:${lectureId}`]: status,
      }));
    },
    [selectedDate],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Fixed header area */}
      <View>
        {/* Date header */}
        <View className="flex-row items-center justify-between px-5 py-4 pb-2">
          <View className="flex-row items-center">
            <Text className="text-text text-5xl mr-1 leading-tight">{day}</Text>
            <View>
              <Text className="text-text-muted text-sm font-medium leading-tight">
                {dayName}
              </Text>
              <Text className="text-text-muted text-sm leading-tight">
                {monthYear}
              </Text>
            </View>
          </View>
          {!isToday && (
            <TouchableOpacity
              onPress={handleGoToToday}
              className="bg-[#4dc591]/10 rounded-lg px-4 py-2 pt-3 flex justify-start items-center"
              activeOpacity={0.7}
            >
              <Text className="text-[#4dc591] text-md flex font-semibold">
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Week day selector */}
        <View className="bg-white pt-3 rounded-t-3xl">
          <WeekDaySelector
            selectedDate={selectedDate}
            weekOffset={weekOffset}
            onSelectDate={handleSelectDate}
            onWeekChange={handleWeekChange}
            className="mb-3"
          />
        </View>
      </View>

      {/* Scrollable timeline area */}
      {lectures.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-muted text-sm text-center">
            No lectures scheduled for this day.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-white"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
        >
          <View className="pl-0 pr-4">
            {lectures.map((lecture) => (
              <LectureTimelineCard
                key={lecture.id}
                lecture={lecture}
                isActive={lecture.id === activeLectureId}
                onStatusChange={handleStatusChange}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
