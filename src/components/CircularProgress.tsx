import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  labelClassName?: string;
  className?: string;
}

export default function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = "#22c55e",
  backgroundColor = "#e5e7eb",
  showLabel = true,
  labelClassName,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Leave a gap of strokeWidth arc-length at 100% so the rounded caps just touch without merging
  const gapPercent = (strokeWidth / circumference) * 100;
  const clampedPercentage = percentage >= 100 ? 100 - gapPercent : percentage;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <View
      className={`items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showLabel && (
        <View className="absolute">
          <Text
            className={labelClassName ?? "text-lg font-bold text-center"}
            style={{ color }}
          >
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
}
