import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Number of weeks to render in each direction from the current week
const WEEKS_BUFFER = 26;
const TOTAL_WEEKS = WEEKS_BUFFER * 2 + 1;
const CENTER_INDEX = WEEKS_BUFFER;

interface WeekDaySelectorProps {
  selectedDate: Date;
  weekOffset: number;
  onSelectDate: (date: Date) => void;
  onWeekChange: (offset: number) => void;
  className?: string;
}

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - currentDay + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function WeekRow({
  weekOffset,
  selectedDate,
  onSelectDate,
  width,
}: {
  weekOffset: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  width: number;
}) {
  const dates = getWeekDates(weekOffset);
  const today = new Date();

  return (
    <View style={{ width }} className="flex-row justify-between px-4">
      {dates.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, today);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => onSelectDate(date)}
            className={`items-center py-2 px-3 font-medium rounded-xl ${
              isSelected ? "bg-[#ff7648]" : isToday ? "#ff7648/20" : ""
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-medium mb-0 ${
                isSelected ? "text-white" : "text-text-muted"
              }`}
            >
              {DAY_LABELS[index]}
            </Text>
            <Text
              className={`text-md font-semibold ${
                isSelected
                  ? "text-white"
                  : isToday
                    ? "text-primary-700"
                    : "text-text"
              }`}
            >
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function WeekDaySelector({
  selectedDate,
  weekOffset,
  onSelectDate,
  onWeekChange,
  className,
}: WeekDaySelectorProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(CENTER_INDEX);

  const weekOffsets = React.useMemo(
    () => Array.from({ length: TOTAL_WEEKS }, (_, i) => i - WEEKS_BUFFER),
    [],
  );

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
      if (newIndex !== currentIndexRef.current) {
        currentIndexRef.current = newIndex;
        const newOffset = newIndex - WEEKS_BUFFER;
        onWeekChange(newOffset);
      }
    },
    [width, onWeekChange],
  );

  const goToPrevWeek = useCallback(() => {
    const newIndex = currentIndexRef.current - 1;
    if (newIndex >= 0) {
      currentIndexRef.current = newIndex;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      onWeekChange(newIndex - WEEKS_BUFFER);
    }
  }, [onWeekChange]);

  const goToNextWeek = useCallback(() => {
    const newIndex = currentIndexRef.current + 1;
    if (newIndex < TOTAL_WEEKS) {
      currentIndexRef.current = newIndex;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      onWeekChange(newIndex - WEEKS_BUFFER);
    }
  }, [onWeekChange]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <WeekRow
        weekOffset={item}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        width={width}
      />
    ),
    [selectedDate, onSelectDate, width],
  );

  return (
    <View className={className}>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={goToPrevWeek}
          className="pl-2 pr-1 py-2"
          activeOpacity={0.6}
        >
          <ChevronLeft size={18} color="#5f8a85" />
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={weekOffsets}
          renderItem={renderItem}
          keyExtractor={(item) => String(item)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={CENTER_INDEX}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          className="flex-1"
        />

        <TouchableOpacity
          onPress={goToNextWeek}
          className="pr-2 pl-1 py-2"
          activeOpacity={0.6}
        >
          <ChevronRight size={18} color="#5f8a85" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
