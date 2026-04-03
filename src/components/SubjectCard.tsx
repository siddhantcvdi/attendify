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
    <View className={`bg-white rounded-2xl p-4 ${className ?? ""}`}>
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${color}18` }}
        >
          <BookOpen size={18} color={color} />
        </View>

        <View className="flex-1 mr-3">
          <Text className="text-text text-base font-semibold" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-text-muted text-xs mt-0.5">
            {code} &middot; {attended}/{total} classes
          </Text>
        </View>

        <CircularProgress
          percentage={percentage}
          size={48}
          strokeWidth={5}
          color={color}
          backgroundColor="#f1f5f1"
          labelClassName="text-xs font-bold text-center"
        />
      </View>
    </View>
  );
}
