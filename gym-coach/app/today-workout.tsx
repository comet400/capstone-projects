import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  WorkoutTimer,
  WorkoutProgress,
  ExerciseCard,
} from "@/app/components/Workout";
import { useWorkout } from "@/app/context/WorkoutContext";

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
  const { activeWorkout, startWorkout, pauseWorkout, resumeWorkout, completeSet, finishWorkout, isWorkoutActive, setShowMiniPlayer } = useWorkout();
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
  
  // Use either local state or global context for completed sets
  const actualCompletedSets = activeWorkout ? activeWorkout.completedSets : completedSets;
  const actualElapsedSeconds = activeWorkout ? activeWorkout.elapsedSeconds : elapsedSeconds;
  const actualIsPaused = activeWorkout ? activeWorkout.isPaused : false;
  
  const setsCompletedCount = Object.values(actualCompletedSets).flat().filter(Boolean).length;
  const allSetsDone = totalSets > 0 && setsCompletedCount >= totalSets;

  useEffect(() => {
    const loadPlan = async () => {
      try {
        let planData: PlanData | null = null;
        
        if (params.planJson) {
          planData = JSON.parse(params.planJson as string) as PlanData;
          setPlan(planData);
        } else {
          const stored = await AsyncStorage.getItem(WORKOUT_PLAN_KEY);
          if (stored) {
            planData = JSON.parse(stored) as PlanData;
            setPlan(planData);
          }
        }
        
        // If we have an active workout, sync state
        if (activeWorkout && planData && activeWorkout.plan.plan_id === planData.plan.plan_id) {
          setWorkoutStarted(true);
        }
      } catch (e) {
        console.warn("Failed to load workout plan", e);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [params.planJson, activeWorkout]);

  // Handle timer from context
  useEffect(() => {
    if (!workoutStarted || workoutCompleted) return;
    
    // If we have an active workout from context, use that timer
    if (activeWorkout) {
      // Timer is handled by context
      return;
    }
    
    // Local timer fallback
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [workoutStarted, workoutCompleted, activeWorkout]);

  // Handle workout completion
  useEffect(() => {
    if (!allSetsDone || workoutCompleted) return;
    
    setWorkoutCompleted(true);
    const finalDuration = actualElapsedSeconds;
    setTotalDurationSeconds(finalDuration);
    
    const workoutId = `${plan?.plan?.plan_id ?? "unknown"}-${day?.plan_day_id ?? "unknown"}`;
    const entry: WorkoutHistoryEntry = {
      date: new Date().toISOString(),
      workoutId,
      totalDuration: finalDuration,
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
    
    // Finish workout in context
    if (activeWorkout) {
      finishWorkout();
    }
  }, [allSetsDone, workoutCompleted, actualElapsedSeconds, plan, day, exercises.length, totalSets, activeWorkout, finishWorkout]);

  const handleSetToggle = useCallback((exerciseId: number, setIndex: number) => {
    if (activeWorkout) {
      // Use global context
      completeSet(exerciseId, setIndex);
    } else {
      // Local state fallback
      setCompletedSets((prev) => {
        const arr = prev[String(exerciseId)] ?? [];
        const next = [...arr];
        while (next.length <= setIndex) next.push(false);
        next[setIndex] = !next[setIndex];
        return { ...prev, [String(exerciseId)]: next };
      });
    }
  }, [activeWorkout, completeSet]);

  const handleStartWorkout = () => {
    if (plan) {
      startWorkout(plan.plan, plan.day);
      setWorkoutStarted(true);
    }
  };

  const handleBackPress = () => {
  if (workoutStarted && !workoutCompleted && activeWorkout) {
    // Workout in progress, show mini-player and go back immediately
    setShowMiniPlayer(true);
    router.back();
  } else {
    // All other cases just go back
    router.back();
  }
};

  const handlePauseResume = () => {
    if (activeWorkout) {
      if (activeWorkout.isPaused) {
        resumeWorkout();
      } else {
        pauseWorkout();
      }
    }
  };

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
          <Pressable onPress={handleBackPress} style={styles.headerBack}>
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
            onPress={handleStartWorkout}
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
        <Pressable onPress={handleBackPress} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>{plan.plan.name}</Text>
        {activeWorkout && (
          <Pressable onPress={handlePauseResume} style={styles.pauseButton}>
            <Ionicons 
              name={activeWorkout.isPaused ? "play" : "pause"} 
              size={24} 
              color="#6366F1" 
            />
          </Pressable>
        )}
      </View>
      <WorkoutTimer 
        elapsedSeconds={actualElapsedSeconds} 
        isRunning={workoutStarted && !workoutCompleted && activeWorkout ? !activeWorkout.isPaused : true} 
      />
      <WorkoutProgress
        setsCompleted={setsCompletedCount}
        totalSets={totalSets}
        exercisesCompleted={exercises.filter((ex) => {
          const arr = actualCompletedSets[String(ex.exercise_id)] ?? [];
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
            completedSets={actualCompletedSets[String(ex.exercise_id)] ?? []}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerBack: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", flex: 1 },
  pauseButton: { padding: 8 },
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