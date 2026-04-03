import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { API_BASE_URL } from "@/app/config/api";
import { useAuth } from "@/app/context/AuthContext";
import { ThemeColors, useTheme } from "@/app/context/ThemeContext";
import { getDayFocus, getDayType, type SplitId } from "@/app/lib/split-cycle";
import { SPLIT_WEEK_PLAN_KEY, type SplitWeekPlan } from "./home";

const WORKOUT_HISTORY_KEY = "workout_history";
const CARDIO_ACTIVITIES_KEY = "cardio_activities";
const CALORIE_LEDGER_KEY = "activity_calorie_ledger_v1";
const DEFAULT_WEIGHT_KG = 75;

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

type LocalWorkoutEntry = {
  date: string;
  workoutId: string;
  totalDuration: number;
  exercisesCompleted: number;
  setsCompleted: number;
  workoutName?: string;
  exercises?: Array<{
    exerciseId: number;
    name: string;
    targetMuscles: string | null;
    sets: number;
    reps: number;
    durationSeconds?: number;
    restSeconds?: number;
  }>;
};

type CardioType = "Running" | "Walking" | "Cycling" | "Elliptical" | "Rowing" | "Jump Rope";

type CardioActivity = {
  id: string;
  type: CardioType;
  minutes: number;
  speed: number;
  distanceKm?: number;
  calories: number;
  createdAt: string;
};

type CalorieEntry = {
  id: string;
  source: "camera" | "plan";
  title: string;
  calories: number;
  minutes: number;
  reps: number;
  createdAt: string;
};

type CalorieLedger = {
  entries: CalorieEntry[];
  processedWorkoutIds: string[];
  processedLocalIds: string[];
};

type PeriodKey = "day" | "week" | "month";

type CardioDraft = {
  type: CardioType;
  minutes: string;
  speed: string;
  distanceKm: string;
};

const CARDIO_TYPES: CardioType[] = ["Running", "Walking", "Cycling", "Elliptical", "Rowing", "Jump Rope"];

const CARDIO_META: Record<CardioType, { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; baseMet: number; speedUnit: string; hint: string }> = {
  Running: { icon: "run-fast", baseMet: 9.8, speedUnit: "km/h", hint: "Easy run starts near 8 km/h" },
  Walking: { icon: "walk", baseMet: 3.8, speedUnit: "km/h", hint: "Brisk walk is around 5.5 km/h" },
  Cycling: { icon: "bike", baseMet: 7.5, speedUnit: "km/h", hint: "Moderate ride is around 19 km/h" },
  Elliptical: { icon: "ellipse-outline", baseMet: 5.8, speedUnit: "level", hint: "Use machine resistance level" },
  Rowing: { icon: "rowing", baseMet: 7.0, speedUnit: "strokes/min", hint: "Moderate pace is near 24 spm" },
  "Jump Rope": { icon: "jump-rope", baseMet: 11.0, speedUnit: "skips/min", hint: "Steady pace is near 100 skips/min" },
};

const STRENGTH_PROFILES: Record<string, { perRep: number; perMinute: number }> = {
  bicep: { perRep: 0.42, perMinute: 3.4 },
  curl: { perRep: 0.42, perMinute: 3.4 },
  squat: { perRep: 0.82, perMinute: 5.7 },
  deadlift: { perRep: 1.1, perMinute: 6.4 },
  bench: { perRep: 0.72, perMinute: 5.0 },
  press: { perRep: 0.72, perMinute: 5.0 },
  pushup: { perRep: 0.55, perMinute: 4.4 },
  pullup: { perRep: 0.78, perMinute: 5.4 },
  row: { perRep: 0.68, perMinute: 4.9 },
  lunge: { perRep: 0.72, perMinute: 5.1 },
  plank: { perRep: 0.08, perMinute: 3.6 },
};

