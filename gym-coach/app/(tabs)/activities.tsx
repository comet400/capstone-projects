import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "@/constants/design";

/* ---------------- Screen ---------------- */

export default function ActivitiesScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={styles.title}>Activities</Text>
      <Text style={styles.subtitle}>Choose what to train</Text>

      {/* Muscle Groups */}
      <Text style={styles.sectionTitle}>Muscle Groups</Text>

      <View style={styles.grid}>
        <MuscleCard label="Biceps" icon="arm-flex" />
        <MuscleCard label="Chest" icon="dumbbell" />
        <MuscleCard label="Shoulders" icon="weight-lifter" />
        <MuscleCard label="Back" icon="rowing" />
        <MuscleCard label="Triceps" icon="arm-flex-outline" />
        <MuscleCard label="Legs" icon="run" />
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <ActivityCard
        title="Upper Body Strength"
        duration="45 min"
        calories="320 kcal"
        day="Today"
      />
      <ActivityCard
        title="HIIT Cardio"
        duration="30 min"
        calories="280 kcal"
        day="Yesterday"
      />

      {/* Suggested */}
      <Text style={styles.sectionTitle}>Suggested For You</Text>

      <Pressable style={styles.suggestionCard}>
        <MaterialCommunityIcons
          name="arm-flex"
          size={28}
          color={Colors.primary}
        />
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.suggestionTitle}>
            Arm Focused Workout
          </Text>
          <Text style={styles.suggestionSub}>
            35 min · Strength
          </Text>
        </View>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* ---------------- Components ---------------- */

function MuscleCard({
  label,
  icon,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.muscleCard,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={36}
        color={Colors.primary}
      />
      <Text style={styles.muscleLabel}>{label}</Text>
    </Pressable>
  );
}

function ActivityCard({
  title,
  duration,
  calories,
  day,
}: {
  title: string;
  duration: string;
  calories: string;
  day: string;
}) {
  return (
    <View style={styles.activityCard}>
      <View>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityMeta}>
          {duration} · {calories}
        </Text>
      </View>
      <Text style={styles.activityDay}>{day}</Text>
    </View>
  );
}

/* ---------------- Styles ---------------- */

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
    marginTop: 5,
    marginBottom: 14,
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text,
  },

  /* Muscle Grid */

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  muscleCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  muscleLabel: {
    marginTop: 10,
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.text,
  },

  /* Activity */

  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activityTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.text,
  },

  activityMeta: {
    marginTop: 4,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },

  activityDay: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },

  /* Suggested */

  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
  },

  suggestionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.text,
  },

  suggestionSub: {
    marginTop: 4,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
});
