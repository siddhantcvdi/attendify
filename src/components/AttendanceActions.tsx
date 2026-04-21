import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Check, X, Ban } from "lucide-react-native";
import { AttendanceStatus } from "../data/types";

interface AttendanceActionsProps {
  status: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
  variant?: "light" | "dark";
  className?: string;
}

const OPTIONS: {
  value: AttendanceStatus;
  label: string;
  icon: typeof Check;
}[] = [
  { value: "present", label: "Present", icon: Check },
  { value: "absent", label: "Absent", icon: X },
  { value: "cancelled", label: "Cancel", icon: Ban },
];

function getSelectedStyles(value: AttendanceStatus, variant: "light" | "dark") {
  switch (value) {
    case "present":
      return variant === "dark"
        ? { bg: "bg-green-400", text: "text-white", iconColor: "#ffffff" }
        : { bg: "bg-green-100", text: "text-green-700", iconColor: "#15803d" };
    case "absent":
      return variant === "dark"
        ? { bg: "bg-red-400", text: "text-white", iconColor: "#ffffff" }
        : { bg: "bg-red-100", text: "text-red-700", iconColor: "#b91c1c" };
    case "cancelled":
      return variant === "dark"
        ? { bg: "bg-gray-400", text: "text-white", iconColor: "#ffffff" }
        : { bg: "bg-gray-200", text: "text-gray-700", iconColor: "#374151" };
    default:
      return { bg: "", text: "", iconColor: "" };
  }
}

export default function AttendanceActions({
  status,
  onStatusChange,
  variant = "light",
  className,
}: AttendanceActionsProps) {
  const outerBg =
    variant === "dark"
      ? "bg-white/50"
      : "bg-gray-100 border border-neutral-200";
  const defaultText =
    variant === "dark"
      ? "text-black/80 active:text-white/70"
      : "text-text-secondary";
  const defaultIcon = variant === "dark" ? "#000" : "#5f8a85";

  return (
    <View
      className={`flex-row ${outerBg} rounded-xl p-1 ${className ?? ""}`}
      style={{ overflow: "hidden" }}
    >
      {OPTIONS.map(({ value, label, icon: Icon }, index) => {
        const isSelected = status === value;
        const selected = getSelectedStyles(value, variant);

        return (
          <TouchableOpacity
            key={value}
            onPress={() => onStatusChange(isSelected ? null : value)}
            className={`flex-1 flex-row items-center justify-center py-1 ${
              isSelected ? selected.bg : ""
            } ${isSelected ? "rounded-lg" : ""}`}
            activeOpacity={0.7}
          >
            <Icon
              size={11}
              color={isSelected ? selected.iconColor : defaultIcon}
            />
            <Text
              className={`text-xs font-medium ml-1 ${
                isSelected ? selected.text : defaultText
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