function getTrainingDaysPerWeek(splitId: SplitId): number {
  switch (splitId) {
    case "upper_lower":
      return 4;
    case "ppl":
    case "full_body":
    default:
      return 3;
  }
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isInPeriod(isoDate: string, period: PeriodKey): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  if (period === "day") return date >= startOfDay(now);
  if (period === "week") return date >= startOfWeek(now);
  return date >= startOfMonth(now);
}

function getStrengthProfile(name: string) {
  const key = name.toLowerCase();
  const match = Object.keys(STRENGTH_PROFILES).find((profileKey) => key.includes(profileKey));
  return match ? STRENGTH_PROFILES[match] : { perRep: 0.55, perMinute: 4.2 };
}

function clampCalories(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function estimateCameraCalories(workout: WorkoutRow, weightKg: number): number {
  const profile = getStrengthProfile(workout.exercise_type);
  const minutes = Math.max(workout.duration_seconds / 60, 0.35);
  const reps = Math.max(workout.total_reps || 0, 0);
  const weightFactor = weightKg / DEFAULT_WEIGHT_KG;
  const scoreFactor = workout.overall_score ? 0.9 + Math.min(workout.overall_score, 100) / 500 : 1;
  return clampCalories((minutes * profile.perMinute + reps * profile.perRep) * weightFactor * scoreFactor, 8, 450);
}

function estimatePlanCalories(entry: LocalWorkoutEntry, weightKg: number): number {
  const weightFactor = weightKg / DEFAULT_WEIGHT_KG;

  if (entry.exercises?.length) {
    const exerciseTotal = entry.exercises.reduce((sum, exercise) => {
      const profile = getStrengthProfile(exercise.name);
      const reps = (exercise.sets || 0) * (exercise.reps || 0);
      const activeSeconds = (exercise.durationSeconds || 42) * Math.max(exercise.sets || 1, 1);
      const minutes = Math.max(activeSeconds / 60, 0.5);
      return sum + minutes * profile.perMinute + reps * profile.perRep;
    }, 0);
    return clampCalories(exerciseTotal * weightFactor, 35, 650);
  }

  const minutes = Math.max(entry.totalDuration / 60, 1);
  const setLoad = Math.max(entry.setsCompleted || 0, 1) * 5.5;
  return clampCalories((minutes * 4.4 + setLoad) * weightFactor, 30, 600);
}

function estimateCardioCalories(type: CardioType, minutes: number, speed: number, weightKg: number): number {
  const meta = CARDIO_META[type];
  const speedFactor =
    type === "Running" ? Math.max(0.75, Math.min(1.55, speed / 8.5)) :
    type === "Walking" ? Math.max(0.75, Math.min(1.35, speed / 5.2)) :
    type === "Cycling" ? Math.max(0.75, Math.min(1.5, speed / 18)) :
    type === "Rowing" ? Math.max(0.8, Math.min(1.45, speed / 24)) :
    type === "Jump Rope" ? Math.max(0.8, Math.min(1.35, speed / 100)) :
    Math.max(0.8, Math.min(1.35, speed / 6));
  return clampCalories((meta.baseMet * speedFactor * 3.5 * weightKg / 200) * minutes, 10, 1400);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function createDefaultLedger(): CalorieLedger {
  return { entries: [], processedWorkoutIds: [], processedLocalIds: [] };
}

async function syncCalorieLedger(
  cameraWorkouts: WorkoutRow[],
  localWorkouts: LocalWorkoutEntry[],
  weightKg: number
): Promise<CalorieLedger> {
  const current = await readJson<CalorieLedger>(CALORIE_LEDGER_KEY, createDefaultLedger());
  const next: CalorieLedger = {
    entries: Array.isArray(current.entries) ? [...current.entries] : [],
    processedWorkoutIds: Array.isArray(current.processedWorkoutIds) ? [...current.processedWorkoutIds] : [],
    processedLocalIds: Array.isArray(current.processedLocalIds) ? [...current.processedLocalIds] : [],
  };
  const existingIds = new Set(next.entries.map((entry) => entry.id));

  cameraWorkouts.forEach((workout) => {
    const id = `camera-${workout.id}`;
    if (next.processedWorkoutIds.includes(String(workout.id)) || existingIds.has(id)) return;
    next.entries.push({
      id,
      source: "camera",
      title: titleCase(workout.exercise_type),
      calories: estimateCameraCalories(workout, weightKg),
      minutes: Math.max(1, Math.round(workout.duration_seconds / 60)),
      reps: workout.total_reps || 0,
      createdAt: workout.created_at,
    });
    next.processedWorkoutIds.push(String(workout.id));
    existingIds.add(id);
  });

  localWorkouts.forEach((workout) => {
    const localId = `${workout.date}-${workout.workoutId}`;
    const id = `plan-${localId}`;
    if (next.processedLocalIds.includes(localId) || existingIds.has(id)) return;
    const reps = workout.exercises?.reduce((sum, ex) => sum + (ex.sets || 0) * (ex.reps || 0), 0) ?? 0;
    next.entries.push({
      id,
      source: "plan",
      title: workout.workoutName || "Strength Workout",
      calories: estimatePlanCalories(workout, weightKg),
      minutes: Math.max(1, Math.round(workout.totalDuration / 60)),
      reps,
      createdAt: workout.date,
    });
    next.processedLocalIds.push(localId);
    existingIds.add(id);
  });

  next.entries = next.entries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 500);

  await AsyncStorage.setItem(CALORIE_LEDGER_KEY, JSON.stringify(next));
  return next;
}

export default function ActivitiesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [weekPlan, setWeekPlan] = useState<SplitWeekPlan | null>(null);
  const [userSplit, setUserSplit] = useState<SplitId>("ppl");
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [weightKg, setWeightKg] = useState(DEFAULT_WEIGHT_KG);
  const [calorieEntries, setCalorieEntries] = useState<CalorieEntry[]>([]);
  const [cardioActivities, setCardioActivities] = useState<CardioActivity[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("week");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCardio, setEditingCardio] = useState<CardioActivity | null>(null);
  const [draft, setDraft] = useState<CardioDraft>({
    type: "Running",
    minutes: "30",
    speed: "8",
    distanceKm: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return DEFAULT_WEIGHT_KG;
      const res = await axios.get(`${API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = res.data;
      if (profile.workout_split) setUserSplit(profile.workout_split);
      if (profile.fitness_level) setFitnessLevel(profile.fitness_level);
      const profileWeight = Number(profile.weight_kg || authUser?.weight_kg || DEFAULT_WEIGHT_KG);
      setWeightKg(profileWeight);
      return profileWeight;
    } catch (e) {
      console.log("Profile fetch error:", e);
      return Number(authUser?.weight_kg || DEFAULT_WEIGHT_KG);
    }
  }, [authUser?.weight_kg]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const profileWeight = await fetchProfile();
      const token = await AsyncStorage.getItem("token");
      const [storedPlan, localHistory, localCardio] = await Promise.all([
        AsyncStorage.getItem(SPLIT_WEEK_PLAN_KEY),
        readJson<LocalWorkoutEntry[]>(WORKOUT_HISTORY_KEY, []),
        readJson<CardioActivity[]>(CARDIO_ACTIVITIES_KEY, []),
      ]);

      let cameraRows: WorkoutRow[] = [];
      if (token) {
        const workoutsRes = await axios.get(`${API_BASE_URL}/api/workouts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        cameraRows = Array.isArray(workoutsRes.data) ? workoutsRes.data : [];
      }

      const sortedCamera = cameraRows.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setWorkouts(sortedCamera.slice(0, 5));
      setCardioActivities(localCardio.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const ledger = await syncCalorieLedger(sortedCamera, localHistory, profileWeight);
      setCalorieEntries(ledger.entries);

      if (storedPlan) setWeekPlan(JSON.parse(storedPlan));
    } catch (error) {
      console.log("Error fetching activities data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const weeklyGoal = getTrainingDaysPerWeek(userSplit);
  const completedThisWeek = useMemo(
    () => calorieEntries.filter((entry) => isInPeriod(entry.createdAt, "week")).length,
    [calorieEntries]
  );
  const progressPercentage = Math.min(100, weeklyGoal > 0 ? (completedThisWeek / weeklyGoal) * 100 : 0);

  const periodStrength = calorieEntries.filter((entry) => isInPeriod(entry.createdAt, selectedPeriod));
  const periodCardio = cardioActivities.filter((entry) => isInPeriod(entry.createdAt, selectedPeriod));
  const strengthCalories = periodStrength.reduce((sum, entry) => sum + entry.calories, 0);
  const cardioCalories = periodCardio.reduce((sum, entry) => sum + entry.calories, 0);
  const totalCalories = strengthCalories + cardioCalories;
  const totalMinutes =
    periodStrength.reduce((sum, entry) => sum + entry.minutes, 0) +
    periodCardio.reduce((sum, entry) => sum + entry.minutes, 0);
  const totalSessions = periodStrength.length + periodCardio.length;
  const weeklyCalories = calorieEntries.filter((entry) => isInPeriod(entry.createdAt, "week")).reduce((sum, entry) => sum + entry.calories, 0) +
    cardioActivities.filter((entry) => isInPeriod(entry.createdAt, "week")).reduce((sum, entry) => sum + entry.calories, 0);

  const todayCalories = calorieEntries.filter((entry) => isInPeriod(entry.createdAt, "day")).reduce((sum, entry) => sum + entry.calories, 0) +
    cardioActivities.filter((entry) => isInPeriod(entry.createdAt, "day")).reduce((sum, entry) => sum + entry.calories, 0);
  const monthCalories = calorieEntries.filter((entry) => isInPeriod(entry.createdAt, "month")).reduce((sum, entry) => sum + entry.calories, 0) +
    cardioActivities.filter((entry) => isInPeriod(entry.createdAt, "month")).reduce((sum, entry) => sum + entry.calories, 0);

  const recentFeed = useMemo(() => {
    const strength = calorieEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      meta: `${entry.minutes} min${entry.reps ? ` · ${entry.reps} reps` : ""}`,
      calories: entry.calories,
      createdAt: entry.createdAt,
      icon: entry.source === "camera" ? "camera-metering-center" : "dumbbell",
      source: entry.source,
    }));
    const cardio = cardioActivities.map((entry) => ({
      id: entry.id,
      title: entry.type,
      meta: `${entry.minutes} min · ${entry.speed} ${CARDIO_META[entry.type].speedUnit}`,
      calories: entry.calories,
      createdAt: entry.createdAt,
      icon: CARDIO_META[entry.type].icon,
      source: "cardio" as const,
    }));
    return [...strength, ...cardio]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [calorieEntries, cardioActivities]);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowType = getDayType(tomorrowDate, userSplit, fitnessLevel);
  const tomorrowFocus = getDayFocus(tomorrowDate, userSplit, fitnessLevel);
  const tomorrowIsRest = tomorrowType === "Rest";
  const tomorrowTitle = tomorrowIsRest ? "Rest day" : `${tomorrowType} day`;
  const tomorrowMeta = tomorrowIsRest
    ? "Recovery · light stretch or rest"
    : tomorrowFocus.muscleGroups.join(", ");

  const handleMusclePress = (muscle: string) => {
    router.push(`/muscle-exercises?muscle=${muscle}` as any);
  };

  const handleSuggestionPress = () => {
    if (!tomorrowIsRest) {
      router.push({
        pathname: "/day-preview",
        params: { date: tomorrowDate.toISOString(), splitId: userSplit },
      });
    }
  };

  const openAddCardio = (type: CardioType = "Running") => {
    setEditingCardio(null);
    setDraft({ type, minutes: type === "Running" ? "30" : "25", speed: type === "Running" ? "8" : "", distanceKm: "" });
    setModalVisible(true);
  };

  const openEditCardio = (activity: CardioActivity) => {
    setEditingCardio(activity);
    setDraft({
      type: activity.type,
      minutes: String(activity.minutes),
      speed: String(activity.speed),
      distanceKm: activity.distanceKm ? String(activity.distanceKm) : "",
    });
    setModalVisible(true);
  };

  const saveCardio = async () => {
    const minutes = Number(draft.minutes);
    const speed = Number(draft.speed);
    const distanceKm = draft.distanceKm ? Number(draft.distanceKm) : undefined;
    if (!minutes || minutes <= 0 || !speed || speed <= 0) {
      Alert.alert("Add cardio", "Enter a valid duration and pace.");
      return;
    }

    const calories = estimateCardioCalories(draft.type, minutes, speed, weightKg);
    const nextActivity: CardioActivity = {
      id: editingCardio?.id || `cardio-${Date.now()}`,
      type: draft.type,
      minutes,
      speed,
      distanceKm,
      calories,
      createdAt: editingCardio?.createdAt || new Date().toISOString(),
    };

    const next = editingCardio
      ? cardioActivities.map((activity) => activity.id === editingCardio.id ? nextActivity : activity)
      : [nextActivity, ...cardioActivities];
    const sorted = next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCardioActivities(sorted);
    await AsyncStorage.setItem(CARDIO_ACTIVITIES_KEY, JSON.stringify(sorted));
    setModalVisible(false);
  };

  const deleteCardio = async (activity: CardioActivity) => {
    Alert.alert("Delete cardio", `Remove ${activity.type.toLowerCase()} from your activities?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const next = cardioActivities.filter((item) => item.id !== activity.id);
          setCardioActivities(next);
          await AsyncStorage.setItem(CARDIO_ACTIVITIES_KEY, JSON.stringify(next));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your activity...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ACTIVITY CENTER</Text>
            <Text style={[styles.title, { color: colors.text }]}>Activities</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Strength, cardio, and estimated burn in one place
            </Text>
          </View>
          <Pressable style={[styles.headerAction, { backgroundColor: colors.primary }]} onPress={() => openAddCardio("Running")}>
            <MaterialCommunityIcons name="run-fast" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={[styles.heroPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>ESTIMATED BURN</Text>
              <Text style={[styles.heroCalories, { color: colors.text }]}>{totalCalories}</Text>
              <Text style={[styles.heroUnit, { color: colors.textSecondary }]}>calories this {selectedPeriod}</Text>
            </View>
            <View style={[styles.burnBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="fire" size={18} color="#FF6B4A" />
              <Text style={[styles.burnBadgeText, { color: colors.text }]}>{totalMinutes} min</Text>
            </View>
          </View>

          <View style={styles.periodRow}>
            {(["day", "week", "month"] as PeriodKey[]).map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodPill,
                  {
                    backgroundColor: selectedPeriod === period ? colors.primary : colors.background,
                    borderColor: selectedPeriod === period ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.periodText, { color: selectedPeriod === period ? "#FFFFFF" : colors.text }]}>
                  {period}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.heroStats}>
            <MiniStat label="Today" value={`${todayCalories}`} suffix="cal" colors={colors} />
            <MiniStat label="Week" value={`${weeklyCalories}`} suffix="cal" colors={colors} />
            <MiniStat label="Month" value={`${monthCalories}`} suffix="cal" colors={colors} />
          </View>
        </View>

        <View style={styles.splitRow}>
          <StatCard label="Strength" value={strengthCalories} sub={`${periodStrength.length} sessions`} icon="dumbbell" color="#2AA8FF" colors={colors} />
          <StatCard label="Cardio" value={cardioCalories} sub={`${periodCardio.length} sessions`} icon="heart-pulse" color="#27AE60" colors={colors} />
        </View>

        <View style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.goalHeader}>
            <View>
              <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>WEEKLY GOAL</Text>
              <Text style={[styles.goalTitle, { color: colors.text }]}>
                {completedThisWeek} / {weeklyGoal} workouts completed
              </Text>
            </View>
            <MaterialCommunityIcons name="target" size={22} color={colors.primary} />
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.background }]}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.goalMeta, { color: colors.textSecondary }]}>
            Estimates use exercise duration, reps, pace, and a {Math.round(weightKg)} kg profile weight.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Cardio Exercise</Text>
          <Pressable onPress={() => openAddCardio("Running")}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>Add Running</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardioScroller}>
          {CARDIO_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.cardioQuickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => openAddCardio(type)}
            >
              <MaterialCommunityIcons name={CARDIO_META[type].icon} size={24} color={type === "Running" ? "#27AE60" : colors.primary} />
              <Text style={[styles.cardioQuickTitle, { color: colors.text }]}>{type}</Text>
              <Text style={[styles.cardioQuickMeta, { color: colors.textSecondary }]}>{CARDIO_META[type].speedUnit}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {cardioActivities.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Cardio Log</Text>
              <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>Local only</Text>
            </View>
            {cardioActivities.slice(0, 4).map((activity) => (
              <CardioRow
                key={activity.id}
                activity={activity}
                colors={colors}
                onEdit={() => openEditCardio(activity)}
                onDelete={() => deleteCardio(activity)}
              />
            ))}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Groups</Text>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>{weekPlan ? weekPlan.splitName : "Choose focus"}</Text>
        </View>
        <View style={styles.grid}>
          <MuscleCard label="Biceps" icon="arm-flex" colors={colors} onPress={() => handleMusclePress("Biceps")} />
          <MuscleCard label="Chest" icon="dumbbell" colors={colors} onPress={() => handleMusclePress("Chest")} />
          <MuscleCard label="Shoulders" icon="weight-lifter" colors={colors} onPress={() => handleMusclePress("Shoulders")} />
          <MuscleCard label="Back" icon="rowing" colors={colors} onPress={() => handleMusclePress("Back")} />
          <MuscleCard label="Triceps" icon="arm-flex-outline" colors={colors} onPress={() => handleMusclePress("Triceps")} />
          <MuscleCard label="Legs" icon="run" colors={colors} onPress={() => handleMusclePress("Legs")} />
          <MuscleCard label="Core" icon="stomach" colors={colors} onPress={() => handleMusclePress("Core")} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Burn</Text>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>{totalSessions} this {selectedPeriod}</Text>
        </View>
        {recentFeed.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={28} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No activity yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Finish a workout or add running to start your calorie estimate.
            </Text>
          </View>
        ) : (
          recentFeed.map((entry) => (
            <ActivityCard
              key={entry.id}
              title={entry.title}
              meta={entry.meta}
              calories={entry.calories}
              day={new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              icon={entry.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
              colors={colors}
              onPress={entry.source === "cardio" ? undefined : () => {
                const cameraWorkout = workouts.find((workout) => `camera-${workout.id}` === entry.id);
                if (cameraWorkout) router.push({ pathname: "/workout-summary", params: { workoutId: cameraWorkout.id } });
              }}
            />
          ))
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested For You</Text>
        <Pressable
          style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleSuggestionPress}
          disabled={tomorrowIsRest}
        >
          <MaterialCommunityIcons
            name={tomorrowIsRest ? "bed" : tomorrowType === "Push" ? "arm-flex" : tomorrowType === "Pull" ? "arrow-expand-vertical" : "run"}
            size={26}
            color={colors.primary}
          />
          <View style={styles.suggestionCopy}>
            <Text style={[styles.suggestionTitle, { color: colors.text }]}>{tomorrowTitle}</Text>
            <Text style={[styles.suggestionSub, { color: colors.textSecondary }]}>{tomorrowMeta}</Text>
          </View>
          {!tomorrowIsRest && <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />}
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CardioModal
        visible={modalVisible}
        draft={draft}
        editing={!!editingCardio}
        weightKg={weightKg}
        colors={colors}
        onChange={setDraft}
        onClose={() => setModalVisible(false)}
        onSave={saveCardio}
      />
    </>
  );
}

function MiniStat({ label, value, suffix, colors }: { label: string; value: string; suffix: string; colors: ThemeColors }) {
  return (
    <View style={[styles.miniStat, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.miniStatValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>{label} {suffix}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  colors,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statSub, { color: colors.textSecondary }]}>{sub}</Text>
    </View>
  );
}

function MuscleCard({
  label,
  icon,
  colors,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.muscleCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      <Text style={[styles.muscleLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function ActivityCard({
  title,
  meta,
  calories,
  day,
  icon,
  colors,
  onPress,
}: {
  title: string;
  meta: string;
  calories: number;
  day: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  colors: ThemeColors;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.activityCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.88 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.activityIcon, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={[styles.activityTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>{meta} · {day}</Text>
      </View>
      <View style={styles.caloriePill}>
        <Text style={styles.calorieValue}>{calories}</Text>
        <Text style={styles.calorieLabel}>cal</Text>
      </View>
    </Pressable>
  );
}

function CardioRow({
  activity,
  colors,
  onEdit,
  onDelete,
}: {
  activity: CardioActivity;
  colors: ThemeColors;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.cardioRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.activityIcon, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name={CARDIO_META[activity.type].icon} size={20} color="#27AE60" />
      </View>
      <View style={styles.activityCopy}>
        <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.type}</Text>
        <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
          {activity.minutes} min · {activity.speed} {CARDIO_META[activity.type].speedUnit} · {activity.calories} cal
        </Text>
      </View>
      <Pressable style={styles.rowIconButton} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
      </Pressable>
      <Pressable style={styles.rowIconButton} onPress={onDelete}>
        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
      </Pressable>
    </View>
  );
}

function CardioModal({
  visible,
  draft,
  editing,
  weightKg,
  colors,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  draft: CardioDraft;
  editing: boolean;
  weightKg: number;
  colors: ThemeColors;
  onChange: (draft: CardioDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const minutes = Number(draft.minutes) || 0;
  const speed = Number(draft.speed) || 0;
  const preview = minutes > 0 && speed > 0 ? estimateCardioCalories(draft.type, minutes, speed, weightKg) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.panelLabel, { color: colors.textSecondary }]}>{editing ? "EDIT CARDIO" : "ADD CARDIO"}</Text>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{draft.type}</Text>
                  </View>
                  <Pressable style={[styles.rowIconButton, { backgroundColor: colors.background }]} onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>

                <View style={styles.typeWrap}>
                  {CARDIO_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.typePill,
                        {
                          backgroundColor: draft.type === type ? colors.primary : colors.background,
                          borderColor: draft.type === type ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => onChange({ ...draft, type, speed: draft.speed || (type === "Running" ? "8" : "") })}
                    >
                      <Text style={[styles.typeText, { color: draft.type === type ? "#FFFFFF" : colors.text }]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Duration minutes</Text>
                <TextInput
                  value={draft.minutes}
                  onChangeText={(value) => onChange({ ...draft, minutes: value })}
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder="30"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pace or speed ({CARDIO_META[draft.type].speedUnit})</Text>
                <TextInput
                  value={draft.speed}
                  onChangeText={(value) => onChange({ ...draft, speed: value })}
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder={CARDIO_META[draft.type].hint}
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Distance km, optional</Text>
                <TextInput
                  value={draft.distanceKm}
                  onChangeText={(value) => onChange({ ...draft, distanceKm: value })}
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder="5"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                />

                <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="fire" size={20} color="#FF6B4A" />
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {preview ? `${preview} estimated calories` : "Enter duration and pace"}
                  </Text>
                </View>

                <Pressable style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={onSave}>
                  <Text style={styles.saveButtonText}>{editing ? "Save Changes" : "Add Cardio"}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  content: { paddingTop: 58 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { marginTop: 4, fontSize: 32, fontWeight: "900" },
  subtitle: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  headerAction: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  heroPanel: { borderRadius: 8, padding: 18, borderWidth: 1, marginBottom: 12 },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  panelLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  heroCalories: { fontSize: 48, fontWeight: "900", marginTop: 4 },
  heroUnit: { fontSize: 13, marginTop: -2 },
  burnBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  burnBadgeText: { fontSize: 13, fontWeight: "800" },
  periodRow: { flexDirection: "row", gap: 8, marginTop: 18 },
  periodPill: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  periodText: { fontSize: 13, fontWeight: "800", textTransform: "capitalize" },
  heroStats: { flexDirection: "row", gap: 8, marginTop: 12 },
  miniStat: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 10 },
  miniStatValue: { fontSize: 18, fontWeight: "900" },
  miniStatLabel: { fontSize: 11, marginTop: 2 },
  splitRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 8, borderWidth: 1, padding: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  statSub: { fontSize: 11, marginTop: 4 },
  goalCard: { borderRadius: 8, padding: 16, borderWidth: 1, marginBottom: 18 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalTitle: { marginTop: 4, fontSize: 16, fontWeight: "800" },
  goalMeta: { fontSize: 12, lineHeight: 18, marginTop: 10 },
  progressBarBackground: { marginTop: 14, height: 9, borderRadius: 8, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 8 },
  sectionHeader: { marginTop: 8, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 10 },
  sectionAction: { fontSize: 13, fontWeight: "800" },
  sectionMeta: { fontSize: 12, fontWeight: "600" },
  cardioScroller: { gap: 10, paddingBottom: 14 },
  cardioQuickCard: { width: 112, borderRadius: 8, borderWidth: 1, padding: 14 },
  cardioQuickTitle: { fontSize: 14, fontWeight: "800", marginTop: 10 },
  cardioQuickMeta: { fontSize: 11, marginTop: 3 },
  cardioRow: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10 },
  muscleCard: { width: "48.5%", aspectRatio: 1.8, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  muscleLabel: { marginTop: 8, fontSize: 14, fontWeight: "800" },
  activityCard: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  activityIcon: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  activityCopy: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: "800" },
  activityMeta: { marginTop: 3, fontSize: 12 },
  caloriePill: { alignItems: "flex-end", minWidth: 54 },
  calorieValue: { color: "#FF6B4A", fontSize: 17, fontWeight: "900" },
  calorieLabel: { color: "#FF6B4A", fontSize: 10, fontWeight: "800" },
  emptyCard: { borderRadius: 8, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 12 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900" },
  emptyText: { marginTop: 6, fontSize: 13, textAlign: "center", lineHeight: 19 },
  suggestionCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 14, gap: 12 },
  suggestionCopy: { flex: 1 },
  suggestionTitle: { fontSize: 15, fontWeight: "800" },
  suggestionSub: { marginTop: 4, fontSize: 12 },
  rowIconButton: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  keyboardAvoider: { flex: 1 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.48)" },
  modalCard: { maxHeight: "88%", borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1 },
  modalScrollContent: { padding: 18, paddingBottom: 28 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { marginTop: 4, fontSize: 24, fontWeight: "900" },
  typeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typePill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  typeText: { fontSize: 12, fontWeight: "800" },
  inputLabel: { fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 10 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontWeight: "700" },
  previewBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, borderWidth: 1, padding: 12, marginTop: 14 },
  previewText: { fontSize: 14, fontWeight: "800" },
  saveButton: { borderRadius: 8, paddingVertical: 15, alignItems: "center", marginTop: 14 },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
