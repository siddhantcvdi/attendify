import React from "react";
import { View, Text } from "react-native";
import { MapPin, User } from "lucide-react-native";
import { Lecture, AttendanceStatus } from "../data/types";
import AttendanceActions from "./AttendanceActions";

interface LectureTimelineCardProps {
  lecture: Lecture;
  isActive: boolean;
  onStatusChange: (lectureId: string, status: AttendanceStatus) => void;
  className?: string;
}

export default function LectureTimelineCard({
  lecture,
  isActive,
  onStatusChange,
  className,
}: LectureTimelineCardProps) {
  const isCancelled = lecture.status === "cancelled";

  const metaColor = isCancelled
    ? "#94a9a6"
    : isActive
      ? "rgba(255,255,255,0.7)"
      : "#5f8a85";

  return (
    <View className={`flex-row ${className ?? ""}`}>
      {/* Time column */}
      <View className="w-12 items-end mr-2 pt-1">
        <Text
          className={`text-sm font-bold ${isCancelled ? "text-text-muted" : "text-text"}`}
        >
          {lecture.startTime}
        </Text>
        <Text className="text-text-muted text-xs mt-0.5">
          {lecture.endTime}
        </Text>
      </View>

      {/* Timeline dot + line */}
      <View className="items-center mr-2 pt-2">
        <View
          className={`w-3 h-3 rounded-full ${
            isCancelled
              ? "bg-gray-300"
              : isActive
                ? "bg-[#4dc591]"
                : "bg-text-muted"
          }`}
        />
        <View className="w-0.5 flex-1 bg-surface-muted mt-1" />
      </View>

      {/* Card */}
      <View
        className={`flex-1 rounded-3xl border border-neutral-200 p-4 mb-4 ${
          isCancelled
            ? "bg-gray-50"
            : isActive
              ? "bg-[#4dc591]"
              : "bg-[#F6F6F5]"
        }`}
      >
        <Text
          className={`text-base font-bold mb-1.5 ${
            isCancelled
              ? "text-text-muted"
              : isActive
                ? "text-white"
                : "text-text"
          }`}
        >
          {lecture.subjectName}
        </Text>

        <View className="flex-row items-center gap-3 mb-3">
          <View className="flex-row items-center">
            <MapPin size={12} color={metaColor} />
            <Text
              className={`text-xs ml-1 ${
                isCancelled
                  ? "text-text-muted"
                  : isActive
                    ? "text-white/70"
                    : "text-text-muted"
              }`}
            >
              {lecture.room}
            </Text>
          </View>
          <View className="flex-row items-center">
            <User size={12} color={metaColor} />
            <Text
              className={`text-xs ml-1 ${
                isCancelled
                  ? "text-text-muted"
                  : isActive
                    ? "text-white/70"
                    : "text-text-muted"
              }`}
            >
              {lecture.professor}
            </Text>
          </View>
        </View>

        <AttendanceActions
          status={lecture.status}
          onStatusChange={(s) => onStatusChange(lecture.id, s)}
          variant={isActive && !isCancelled ? "dark" : "light"}
        />
      </View>
    </View>
  );
}
