import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

type WorkoutType = "Upper Body" | "Lower Body" | "Cardio";

const workouts: Record<WorkoutType, string[]> = {
  "Upper Body": ["Bicep Curls", "Push-Ups", "Shoulder Press"],
  "Lower Body": ["Squats", "Lunges", "Deadlifts"],
  Cardio: ["Running", "Jump Rope", "Burpees"],
};

const filters = ["Today", "Week", "All"] as const;
type FilterType = typeof filters[number];

export default function ActivitiesScreen() {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutType>("Upper Body");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("Today");

  const workoutTypes: WorkoutType[] = Object.keys(workouts) as WorkoutType[];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Activities</Text>
      <View style={styles.filters}>
        {filters.map((filter) => (
          <Pressable
            key={filter}
            style={styles.filter}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilter,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>
      {workoutTypes.map((type) => (
        <Pressable
          key={type}
          style={[styles.card, selectedWorkout === type && styles.activeCard]}
          onPress={() => setSelectedWorkout(type)}
        >
          <Text style={styles.cardTitle}>{type}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Exercises</Text>
      {workouts[selectedWorkout].map((exercise) => (
        <Text key={exercise} style={styles.recentItem}>
          {exercise}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 60,
  },
  header: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 26,
    color: "#111827",
    letterSpacing: -0.3,
  },
  filters: {
    flexDirection: "row",
    marginBottom: 26,
  },
  filter: {
    marginRight: 28,
    paddingBottom: 6,
  },
  filterText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
  },
  activeFilter: {
    color: "#EF4444",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  activeCard: {
    borderColor: "#EF4444",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 34,
    marginBottom: 18,
    color: "#1F2937",
  },
  recentItem: {
    fontSize: 15,
    marginBottom: 12,
    color: "#4B5563",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
});
