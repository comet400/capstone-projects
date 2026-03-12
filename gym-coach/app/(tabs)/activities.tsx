import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/app/context/ThemeContext";

export default function ActivitiesScreen() {
  const { colors } = useTheme();

  const weeklyGoal = 4;
  const completedWorkouts = 3;
  const progressPercentage = (completedWorkouts / weeklyGoal) * 100;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Activities</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose what to train</Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Groups</Text>

      <View style={styles.grid}>
        <MuscleCard label="Biceps"    icon="arm-flex"         colors={colors} />
        <MuscleCard label="Chest"     icon="dumbbell"         colors={colors} />
        <MuscleCard label="Shoulders" icon="weight-lifter"    colors={colors} />
        <MuscleCard label="Back"      icon="rowing"           colors={colors} />
        <MuscleCard label="Triceps"   icon="arm-flex-outline" colors={colors} />
        <MuscleCard label="Legs"      icon="run"              colors={colors} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Goal</Text>

      <View style={[styles.goalCard, { backgroundColor: colors.surface }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>
            {completedWorkouts} / {weeklyGoal} Workouts Completed
          </Text>
          <MaterialCommunityIcons name="target" size={22} color="#2AA8FF" />
        </View>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.background }]}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercentage}%` as any }]}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>

      <ActivityCard
        title="Upper Body Strength"
        duration="45 min"
        calories="320 kcal"
        day="Today"
        colors={colors}
      />
      <ActivityCard
        title="HIIT Cardio"
        duration="30 min"
        calories="280 kcal"
        day="Yesterday"
        colors={colors}
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested For You</Text>

      <Pressable style={[styles.suggestionCard, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="arm-flex" size={28} color="#2AA8FF" />
        <View style={{ marginLeft: 14 }}>
          <Text style={[styles.suggestionTitle, { color: colors.text }]}>Arm Focused Workout</Text>
          <Text style={[styles.suggestionSub, { color: colors.textSecondary }]}>35 min · Strength</Text>
        </View>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function MuscleCard({
  label,
  icon,
  colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.muscleCard,
        { backgroundColor: colors.surface },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={36} color="#2AA8FF" />
      <Text style={[styles.muscleLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function ActivityCard({
  title,
  duration,
  calories,
  day,
  colors,
}: {
  title: string;
  duration: string;
  calories: string;
  day: string;
  colors: any;
}) {
  return (
    <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
      <View>
        <Text style={[styles.activityTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
          {duration} · {calories}
        </Text>
      </View>
      <Text style={[styles.activityDay, { color: colors.textSecondary }]}>{day}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },

  title: { marginTop: 60, fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 14 },
  sectionTitle: { marginTop: 24, marginBottom: 14, fontSize: 17, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  muscleCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  muscleLabel: { marginTop: 10, fontSize: 14, fontWeight: "600" },

  goalCard: { borderRadius: 20, padding: 18, marginBottom: 6 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalTitle: { fontSize: 15, fontWeight: "600" },
  progressBarBackground: { marginTop: 14, height: 10, borderRadius: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#2AA8FF", borderRadius: 10 },

  activityCard: {
    borderRadius: 18, padding: 16, marginBottom: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  activityTitle: { fontSize: 15, fontWeight: "600" },
  activityMeta: { marginTop: 4, fontSize: 12 },
  activityDay: { fontSize: 12 },

  suggestionCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, padding: 16,
  },
  suggestionTitle: { fontSize: 15, fontWeight: "600" },
  suggestionSub: { marginTop: 4, fontSize: 12 },
});
