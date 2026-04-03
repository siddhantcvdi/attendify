import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MoreVertical } from "lucide-react-native";

interface TopBarProps {
  left: React.ReactNode;
  className?: string;
}

export default function TopBar({ left, className }: TopBarProps) {
  return (
    <View className={`flex-row items-center justify-between px-5 pt-4 pb-2 ${className ?? ""}`}>
      {left}
      <TouchableOpacity activeOpacity={0.6} className="p-1">
        <MoreVertical size={20} color="#5f8a85" />
      </TouchableOpacity>
    </View>
  );
}

export function DashboardHeader() {
  return (
    <View className="flex-row items-center">
      <View className="w-11 h-11 rounded-full bg-gray-300 items-center justify-center mr-3">
        <Text className="text-black text-lg font-light">S</Text>
      </View>
      <View>
        <Text className="text-text-muted text-sm font-medium">Hello there,</Text>
        <Text className="text-text text-2xl font-bold">Siddhant</Text>
      </View>
    </View>
  );
}

export function TodayHeader({
  day,
  dayName,
  monthYear,
}: {
  day: number;
  dayName: string;
  monthYear: string;
}) {
  return (
    <View className="flex-row items-center">
      <Text className="text-text text-3xl font-bold mr-2 leading-tight">
        {day}
      </Text>
      <View>
        <Text className="text-text-secondary text-sm font-medium leading-tight">
          {dayName}
        </Text>
        <Text className="text-text-muted text-sm leading-tight">{monthYear}</Text>
      </View>
    </View>
  );
}
