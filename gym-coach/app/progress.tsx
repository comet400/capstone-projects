import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "@/constants/design";

export default function ProgressScreen() {
  const weeklyGoal = 4;
  const completed = 3;
  const progress = (completed / weeklyGoal) * 100;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>
        Track your performance
      </Text>

      {/* Weekly Summary */}
      <Text style={styles.sectionTitle}>
        Weekly Overview
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>
            {completed} / {weeklyGoal} Workouts
          </Text>

          <MaterialCommunityIcons
            name="chart-line"
            size={22}
            color={Colors.primary}
          />
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress}%` },
            ]}
          />
        </View>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>
        Your Stats
      </Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="fire"
          label="Calories"
          value="2,140"
        />
        <StatCard
          icon="clock-outline"
          label="Minutes"
          value="180"
        />
        <StatCard
          icon="arm-flex"
          label="Workouts"
          value="12"
        />
        <StatCard
          icon="trophy-outline"
          label="Streak"
          value="6 Days"
        />
      </View>

      {/* Personal Records */}
      <Text style={styles.sectionTitle}>
        Personal Records
      </Text>

      <RecordCard
        exercise="Bench Press"
        record="90 kg"
      />
      <RecordCard
        exercise="Squats"
        record="120 kg"
      />

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons
        name={icon}
        size={28}
        color={Colors.primary}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RecordCard({
  exercise,
  record,
}: {
  exercise: string;
  record: string;
}) {
  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordExercise}>
        {exercise}
      </Text>
      <Text style={styles.recordValue}>
        {record}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },

  title: {
    marginTop: 60,
    fontSize: Typography.sizes.xl,
    fontWeight: "800",
    color: Colors.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  sectionTitle: {
    marginTop: 32,
    marginBottom: 14,
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text,
  },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.text,
  },

  progressBarBackground: {
    marginTop: 14,
    height: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },

  statValue: {
    marginTop: 12,
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text,
  },

  statLabel: {
    marginTop: 4,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },

  recordCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  recordExercise: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.text,
  },

  recordValue: {
    fontSize: Typography.sizes.md,
    fontWeight: "700",
    color: Colors.primary,
  },
});
