import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2AA8FF",
        tabBarInactiveTintColor: "#9B9B9B",
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: -2,
          marginBottom: 6,
          fontWeight: "600",
        },
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: 14 + insets.bottom,
            paddingBottom: 8,
            height: 74 + insets.bottom,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="activities"
        options={{
          title: "Activities",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "calendar" : "calendar-outline"}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: "",
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <CameraTabIcon focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workout",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "barbell" : "barbell-outline"}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  focused,
}: {
  name: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={name as any}
        size={24}
        color={focused ? "#2AA8FF" : "#9B9B9B"}
      />
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

function CameraTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.cameraWrap}>
      <View style={[styles.cameraRing, focused && styles.cameraRingActive]}>
        <View style={styles.cameraInner}>
          <Ionicons
            name="camera"
            size={24}
            color={focused ? "#0D0F10" : "#9B9B9B"}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    height: 74,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 32,
    height: 32,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2AA8FF",
  },

  cameraWrap: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
  },
  cameraRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#BFFF5A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#BFFF5A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cameraRingActive: {
    backgroundColor: "#BFFF5A",
    shadowOpacity: 0.5,
    transform: [{ scale: 1.05 }],
  },
  cameraInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeDot: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
});
