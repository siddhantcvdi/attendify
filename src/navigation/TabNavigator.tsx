import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Calendar, User, Plus } from "lucide-react-native";
import DashboardScreen from "../screens/DashboardScreen";
import TodayScreen from "../screens/TodayScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AddExtraClassModal from "../components/AddExtraClassModal";
import { useAttendance } from "../context/AttendanceContext";
import { Lecture } from "../data/types";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const Tab = createBottomTabNavigator();

const ICONS: Record<string, typeof Home> = {
  Dashboard: Home,
  Today: Calendar,
  Profile: User,
};

function FloatingTabBar({ state, navigation, onAddPress }: BottomTabBarProps & { onAddPress: () => void }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 14,
        right: 14,
        height: 56,
        backgroundColor: "#ffffff",
        borderRadius: 32,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      {/* Tabs */}
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name];
        const color = focused ? "#0d9488" : "#94a9a6";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: focused ? "rgba(77,197,145,0.12)" : "transparent",
              borderRadius: 28,
              marginHorizontal: 8,
              paddingVertical: 12,
            }}
          >
            <Icon size={20} color={color} />
          </TouchableOpacity>
        );
      })}

      {/* Add button at end */}
      <TouchableOpacity
        onPress={onAddPress}
        activeOpacity={0.85}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#4dc591",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
          shadowColor: "#4dc591",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Plus size={20} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

    </View>
  );
}

export default function TabNavigator() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { addExtraClass } = useAttendance();

  const handleAdd = (lecture: Lecture) => {
    addExtraClass(dateKey(new Date()), lecture);
  };

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => (
          <FloatingTabBar {...props} onAddPress={() => setShowAddModal(true)} />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      <AddExtraClassModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />
    </>
  );
}
