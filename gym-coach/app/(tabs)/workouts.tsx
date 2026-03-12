import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { API_BASE_URL } from "@/app/config/api";
import axios from "axios";

const { width } = Dimensions.get("window");

const WORKOUT_VIEW_IMAGE = require("@/assets/images/home/featured.jpg");

// ── Types ────────────────────────────────────────────────────────
interface Prescription {
  sets: number;
  reps: number;
  duration_seconds: number;
  rest_seconds: number;
}

interface Exercise {
  exercise_id: number;
  name: string;
  description: string;
  difficulty_level: string;
  target_muscles: string[];
  category: string;
  prescription: Prescription;
}

interface PlanDay {
  plan_day_id: number;
  day_number: number;
  day_label: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  plan_id: number;
  name: string;
  duration_weeks: number;
  days_per_week: number;
}

// ── Animated bar ─────────────────────────────────────────────────
function StatBar({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 100,
      duration: 900,
      delay: 500,
      useNativeDriver: false,
    }).start();
  }, [value]);
  return (
    <View style={barStyles.track}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            backgroundColor: color,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 5, borderRadius: 3,
    backgroundColor: "#EFEFEF", overflow: "hidden",
    marginTop: 8, width: "100%",
  },
  fill: { height: "100%", borderRadius: 3 },
});

