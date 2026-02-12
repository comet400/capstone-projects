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




export default function ActivitiesScreen() {
  const weeklyGoal = 4;
  const completedWorkouts = 3;

  const progressPercentage = (completedWorkouts / weeklyGoal) * 100;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      
      <Text style={styles.title}>Activities</Text>
      <Text style={styles.subtitle}>Choose what to train</Text>

      
      <Text style={styles.sectionTitle}>Muscle Groups</Text>

      <View style={styles.grid}>
        <MuscleCard label="Biceps" icon="arm-flex" />
        <MuscleCard label="Chest" icon="dumbbell" />
        <MuscleCard label="Shoulders" icon="weight-lifter" />

        <MuscleCard label="Back" icon="rowing" />
        <MuscleCard label="Triceps" icon="arm-flex-outline" />
        <MuscleCard label="Legs" icon="run" />
      </View>

      

      <Text style={styles.sectionTitle}>Weekly Goal</Text>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>

          <Text style={styles.goalTitle}>
            {completedWorkouts} / {weeklyGoal} Workouts Completed
          </Text>

          <MaterialCommunityIcons
            name="target"
            size={22}
            color={Colors.primary}
          />
        </View>

        <View style={styles.progressBarBackground}>

          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>

      
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
    
    marginBottom: 14,
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text,
  },


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

  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 6,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  goalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.text,
  },

  progressBarBackground: {
    marginTop: 14,
    height: 10,borderRadius: 10, backgroundColor: Colors.background,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },






  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,


    padding: 16,
    marginBottom: 12, flexDirection: "row",

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
