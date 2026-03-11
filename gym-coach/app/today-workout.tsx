import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  WorkoutTimer,
  WorkoutProgress,
  ExerciseCard,
} from "@/app/components/Workout";

const WORKOUT_PLAN_KEY = "active_workout_plan";
const WORKOUT_HISTORY_KEY = "workout_history";

type ExerciseData = {
  exercise_id: number;
  name: string;
  target_muscles: string | null;
  prescription: { sets: number; reps: number };
};

type DayData = {
  plan_day_id: number;
  day_number: number;
  day_label: string;
  exercises: ExerciseData[];
};

type PlanData = {
  plan: { plan_id: number; name: string };
  day: DayData;
};

export type WorkoutHistoryEntry = {
  date: string;
  workoutId: string;
  totalDuration: number;
  exercisesCompleted: number;
  setsCompleted: number;
  workoutName?: string;
};

export default function TodayWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planJson?: string }>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});

  const day = plan?.day;
  const exercises = day?.exercises ?? [];
  const totalSets = exercises.reduce(
    (sum, ex) => sum + (ex.prescription?.sets ?? 0),
    0
  );
  const setsCompletedCount = Object.values(completedSets).flat().filter(Boolean).length;
  const allSetsDone = totalSets > 0 && setsCompletedCount >= totalSets;

  useEffect(() => {
    const loadPlan = async () => {
      try {
        if (params.planJson) {
          const parsed = JSON.parse(params.planJson as string) as PlanData;
          setPlan(parsed);
        } else {
          const stored = await AsyncStorage.getItem(WORKOUT_PLAN_KEY);
          if (stored) setPlan(JSON.parse(stored) as PlanData);
        }
      } catch (e) {
        console.warn("Failed to load workout plan", e);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [params.planJson]);

  useEffect(() => {
    if (!workoutStarted || workoutCompleted) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [workoutStarted, workoutCompleted]);

  useEffect(() => {
    if (!allSetsDone || workoutCompleted) return;
    setWorkoutCompleted(true);
    setTotalDurationSeconds(elapsedSeconds);
    const workoutId = `${plan?.plan?.plan_id ?? "unknown"}-${day?.plan_day_id ?? "unknown"}`;
    const entry: WorkoutHistoryEntry = {
      date: new Date().toISOString(),
      workoutId,
      totalDuration: elapsedSeconds,
      exercisesCompleted: exercises.length,
      setsCompleted: totalSets,
      workoutName: plan?.plan?.name,
    };
    AsyncStorage.getItem(WORKOUT_HISTORY_KEY).then((raw) => {
      const history: WorkoutHistoryEntry[] = raw ? JSON.parse(raw) : [];
      AsyncStorage.setItem(
        WORKOUT_HISTORY_KEY,
        JSON.stringify([entry, ...history].slice(0, 200))
      );
    });
  }, [allSetsDone, workoutCompleted, elapsedSeconds, plan, day, exercises.length, totalSets]);

  const handleSetToggle = useCallback((exerciseId: number, setIndex: number) => {
    setCompletedSets((prev) => {
      const arr = prev[String(exerciseId)] ?? [];
      const next = [...arr];
      while (next.length <= setIndex) next.push(false);
      next[setIndex] = !next[setIndex];
      return { ...prev, [String(exerciseId)]: next };
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (!plan || !day) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No workout selected</Text>
        <Text style={styles.emptySub}>Start from Home by tapping Today's Workout.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  if (workoutCompleted) {
    const m = Math.floor(totalDurationSeconds / 60);
    const s = totalDurationSeconds % 60;
    const timeStr = `${m} min ${s} s`;
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedCard}>
          <View style={styles.completedIconWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.completedTitle}>Workout Completed</Text>
          <Text style={styles.completedTime}>{timeStr}</Text>
          <Text style={styles.completedMeta}>
            {exercises.length} exercises · {totalSets} sets
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              AsyncStorage.removeItem(WORKOUT_PLAN_KEY);
              router.replace("/(tabs)/home");
            }}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/past-workouts")}
          >
            <Text style={styles.secondaryButtonText}>View History</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!workoutStarted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Today's Workout</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.planName}>{plan.plan.name}</Text>
          <Text style={styles.overviewMeta}>
            {exercises.length} exercises · {totalSets} total sets
          </Text>
          <View style={styles.exerciseList}>
            {exercises.map((ex) => (
              <View key={ex.exercise_id} style={styles.exerciseRow}>
                <View style={styles.bullet} />
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.setMeta}>
                  {ex.prescription?.sets ?? 0} sets × {ex.prescription?.reps ?? 0} reps
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => setWorkoutStarted(true)}
          >
            <Text style={styles.primaryButtonText}>Start Exercise</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>{plan.plan.name}</Text>
      </View>
      <WorkoutTimer elapsedSeconds={elapsedSeconds} isRunning={!workoutCompleted} />
      <WorkoutProgress
        setsCompleted={setsCompletedCount}
        totalSets={totalSets}
        exercisesCompleted={exercises.filter((ex) => {
          const arr = completedSets[String(ex.exercise_id)] ?? [];
          const sets = ex.prescription?.sets ?? 0;
          return Array.from({ length: sets }, (_, i) => arr[i]).every(Boolean);
        }).length}
        totalExercises={exercises.length}
      />
      <View style={styles.cards}>
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.exercise_id}
            name={ex.name}
            prescription={ex.prescription ?? { sets: 0, reps: 0 }}
            targetMuscles={ex.target_muscles}
            completedSets={completedSets[String(ex.exercise_id)] ?? []}
            onSetToggle={(i) => handleSetToggle(ex.exercise_id, i)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6B7280" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  emptySub: { marginTop: 8, fontSize: 14, color: "#6B7280", textAlign: "center" },
  backBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: "#6366F1", borderRadius: 12 },
  backBtnText: { color: "#fff", fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerBack: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  overviewCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  planName: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  overviewMeta: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  exerciseList: { marginBottom: 24 },
  exerciseRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6366F1", marginRight: 10 },
  exerciseName: { flex: 1, fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
  setMeta: { fontSize: 13, color: "#6B7280" },
  primaryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: { marginTop: 12, paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { color: "#6366F1", fontSize: 15, fontWeight: "600" },
  cards: { paddingHorizontal: 16, paddingTop: 8 },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 24,
  },
  completedCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  completedIconWrap: { marginBottom: 16 },
  completedTitle: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  completedTime: { fontSize: 32, fontWeight: "700", color: "#10B981", marginBottom: 4 },
  completedMeta: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
});
