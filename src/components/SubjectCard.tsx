import React from "react";
import { View, Text } from "react-native";
import { BookOpen } from "lucide-react-native";
import CircularProgress from "./CircularProgress";
import { getAttendanceColor } from "../utils/attendance";

interface SubjectCardProps {
  name: string;
  code: string;
  percentage: number;
  attended: number;
  total: number;
  className?: string;
}

export default function SubjectCard({
  name,
  code,
  percentage,
  attended,
  total,
  className,
}: SubjectCardProps) {
  const color = getAttendanceColor(percentage);

  return (
    <View
      className={`bg-white rounded-3xl border border-neutral-200 p-4 w-36 ${className ?? ""}`}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: "#5f8a8518" }}
      >
        <BookOpen size={16} color="#5f8a85" />
      </View>

      <Text className="text-text text-sm font-semibold mb-0.5 h-10" numberOfLines={2}>
        {name}
      </Text>
      <Text className="text-text-muted text-xs mb-3" numberOfLines={1}>{code}</Text>

      <CircularProgress
        percentage={percentage}
        size={44}
        strokeWidth={5}
        color={color}
        backgroundColor={`${color}20`}
        labelClassName="text-xs font-bold text-center"
      />

      <Text className="text-text-muted text-xs mt-2">
        {attended}/{total} classes
      </Text>
    </View>
  );
}