// ── Main screen ──────────────────────────────────────────────────
export default function WorkoutsScreen() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [loading, setLoading] = useState(false); // false until auth resolves
  const [error, setError] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Wait for auth to finish loading, then fetch
  useEffect(() => {
    if (authLoading) return;       // still reading AsyncStorage
    if (!token) {
      setError("You must be logged in to view your workout plan.");
      return;
    }
    setLoading(true);
    axios
      .post(
        `${API_BASE_URL}/api/workout-plan/generate`,
        { durationWeeks: 4, daysPerWeek: 3, exercisesPerDay: 4 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res: { data: { plan: WorkoutPlan; days: PlanDay[] } }) => {
        setPlan(res.data.plan);
        setDays(res.data.days ?? []);
        setError(null);
      })
      .catch((err: { message?: string }) => {
        console.warn("Workout plan fetch error:", err?.message);
        setError("Could not load workout plan. Is the backend running?");
      })
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  // Derived values from real plan
  const currentDay = days[currentDayIndex] ?? null;
  const firstExercise = currentDay?.exercises?.[0] ?? null;
  const prescription = firstExercise?.prescription;

  const workoutName = plan?.name ?? "Your Workout";
  const exerciseName = firstExercise?.name ?? "—";
  const sets = prescription?.sets ?? 4;
  const reps = prescription?.reps ?? 10;
  const totalDays = days.length;

  // Animations
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const imageFade = useRef(new Animated.Value(0)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (loading) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(imageFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [loading]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!totalDays) return;
    Animated.timing(progressAnim, {
      toValue: totalDays > 0 ? ((currentDayIndex + 1) / totalDays) * 100 : 0,
      duration: 900, delay: 400, useNativeDriver: false,
    }).start();
  }, [currentDayIndex, totalDays]);

  // ── Loading / Error states ─────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2AA8FF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your workout plan…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }]}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.textSecondary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Connection Error</Text>
        <Text style={[styles.errorMsg, { color: colors.textSecondary }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Workout Info Card ── */}
        <Animated.View
          style={[
            styles.workoutInfoCard,
            { opacity: cardFade, transform: [{ translateY: cardSlide }], backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.workoutInfoHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.workoutName, { color: colors.text }]} numberOfLines={2}>
                {workoutName}
              </Text>
              <View style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={[styles.exerciseName, { color: colors.textSecondary }]}>
                  {exerciseName}
                </Text>
              </View>
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="calendar-outline" size={13} color="#2AA8FF" />
              <Text style={styles.timerText}>
                Day {currentDayIndex + 1}/{totalDays || "?"}
              </Text>
            </View>
          </View>

          {/* Segmented progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
            {totalDays > 1 &&
              Array.from({ length: totalDays - 1 }, (_, i) => (
                <View
                  key={i}
                  style={[styles.progressNotch, { left: `${((i + 1) / totalDays) * 100}%` as any }]}
                />
              ))}
          </View>

          <View style={styles.setInfo}>
            <View style={styles.setBadge}>
              <Text style={styles.setBadgeText}>
                {sets} Sets · {reps} Reps
              </Text>
            </View>
            {firstExercise && (
              <Text style={[styles.repsText, { color: colors.textSecondary }]}>
                <Text style={[styles.repsCount, { color: colors.text }]}>
                  {firstExercise.category}
                </Text>
                {"  training"}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Workout View ── */}
        <Animated.View style={[styles.workoutViewWrap, { opacity: imageFade }]}>
          <Image source={WORKOUT_VIEW_IMAGE} style={styles.workoutViewImage} resizeMode="cover" />
          <View style={styles.imageScrim} />
          <View style={styles.formScoreOverlay}>
            <Text style={styles.formScoreNum}>{reps}</Text>
            <Text style={styles.formScoreLabel}>REPS</Text>
          </View>
          <View style={styles.postureBadge}>
            <Text style={styles.postureBadgeLabel}>SETS</Text>
            <Text style={styles.postureBadgeVal}>{sets}</Text>
          </View>
        </Animated.View>

        {/* ── Exercise stats ── */}
        {currentDay?.exercises && (
          <Animated.View
            style={[styles.statsRow, { opacity: statsFade, transform: [{ translateY: statsSlide }] }]}
          >
            {currentDay.exercises.slice(0, 3).map((ex, idx) => {
              const statColors = ["#2AA8FF", "#F5A623", "#27AE60"];
              const bgColors = ["#EAF5FF", "#FFF4E5", "#E8FAF0"];
              const iconNames = ["body-outline", "hand-left-outline", "expand-outline"] as const;
              return (
                <View
                  key={ex.exercise_id}
                  style={[
                    styles.statCard,
                    idx === 0 && { borderColor: "#C8E8FF", backgroundColor: "#F4FAFF" },
                    idx !== 0 && { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.statIconWrap, { backgroundColor: bgColors[idx] }]}>
                    <Ionicons name={iconNames[idx]} size={20} color={statColors[idx]} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {ex.prescription.sets}×{ex.prescription.reps}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {ex.name.split(" ")[0]}
                  </Text>
                  <StatBar value={Math.min(ex.prescription.reps * 8, 100)} color={statColors[idx]} />
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* ── Summary Button ── */}
        <Pressable
          style={styles.summaryBtn}
          onPress={() => router.push("/workout-summary")}
        >
          <Text style={styles.summaryBtnText}>SEE WORKOUT SUMMARY</Text>
          <View style={styles.summaryArrow}>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </Pressable>

        {/* ── Navigation ── */}
        {totalDays > 1 && (
          <View style={styles.navSection}>
            <View style={styles.navSide}>
              <Pressable
                style={[styles.navCircleBtn, currentDayIndex === 0 && { opacity: 0.3 }]}
                onPress={() => setCurrentDayIndex((i) => Math.max(0, i - 1))}
                disabled={currentDayIndex === 0}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.navLabel, { color: colors.textSecondary }]}>PREV</Text>
            </View>

            <Pressable
              style={styles.pastWorkoutsBtn}
              onPress={() => router.push("/past-workouts")}
            >
              <View style={styles.pastWorkoutsIconWrap}>
                <Ionicons name="barbell-outline" size={26} color={colors.text} />
              </View>
              <Text style={[styles.pastWorkoutsText, { color: colors.text }]}>
                Past{"\n"}Workouts
              </Text>
            </Pressable>

            <View style={styles.navSide}>
              <Pressable
                style={[styles.navCircleBtn, styles.navCirclePrimary, currentDayIndex === totalDays - 1 && { opacity: 0.3 }]}
                onPress={() => setCurrentDayIndex((i) => Math.min(totalDays - 1, i + 1))}
                disabled={currentDayIndex === totalDays - 1}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </Pressable>
              <Text style={[styles.navLabel, { color: colors.textSecondary }]}>NEXT</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomPad} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgBlob1: {
    position: "absolute", top: -40, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "#2AA8FF", opacity: 0.06,
  },
  bgBlob2: {
    position: "absolute", bottom: 220, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#171C1D", opacity: 0.04,
  },

  loadingText: { marginTop: 16, fontSize: 14, fontWeight: "500" },
  errorTitle: { fontSize: 22, fontWeight: "800", marginTop: 20, letterSpacing: -0.4 },
  errorMsg: { fontSize: 14, textAlign: "center", marginTop: 10, lineHeight: 20 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  workoutInfoCard: {
    marginTop: 16,
    borderRadius: 20, padding: 18, borderWidth: 1,
  },
  workoutInfoHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 18,
  },
  workoutName: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4, marginBottom: 6 },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  exerciseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2AA8FF" },
  exerciseName: { fontSize: 13, fontWeight: "500" },
  timerBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#EAF5FF", paddingHorizontal: 11,
    paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#C8E8FF",
  },
  timerText: { color: "#2AA8FF", fontSize: 13, fontWeight: "700" },

  progressTrack: {
    height: 8, backgroundColor: "#EFEFEF", borderRadius: 4,
    marginBottom: 14, overflow: "visible", position: "relative",
  },
  progressFill: { height: "100%", backgroundColor: "#2AA8FF", borderRadius: 4 },
  progressNotch: {
    position: "absolute", top: -2, width: 2, height: 12,
    backgroundColor: "#fff", borderRadius: 1, marginLeft: -1,
  },
  setInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  setBadge: {
    backgroundColor: "#171C1D", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  setBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  repsText: { fontSize: 13, fontWeight: "500" },
  repsCount: { fontWeight: "900", fontSize: 15 },

  workoutViewWrap: {
    marginTop: 14, borderRadius: 22, overflow: "hidden",
    aspectRatio: 4 / 3, position: "relative", backgroundColor: "#F0F0F0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  workoutViewImage: { width: "100%", height: "100%" },
  imageScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(23,28,29,0.24)" },
  formScoreOverlay: {
    position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center",
  },
  formScoreNum: {
    color: "#fff", fontSize: 56, fontWeight: "900", letterSpacing: -2, lineHeight: 58,
    textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  formScoreLabel: {
    color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "800",
    letterSpacing: 3, marginTop: 2,
  },
  postureBadge: {
    position: "absolute", top: 14, right: 14,
    backgroundColor: "rgba(255,255,255,0.93)", borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  postureBadgeLabel: { color: "#ABABAB", fontSize: 8, fontWeight: "800", letterSpacing: 1.5, marginBottom: 2 },
  postureBadgeVal: { color: "#27AE60", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statCard: {
    flex: 1, borderRadius: 18, padding: 14,
    alignItems: "center", borderWidth: 1,
  },
  statIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },

  summaryBtn: {
    marginTop: 16, backgroundColor: "#171C1D",
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    shadowColor: "#171C1D", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 14, elevation: 6,
  },
  summaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  summaryArrow: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#2AA8FF",
    alignItems: "center", justifyContent: "center",
  },

  navSection: {
    marginTop: 28, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4,
  },
  navSide: { alignItems: "center", gap: 8 },
  navLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  navCircleBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E5E5E5",
  },
  navCirclePrimary: { backgroundColor: "#2AA8FF", borderColor: "#2AA8FF" },
  pastWorkoutsBtn: {
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20,
    backgroundColor: "#F7F7F7", alignItems: "center",
    justifyContent: "center", gap: 8, borderWidth: 1,
    borderColor: "#EFEFEF", minWidth: 110,
  },
  pastWorkoutsIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#EAF5FF", alignItems: "center", justifyContent: "center",
  },
  pastWorkoutsText: { fontSize: 12, fontWeight: "700", textAlign: "center", lineHeight: 16 },
  bottomPad: { height: 100 },
});