import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, CheckCircle } from "lucide-react-native";
import CircularProgress from "./CircularProgress";

interface HeroCardProps {
  percentage: number;
  attended: number;
  total: number;
  onViewSchedule?: () => void;
  className?: string;
}

export default function HeroCard({
  percentage,
  attended,
  total,
  onViewSchedule,
  className,
}: HeroCardProps) {
  return (
    <View className={`bg-[#4dc591] rounded-3xl mx-3 p-5 ${className ?? ""}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-2">
            <Calendar size={16} color="rgba(255,255,255,0.8)" />
            <Text className="text-white text-sm ml-1.5 font-semibold">
              Day so far
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <CheckCircle size={14} color="rgba(255,255,255,0.7)" />
            <Text className="text-white text-sm ml-1">
              {total === 0 ? "No lectures today" : `${attended} of ${total} lectures attended`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onViewSchedule}
            className="bg-white/20 rounded-xl py-2 px-3 self-start"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold text-sm">
              View Schedule
            </Text>
          </TouchableOpacity>
        </View>

        <CircularProgress
          percentage={percentage}
          size={80}
          strokeWidth={8}
          color="rgba(255,255,255,0.85)"
          backgroundColor="rgba(255,255,255,0.25)"
          labelClassName="text-lg text-center text-white"
        />
      </View>
    </View>
  );
}
