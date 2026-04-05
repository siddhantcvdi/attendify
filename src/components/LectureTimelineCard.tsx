import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { MapPin, User } from "lucide-react-native";
import { Lecture, AttendanceStatus } from "../data/types";
import AttendanceActions from "./AttendanceActions";

interface LectureTimelineCardProps {
  lecture: Lecture;
  isActive: boolean;
  onStatusChange: (lectureId: string, status: AttendanceStatus) => void;
  className?: string;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getProgress(startTime: string, endTime: string): number {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return Math.min(1, Math.max(0, (current - start) / (end - start)));
}

function isPast(endTime: string): boolean {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return parseTime(endTime) <= current;
}

export default function LectureTimelineCard({
  lecture,
  isActive,
  onStatusChange,
  className,
}: LectureTimelineCardProps) {
  const isCancelled = lecture.status === "cancelled";
  const past = !isActive && isPast(lecture.endTime);
  const metaColor = isCancelled ? "#94a9a6" : "#5f8a85";

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const progress = getProgress(lecture.startTime, lecture.endTime);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      const p = getProgress(lecture.startTime, lecture.endTime);
      Animated.timing(progressAnim, {
        toValue: p,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, 60000);

    return () => clearInterval(interval);
  }, [isActive, lecture.startTime, lecture.endTime]);

  return (
    <View className={`flex-row ${className ?? ""}`}>
      {/* Time column */}
      <View className="w-12 items-end mr-2 pt-1">
        <Text className={`text-sm font-bold ${isCancelled ? "text-text-muted" : "text-text"}`}>
          {lecture.startTime}
        </Text>
        <Text className="text-text-muted text-xs mt-0.5">{lecture.endTime}</Text>
      </View>

      {/* Timeline dot + line */}
      <View className="items-center mr-2 pt-2">
        <View
          className={`w-3 h-3 rounded-full ${
            isCancelled ? "bg-gray-300" : isActive ? "bg-[#4dc591]" : past ? "bg-[#4dc591]/60" : "bg-neutral-300"
          }`}
        />
        {/* Line container */}
        <View
          className="w-0.5 flex-1 mt-1 overflow-hidden"
          style={{ backgroundColor: "#e5e7eb" }}
          onLayout={(e) => setLineHeight(e.nativeEvent.layout.height)}
        >
          {isActive ? (
            <Animated.View
              style={{
                width: "100%",
                height: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, lineHeight],
                }),
                backgroundColor: "#4dc591",
              }}
            />
          ) : past && !isCancelled ? (
            <View style={{ width: "100%", height: "100%", backgroundColor: "#4dc591", opacity: 0.4 }} />
          ) : null}
        </View>
      </View>

      {/* Card */}
      <View
        className={`flex-1 rounded-3xl border p-4 mb-4 ${
          isCancelled
            ? "bg-gray-50 border-neutral-200"
            : isActive
              ? "bg-[#4dc591]/10 border-[#4dc591]/20"
              : "bg-[#F6F6F5] border-neutral-200"
        }`}
      >
        <Text className={`text-base font-bold mb-1.5 ${isCancelled ? "text-text-muted" : "text-text"}`}>
          {lecture.subjectName}
        </Text>

        <View className="flex-row items-center gap-3 mb-3">
          <View className="flex-row items-center">
            <MapPin size={12} color={metaColor} />
            <Text className="text-text-muted text-xs ml-1">{lecture.room}</Text>
          </View>
          <View className="flex-row items-center">
            <User size={12} color={metaColor} />
            <Text className="text-text-muted text-xs ml-1">{lecture.professor}</Text>
          </View>
        </View>

        <AttendanceActions
          status={lecture.status}
          onStatusChange={(s) => onStatusChange(lecture.id, s)}
          variant="light"
        />
      </View>
    </View>
  );
}
