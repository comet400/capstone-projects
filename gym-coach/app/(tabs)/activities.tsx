import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/app/context/ThemeContext";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import { getDayType, getDayFocus } from "@/app/lib/ppl-cycle";
import { PPL_WEEK_PLAN_KEY, type PPLWeekPlan } from "@/app/(tabs)/home";

type WorkoutRow = {
  id: number;
  exercise_type: string;
  duration_seconds: number;
  overall_score: number;
  grade: string;
  total_reps: number;
  performance_tier: string;
  created_at: string;
};

type Overview = {
  weeklyProgress: number;
  totalMinutes: number;
  totalCalories: number;
  workoutsCompleted: number;
  streak: number;
};

export default function ActivitiesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [weekPlan, setWeekPlan] = useState<PPLWeekPlan | null>(null);

  // Weekly goal – default to 4 if no plan
  const weeklyGoal = weekPlan ? 3 : 4; // PPL is 3 days/week
  const completedWorkouts = overview?.workoutsCompleted ?? 0;
  const progressPercentage = weeklyGoal > 0 ? (completedWorkouts / weeklyGoal) * 100 : 0;

  // Fetch all data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Fetch overview
      const overviewRes = await axios.get(`${API_BASE_URL}/api/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(overviewRes.data);

      // Fetch workouts (get last 3)
      const workoutsRes = await axios.get(`${API_BASE_URL}/api/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allWorkouts: WorkoutRow[] = workoutsRes.data;
      // Sort by newest first and take 3
      const sorted = allWorkouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setWorkouts(sorted.slice(0, 3));

      // Fetch stored week plan
      const storedPlan = await AsyncStorage.getItem(PPL_WEEK_PLAN_KEY);
      if (storedPlan) {
        setWeekPlan(JSON.parse(storedPlan));
      }
    } catch (error) {
      console.log("Error fetching activities data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Tomorrow's workout for suggestion
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowType = getDayType(tomorrowDate);
  const tomorrowFocus = getDayFocus(tomorrowDate);
  const tomorrowIsRest = tomorrowType === "Rest";
  const tomorrowTitle = tomorrowIsRest ? "Rest day" : `${tomorrowType} day`;
  const tomorrowMeta = tomorrowIsRest
    ? "Recovery · Light stretch or rest"
    : tomorrowFocus.muscleGroups.join(", ");

  // Handlers
  const handleMusclePress = (muscle: string) => {
    // TODO: Navigate to exercise list filtered by muscle
    console.log(`Filter by ${muscle}`);
  };

  const handleSuggestionPress = () => {
    if (!tomorrowIsRest) {
      router.push({
        pathname: "/day-preview",
        params: { date: tomorrowDate.toISOString() },
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2AA8FF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your activity…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#2AA8FF" />
      }
    >
      <Text style={[styles.title, { color: colors.text }]}>Activities</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose what to train</Text>

      {/* Muscle Groups (static for now, but pressable) */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Groups</Text>
      <View style={styles.grid}>
        <MuscleCard label="Biceps" icon="arm-flex" colors={colors} onPress={() => handleMusclePress("Biceps")} />
        <MuscleCard label="Chest" icon="dumbbell" colors={colors} onPress={() => handleMusclePress("Chest")} />
        <MuscleCard label="Shoulders" icon="weight-lifter" colors={colors} onPress={() => handleMusclePress("Shoulders")} />
        <MuscleCard label="Back" icon="rowing" colors={colors} onPress={() => handleMusclePress("Back")} />
        <MuscleCard label="Triceps" icon="arm-flex-outline" colors={colors} onPress={() => handleMusclePress("Triceps")} />
        <MuscleCard label="Legs" icon="run" colors={colors} onPress={() => handleMusclePress("Legs")} />
      </View>

      {/* Weekly Goal */}
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
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` as any, backgroundColor: "#2AA8FF" },
            ]}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
      {workouts.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workouts recorded yet. Start your first session!
          </Text>
        </View>
      ) : (
        workouts.map((workout) => (
          <ActivityCard
            key={workout.id}
            title={workout.exercise_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            duration={`${Math.round(workout.duration_seconds / 60)} min`}
            calories="—" // Not available from this endpoint; could be added later
            day={new Date(workout.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            colors={colors}
            onPress={() => router.push({ pathname: "/workout-summary", params: { workoutId: workout.id } })}
          />
        ))
      )}

      {/* Suggested For You – based on tomorrow's PPL */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested For You</Text>
      <Pressable
        style={[styles.suggestionCard, { backgroundColor: colors.surface }]}
        onPress={handleSuggestionPress}
        disabled={tomorrowIsRest}
      >
        <MaterialCommunityIcons
          name={tomorrowIsRest ? "bed" : tomorrowType === "Push" ? "arm-flex" : tomorrowType === "Pull" ? "arrow-expand-vertical" : "run"}
          size={28}
          color="#2AA8FF"
        />
        <View style={{ marginLeft: 14 }}>
          <Text style={[styles.suggestionTitle, { color: colors.text }]}>{tomorrowTitle}</Text>
          <Text style={[styles.suggestionSub, { color: colors.textSecondary }]}>{tomorrowMeta}</Text>
        </View>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// MuscleCard with onPress
function MuscleCard({
  label,
  icon,
  colors,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.muscleCard,
        { backgroundColor: colors.surface },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={36} color="#2AA8FF" />
      <Text style={[styles.muscleLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

// ActivityCard 
function ActivityCard({
  title,
  duration,
  calories,
  day,
  colors,
  onPress,
}: {
  title: string;
  duration: string;
  calories: string;
  day: string;
  colors: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.activityCard,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.9 },
      ]}
      onPress={onPress}
    >
      <View>
        <Text style={[styles.activityTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
          {duration} · {calories}
        </Text>
      </View>
      <Text style={[styles.activityDay, { color: colors.textSecondary }]}>{day}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },

  title: { marginTop: 60, fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 14, marginBottom: 10 },
  sectionTitle: { marginTop: 14, marginBottom: 10, fontSize: 17, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  muscleCard: {
    width: "48%",
    aspectRatio: 1.4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  muscleLabel: { marginTop: 10, fontSize: 14, fontWeight: "600" },

  goalCard: { borderRadius: 20, padding: 18, marginBottom: 6 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalTitle: { fontSize: 15, fontWeight: "600" },
  progressBarBackground: { marginTop: 14, height: 10, borderRadius: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#2AA8FF", borderRadius: 10 },

  activityCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTitle: { fontSize: 15, fontWeight: "600" },
  activityMeta: { marginTop: 4, fontSize: 12 },
  activityDay: { fontSize: 12 },

  emptyCard: { borderRadius: 18, padding: 20, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },

  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
  },
  suggestionTitle: { fontSize: 15, fontWeight: "600" },
  suggestionSub: { marginTop: 4, fontSize: 12 },
});