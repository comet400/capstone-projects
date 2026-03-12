import React from "react";
import { View, Text, StyleSheet } from "react-native";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type WorkoutTimerProps = {
  elapsedSeconds: number;
  isRunning: boolean;
};

export function WorkoutTimer({ elapsedSeconds, isRunning }: WorkoutTimerProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.badge, isRunning && styles.badgeActive]}>
        <Text style={styles.label}>{isRunning ? "In progress" : "Paused"}</Text>
      </View>
      <Text style={styles.time}>{formatTime(elapsedSeconds)}</Text>
      <Text style={styles.sublabel}>Total time</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
  },
  badge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeActive: {
    backgroundColor: "#10B981",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  time: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A1A1A",
    fontVariant: ["tabular-nums"],
  },
  sublabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
