import React from "react";
import { Tabs, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "../../components/haptic-tab";
import { Colors, Typography, IconSizes } from "@/constants/design";
import { useTheme } from "@/app/context/ThemeContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isCamera = pathname === "/camera";
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActiveTint,
        tabBarInactiveTintColor: colors.tabBarInactiveTint,
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
            bottom: 0,
            height: 74 + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: colors.tabBar,
            borderColor: colors.tabBarBorder,
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
              colors={colors}
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
              colors={colors}
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
            isCamera ? null : <CameraTabIcon focused={focused} colors={colors} />,
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
              colors={colors}
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
              colors={colors}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, focused, colors }: { name: string; focused: boolean; colors: any }) {
  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.iconPill} />}
      <Ionicons
        name={name as any}
        size={22}
        color={focused ? colors.iconHighlight : colors.iconDefault}
      />
    </View>
  );
}

function CameraTabIcon({ focused, colors }: { focused: boolean; colors: any }) {
  return (
    <View style={styles.cameraWrap}>
      <View style={[styles.cameraRing, focused && styles.cameraRingActive, { borderColor: colors.isDark ? '#888888' : '#525252' }]}>
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
    left: 0,
    right: 0,
    height: 74,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: "#171C1D",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
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