import React from "react";
import { Tabs, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "../../components/haptic-tab";
import { Colors, Typography, IconSizes } from "@/constants/design";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isCamera = pathname === "/camera";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#171C1D",
        tabBarInactiveTintColor: "#ABABAB",
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: -2,
          marginBottom: 6,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: 14 + insets.bottom,
            height: 74,
          },
        ],
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />

      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
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
          tabBarItemStyle: isCamera ? styles.cameraItemHidden : styles.cameraItem,
          tabBarIcon: ({ focused }) =>
            isCamera ? null : <CameraTabIcon focused={focused} />,
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

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.iconPill} />}
      <Ionicons
        name={name as any}
        size={22}
        color={focused ? "#171C1D" : "#ABABAB"}
      />
    </View>
  );
}

function CameraTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.cameraWrap}>
      <View style={[styles.cameraRing, focused && styles.cameraRingActive]}>
        <View style={[styles.cameraInner, focused && styles.cameraInnerActive]}>
          <Ionicons
            name="camera"
            size={22}
            color={focused ? "#000000" : "#ffffff"}
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
    height: 74,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: "#171C1D",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    // Subtle border to separate from white screen bg
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    position: "relative",
  },

  // Blue dot indicator above focused icon
  iconPill: {
    position: "absolute",
    top: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#2AA8FF",
  },

  // Camera tab sizing
  cameraItem: {
    width: 78,
    overflow: "visible",
  },
  cameraItemHidden: {
    width: 0,
    overflow: "hidden",
    opacity: 0,
  },

  // Camera FAB
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
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#adadad",
    shadowColor: "#171C1D",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cameraRingActive: {
    borderColor: "#2AA8FF",
    shadowColor: "#2AA8FF",
    shadowOpacity: 0.25,
    transform: [{ scale: 1.05 }],
  },
  cameraInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#171C1D",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraInnerActive: {
    backgroundColor: "#2AA8FF",
  },
});