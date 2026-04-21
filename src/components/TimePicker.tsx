import React, { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Clock } from "lucide-react-native";

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  placeholder?: string;
}

function parseTime(timeStr: string): Date {
  const d = new Date();
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function TimePicker({ value, onChange, placeholder = "Select time" }: TimePickerProps) {
  const [show, setShow] = useState(false);

  function handleChange(_: DateTimePickerEvent, selected?: Date) {
    setShow(false);
    if (selected) onChange(formatTime(selected));
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShow(true)}
        activeOpacity={0.7}
        className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 flex-row items-center justify-between"
      >
        <Text className={`text-sm ${value ? "text-text" : "text-[#bcc1cd]"}`}>
          {value || placeholder}
        </Text>
        <Clock size={14} color="#bcc1cd" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={parseTime(value)}
          mode="time"
          is24Hour
          display="default"
          onChange={handleChange}
        />
      )}
    </>
  );
}
