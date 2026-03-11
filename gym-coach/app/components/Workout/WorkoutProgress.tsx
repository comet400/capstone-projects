import React from "react";
import { View, Text, StyleSheet } from "react-native";

type WorkoutProgressProps = {
  setsCompleted: number;
  totalSets: number;
  exercisesCompleted?: number;
  totalExercises?: number;
};

export function WorkoutProgress({
  setsCompleted,
  totalSets,
  exercisesCompleted = 0,
  totalExercises = 0,
}: WorkoutProgressProps) {
  const progress = totalSets > 0 ? setsCompleted / totalSets : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.count}>
          {setsCompleted} / {totalSets} sets
        </Text>
        {totalExercises > 0 && (
          <Text style={styles.count}>
            {exercisesCompleted} / {totalExercises} exercises
          </Text>
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  count: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 4,
  },
});
