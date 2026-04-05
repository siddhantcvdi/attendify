import React from "react";
import { View, TouchableOpacity } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Calendar, User } from "lucide-react-native";
import DashboardScreen from "../screens/DashboardScreen";
import TodayScreen from "../screens/TodayScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, typeof Home> = {
  Dashboard: Home,
  Today: Calendar,
  Profile: User,
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 14,
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
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name];
        const color = focused ? "#0d9488" : "#94a9a6";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Icon size={20} color={color} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
