import React from "react";
import { View, Text } from "react-native";
import { Clock, MapPin, Radio } from "lucide-react-native";
import { Lecture, AttendanceStatus } from "../data/types";
import AttendanceActions from "./AttendanceActions";

interface OngoingLectureCardProps {
  lecture: Lecture;
  isOngoing: boolean;
  onStatusChange: (lectureId: string, status: AttendanceStatus) => void;
  className?: string;
}

export default function OngoingLectureCard({
  lecture,
  isOngoing,
  onStatusChange,
  className,
}: OngoingLectureCardProps) {
  const badgeColor = isOngoing ? "bg-green-100" : "bg-amber-100";
  const badgeTextColor = isOngoing ? "text-green-700" : "text-amber-700";
  const badgeLabel = isOngoing ? "Ongoing" : "Starting Soon";
  const dotColor = isOngoing ? "#22c55e" : "#f59e0b";

  return (
    <View
      className={`bg-white rounded-3xl border border-neutral-200 p-4 ${className ?? ""}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-text-secondary text-sm font-medium">
          {isOngoing ? "Ongoing Lecture" : "Up Next"}
        </Text>
        <View
          className={`flex-row items-center ${badgeColor} rounded-full px-2.5 py-0.5`}
        >
          <Radio size={9} color={dotColor} />
          <Text className={`${badgeTextColor} text-xs font-semibold ml-1`}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <Text className="text-text text-lg font-bold mb-2">
        {lecture.subjectName}
      </Text>

      <View className="flex-row items-center gap-3 mb-3">
        <View className="flex-row items-center">
          <Clock size={13} color="#5f8a85" />
          <Text className="text-text-muted text-xs ml-1">
            {lecture.startTime} - {lecture.endTime}
          </Text>
        </View>
        <View className="flex-row items-center">
          <MapPin size={13} color="#5f8a85" />
          <Text className="text-text-muted text-xs ml-1">{lecture.room}</Text>
        </View>
      </View>

      <AttendanceActions
        status={lecture.status}
        onStatusChange={(s) => onStatusChange(lecture.id, s)}
      />
    </View>
  );
}
