import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BookOpen, Pencil } from "lucide-react-native";
import CircularProgress from "./CircularProgress";
import { getAttendanceColor } from "../utils/attendance";

interface SubjectCardProps {
  name: string;
  code: string;
  percentage: number;
  attended: number;
  total: number;
  onEdit?: () => void;
  className?: string;
}

export default function SubjectCard({
  name,
  code,
  percentage,
  attended,
  total,
  onEdit,
  className,
}: SubjectCardProps) {
  const color = getAttendanceColor(percentage);

  return (
    <View
      className={`bg-white rounded-3xl border border-neutral-200 p-4 w-36 ${className ?? ""}`}
    >
      {/* Top row: icon + pencil */}
      <View className="flex-row items-start justify-between mb-3">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#5f8a8518" }}
        >
          <BookOpen size={16} color="#5f8a85" />
        </View>
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          activeOpacity={0.6}
        >
          <Pencil size={14} color="#94a9a6" />
        </TouchableOpacity>
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
