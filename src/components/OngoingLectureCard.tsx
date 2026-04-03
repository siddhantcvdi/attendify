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
      className={`bg-white rounded-2xl border-neutral-200 p-5 ${className ?? ""}`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-text-secondary text-sm font-medium">
          {isOngoing ? "Ongoing Lecture" : "Up Next"}
        </Text>
        <View
          className={`flex-row items-center ${badgeColor} rounded-full px-3 py-1`}
        >
          <Radio size={10} color={dotColor} />
          <Text className={`${badgeTextColor} text-xs font-semibold ml-1`}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <Text className="text-text text-xl font-bold mb-3">
        {lecture.subjectName}
      </Text>

      <View className="flex-row items-center mb-2">
        <Clock size={15} color="#5f8a85" />
        <Text className="text-text-secondary text-sm ml-2">
          {lecture.startTime} - {lecture.endTime}
        </Text>
      </View>

      <View className="flex-row items-center mb-4">
        <MapPin size={15} color="#5f8a85" />
        <Text className="text-text-secondary text-sm ml-2">{lecture.room}</Text>
      </View>

      <AttendanceActions
        status={lecture.status}
        onStatusChange={(s) => onStatusChange(lecture.id, s)}
      />
    </View>
  );
}
