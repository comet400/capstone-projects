import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SetCheckbox } from "./SetCheckbox";

export type ExercisePrescription = {
  sets: number;
  reps: number;
  duration_seconds?: number;
  rest_seconds?: number;
};

type ExerciseCardProps = {
  name: string;
  prescription: ExercisePrescription;
  targetMuscles?: string | null;
  completedSets: boolean[];
  onSetToggle: (setIndex: number) => void;
};

export function ExerciseCard({
  name,
  prescription,
  targetMuscles,
  completedSets,
  onSetToggle,
}: ExerciseCardProps) {
  const sets = prescription.sets || 0;
  const reps = prescription.reps || 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        {targetMuscles && (
          <Text style={styles.meta} numberOfLines={1}>
            {targetMuscles}
          </Text>
        )}
        <Text style={styles.prescription}>
          {sets} sets × {reps} reps
        </Text>
      </View>
      <View style={styles.sets}>
        {Array.from({ length: sets }, (_, i) => (
          <SetCheckbox
            key={i}
            label={`Set ${i + 1}${reps ? ` • ${reps} reps` : ""}`}
            completed={completedSets[i] ?? false}
            onToggle={() => onSetToggle(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  header: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  prescription: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "600",
  },
  sets: {
    marginLeft: 4,
  },
});
