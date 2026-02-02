import React from "react";
import { Tabs } from "expo-router";
import { View, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS = {
  home: require("@/assets/images/layout/tab-home.png"),
  activities: require("@/assets/images/layout/tab-activities.png"),
  workouts: require("@/assets/images/layout/tab-workout.png"),
  profile: require("@/assets/images/layout/tab-profile.png"),
  camera: require("@/assets/images/layout/camera.png"),
};


export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2AA8FF",
        tabBarInactiveTintColor: "#FFFFFF",
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
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.home} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="activities"
        options={{
          title: "Activities",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.activities} focused={focused} />
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
            <TabIcon source={ICONS.workouts} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon source={ICONS.profile} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ source, focused }: { source: any; focused: boolean }) {
  return (
    <Image
      source={source}
      style={[
        styles.icon,
        { opacity: focused ? 1 : 0.65 },
      ]}
      resizeMode="contain"
    />
  );
}

function CameraTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.cameraWrap}>
      <View style={styles.cameraRing}>
        <View style={styles.cameraInner}>
          <Image
            source={ICONS.camera}
            style={[
              styles.cameraIcon,
              { opacity: focused ? 1 : 0.65 },
            ]}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Optional badge later (ads / plan)
      <View style={styles.badgeDot} />
      */}
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

  icon: {
    width: 22,
    height: 22,
    marginBottom: 2,
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
  },
  cameraInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    width: 26,
    height: 26,
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
