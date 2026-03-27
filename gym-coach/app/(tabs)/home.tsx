import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/app/config/api";
import { useTheme } from "@/app/context/ThemeContext";
import { getDayType, getDayName, getDayFocus } from "@/app/lib/ppl-cycle";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}



type GeneratedPlanDayExercise = {
  exercise_id: number;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  target_muscles: string | null;
  category: string | null;
  suitability: {
    met_value: number | null;
    is_high_impact: boolean | null;
  };
  prescription: {
    sets: number;
    reps: number;
    duration_seconds: number;
    rest_seconds: number;
  };
};

type GeneratedPlanDay = {
  plan_day_id: number;
  day_number: number;
  day_label: string;
  exercises: GeneratedPlanDayExercise[];
};

type GeneratedPlanResponse = {
  plan: {
    plan_id: number;
    name: string;
    goal_id: number | null;
    duration_weeks: number;
    days_per_week: number;
    is_ai_generated: boolean;
    generated_at: string;
  };
  days: GeneratedPlanDay[];
};

export const PPL_WEEK_PLAN_KEY = "ppl_week_plan";

export type PPLWeekPlan = {
  push: GeneratedPlanDay;
  pull: GeneratedPlanDay;
  legs: GeneratedPlanDay;
};

// Mirror backend PPL keywords so fallback still produces correct push/pull/legs
const PPL_KEYWORDS: Record<string, string[]> = {
  Push: ["chest", "shoulder", "triceps", "pectoral", "deltoid", "pec"],
  Pull: ["back", "biceps", "bicep", "trap", "lat", "rhomboid", "rear delt", "row", "pull", "chin"],
  Legs: ["leg", "quad", "hamstring", "glute", "calf", "calves", "thigh", "hip", "squat", "lunge"],
};

function matchesPPL(
  ex: { target_muscles?: string | null; category?: string | null; name?: string },
  dayType: "Push" | "Pull" | "Legs"
): boolean {
  const keywords = PPL_KEYWORDS[dayType];
  const str = [ex.target_muscles, ex.category, ex.name].filter(Boolean).join(" ").toLowerCase();
  return keywords.some((k) => str.includes(k));
}

/** Build PPL week from generate response when generate-week fails (e.g. 404). */
function buildPPLFallbackFromPlan(
  days: GeneratedPlanDay[],
  exercisesPerDay: number
): PPLWeekPlan {
  const allEx = days.flatMap((d) => d.exercises.map((e) => ({ ...e, prescription: e.prescription })));
  const pushEx = allEx.filter((e) => matchesPPL(e, "Push")).slice(0, exercisesPerDay);
  const pullEx = allEx.filter((e) => matchesPPL(e, "Pull")).slice(0, exercisesPerDay);
  const legsEx = allEx.filter((e) => matchesPPL(e, "Legs")).slice(0, exercisesPerDay);
  const toDay = (label: string, exercises: typeof allEx, dayNum: number): GeneratedPlanDay => {
    const use = exercises.length >= exercisesPerDay
      ? exercises
      : allEx.slice((dayNum - 1) * exercisesPerDay, dayNum * exercisesPerDay);
    return {
      plan_day_id: dayNum,
      day_number: dayNum,
      day_label: label,
      exercises: use.slice(0, exercisesPerDay),
    };
  };
  return {
    push: toDay("Push", pushEx, 1),
    pull: toDay("Pull", pullEx, 2),
    legs: toDay("Legs", legsEx, 3),
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [weekPlan, setWeekPlan] = useState<PPLWeekPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<GeneratedPlanResponse | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    weeklyProgress: number;
    totalMinutes: number;
    totalCalories: number;
    workoutsCompleted: number;
    streak: number;
  } | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [recentWorkout, setRecentWorkout] = useState<{
    exercise_type: string;
    duration_seconds: number;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        setLoadingOverview(true);
        setOverviewError(null);
        const res = await axios.get(`${API_BASE_URL}/api/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOverview(res.data);
      } catch (error: any) {
        console.log("Failed to fetch overview:", error?.message ?? error);
        setOverviewError("Failed to load overview");
      } finally {
        setLoadingOverview(false);
      }
    };

  const fetchUserAndPlan = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      const profileRes = await axios.get(`${API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);
    } catch (e) {
      console.log("Failed to load profile:", e);
    }

    setIsLoadingPlan(true);
    setPlanError(null);

    let planRes: GeneratedPlanResponse | null = null;
    try {
      const res = await axios.post<GeneratedPlanResponse>(
        `${API_BASE_URL}/api/workout-plan/generate`,
        { durationWeeks: 4, daysPerWeek: 3, exercisesPerDay: 6 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      planRes = res.data;
      setTodayPlan(res.data);
    } catch (error: any) {
      console.log("Generate plan failed:", error?.message ?? error);
      setPlanError("Could not generate workout plan. Please try again.");
    }

    try {
      const weekRes = await axios.post<PPLWeekPlan>(
        `${API_BASE_URL}/api/workout-plan/generate-week`,
        { exercisesPerDay: 6 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWeekPlan(weekRes.data);
      await AsyncStorage.setItem(PPL_WEEK_PLAN_KEY, JSON.stringify(weekRes.data));
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      console.log("Generate week failed, using fallback:", status, code, error?.message ?? error);
      if (status === 404 && token) {
        try {
          const weekViaGenerate = await axios.post<PPLWeekPlan>(
            `${API_BASE_URL}/api/workout-plan/generate`,
            { week: true, exercisesPerDay: 6 },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setWeekPlan(weekViaGenerate.data);
          await AsyncStorage.setItem(PPL_WEEK_PLAN_KEY, JSON.stringify(weekViaGenerate.data));
        } catch (_e) {
          const days = planRes?.days;
          if (days?.length) {
            const fallback = buildPPLFallbackFromPlan(days, 6);
            setWeekPlan(fallback);
            AsyncStorage.setItem(PPL_WEEK_PLAN_KEY, JSON.stringify(fallback));
          }
        }
      } else {
        const days = planRes?.days;
        if (days?.length) {
          const fallback = buildPPLFallbackFromPlan(days, 6);
          setWeekPlan(fallback);
          AsyncStorage.setItem(PPL_WEEK_PLAN_KEY, JSON.stringify(fallback));
        }
      }
    } finally {
      setIsLoadingPlan(false);
    }
  };

    fetchOverview();
    fetchUserAndPlan();

    // Fetch most recent workout for the Recent Activity card
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/api/workouts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const all = Array.isArray(res.data) ? res.data : [];
        if (all.length > 0) {
          const sorted = all.sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setRecentWorkout(sorted[0]);
        }
      } catch (_e) {
        // silently fail — card will show fallback
      }
    })();
  }, []);

  const todayType = getDayType(new Date());
  const todayDayFromWeek = weekPlan
    ? weekPlan[todayType.toLowerCase() as keyof PPLWeekPlan]
    : null;
  const todayDay: GeneratedPlanDay | null =
    todayDayFromWeek && todayDayFromWeek.exercises?.length > 0
      ? todayDayFromWeek
      : todayPlan?.days?.[0] ?? null;
  const todayDisplayName =
    todayDayFromWeek && todayDayFromWeek.exercises?.length > 0
      ? todayType
      : todayPlan?.plan?.name ?? "Workout";

  const tomorrowDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })();
  const tomorrowType = getDayType(tomorrowDate);
  const tomorrowFocus = getDayFocus(tomorrowDate);

  const handleStartWorkout = () => {
    if (!todayDay) return;
    const planPayload = {
      plan: {
        plan_id: todayPlan?.plan?.plan_id ?? 0,
        name: todayDisplayName,
      },
      day: todayDay,
    };
    AsyncStorage.setItem("active_workout_plan", JSON.stringify(planPayload));
    router.push("/today-workout");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}, {user?.full_name?.split(" ")[0] || "User"}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
            Let's crush your goals today
          </Text>
        </View>
        <Pressable
          style={styles.profileIcon}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.profileInitials}>
            {user?.full_name
              ? user.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
              : "U"}
          </Text>
        </Pressable>
      </View>

      {/* Today's Overview */}
      <View
        style={[
          styles.dashboardCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            TODAY'S OVERVIEW
          </Text>
          <Text style={styles.cardLink}>Details</Text>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressRingContainer}>
            <View
              style={[
                styles.progressRing,
                { borderColor: "#2AA8FF", backgroundColor: colors.background },
              ]}
            >
              <View style={styles.progressInner}>
                <Text style={[styles.progressNumber, { color: colors.text }]}>
                  {overview ? `${overview.weeklyProgress}%` : "0%"}
                </Text>
              </View>
            </View>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Weekly Progress
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {loadingOverview ? (
              <ActivityIndicator size="small" color="#2AA8FF" />
            ) : overviewError ? (
              <Text style={styles.errorText}>{overviewError}</Text>
            ) : overview ? (
              <>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{overview.totalMinutes}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>mins</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{overview.totalCalories}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>kcal</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{overview.workoutsCompleted}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>workouts</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{overview.streak}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>streak</Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}><Text style={[styles.statValue, { color: colors.text }]}>0</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>mins</Text></View>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}><Text style={[styles.statValue, { color: colors.text }]}>0</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>kcal</Text></View>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}><Text style={[styles.statValue, { color: colors.text }]}>0</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>workouts</Text></View>
                <View style={[styles.statBox, { backgroundColor: colors.background }]}><Text style={[styles.statValue, { color: colors.text }]}>0</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>streak</Text></View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Today's Workout */}
      <View
        style={[
          styles.dashboardCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>TODAY'S WORKOUT</Text>
        </View>

        {isLoadingPlan && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#2AA8FF" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Building your workout...
            </Text>
          </View>
        )}

        {!isLoadingPlan && planError && (
          <Text style={styles.errorText}>{planError}</Text>
        )}

        {!isLoadingPlan && todayType === "Rest" && (
          <View style={styles.workoutRow}>
            <Image
              source={require("@/assets/images/home/featured.jpg")}
              style={styles.workoutImage}
            />
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutName, { color: colors.text }]}>Rest day</Text>
              <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>Recovery · Light stretch or rest. Cycle restarts tomorrow with Push.</Text>
              <View style={styles.workoutTags}>
                <View style={[styles.tag, { backgroundColor: colors.surfaceHighlight }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>Sunday</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        {!isLoadingPlan && todayDay && todayType !== "Rest" && (
          <Pressable style={styles.workoutRow} onPress={handleStartWorkout}>
            <Image
              source={require("@/assets/images/home/featured.jpg")}
              style={styles.workoutImage}
            />
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutName, { color: colors.text }]}>
                {todayDisplayName}
              </Text>
              <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
                {todayDay.exercises.length} exercises ·{" "}
                {todayDay.exercises.reduce(
                  (total, ex) => total + (ex.prescription.sets || 0),
                  0
                )}{" "}
                total sets
              </Text>
              
            </View>
          </Pressable>
        )}

        {!isLoadingPlan && !todayDay && !planError && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workout generated yet. Complete your profile to get started.
          </Text>
        )}
      </View>

      {/* Recent Activity */}
      <View
        style={[
          styles.dashboardCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            RECENT ACTIVITY
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/activities")}>
            <Text style={styles.cardLink}>View All</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.activityPreview, { backgroundColor: colors.background }]}
          onPress={() => router.push("/(tabs)/activities")}
        >
          <View style={styles.activityPreviewContent}>
            <Text style={[styles.activityPreviewTitle, { color: colors.text }]}>
              {recentWorkout
                ? recentWorkout.exercise_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : "No recent activity"}
            </Text>
            <Text style={[styles.activityPreviewMeta, { color: colors.textSecondary }]}>
              {recentWorkout
                ? `${Math.round(recentWorkout.duration_seconds / 60)} min · ${new Date(recentWorkout.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Complete a workout to see it here"}
            </Text>
          </View>
          <Text style={styles.activityArrow}>→</Text>
        </Pressable>
      </View>
      

      {/* Tomorrow's Workout (PPL) */}
      <View style={[styles.dashboardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>TOMORROW'S WORKOUT</Text>
          <Pressable onPress={() => router.push({ pathname: "/day-preview", params: { date: tomorrowDate.toISOString() } })}>
            <Text style={styles.cardLink}>View</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.workoutRow}
          onPress={() => router.push({ pathname: "/day-preview", params: { date: tomorrowDate.toISOString() } })}
        >
          <Image
            source={require("@/assets/images/home/featured.jpg")}
            style={styles.workoutImage}
          />
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: colors.text }]}>
              {tomorrowType === "Rest" ? "Rest day" : `${tomorrowType} day`}
            </Text>
            <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
              {tomorrowType === "Rest"
                ? "Recovery · Light stretch or rest"
                : tomorrowFocus.muscleGroups.join(", ")}
            </Text>

          </View>
        </Pressable>
      </View>

      {/* Week plan – Push / Pull / Legs */}
      <View style={[styles.dashboardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>THIS WEEK</Text>
          <Pressable onPress={() => router.push("/week-plan")}>
            <Text style={styles.cardLink}>View full week</Text>
          </Pressable>
        </View>
      </View>

      {/* Recommended For You */}
      <View
        style={[
          styles.dashboardCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            RECOMMENDED FOR YOU
          </Text>
          <Text style={styles.cardLink}>More</Text>
        </View>
        <View style={styles.recommendedRow}>
          <View style={styles.recommendedItem}>
            <Image
              source={require("@/assets/images/home/reco1.jpg")}
              style={styles.recommendedImage}
            />
            <Text style={[styles.recommendedName, { color: colors.text }]}>
              Full Body Stretch
            </Text>
            <Text style={[styles.recommendedMeta, { color: colors.textSecondary }]}>
              15 min · beginner
            </Text>
          </View>
          <View style={styles.recommendedItem}>
            <Image
              source={require("@/assets/images/home/reco2.jpg")}
              style={styles.recommendedImage}
            />
            <Text style={[styles.recommendedName, { color: colors.text }]}>
              Core Strength
            </Text>
            <Text style={[styles.recommendedMeta, { color: colors.textSecondary }]}>
              20 min · intermediate
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 2,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  dashboardCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardLink: {
    color: "#2AA8FF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressRingContainer: {
    alignItems: "center",
    marginRight: 20,
  },
  progressRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  progressInner: {
    alignItems: "center",
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  statsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    width: "40%",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  workoutRow: {
    flexDirection: "row",
    gap: 14,
  },
  workoutImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  workoutInfo: {
    flex: 1,
    justifyContent: "center",
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  workoutMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
  workoutTags: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },

  weekPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  weekPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  weekPillText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  weekPillPush: { backgroundColor: "#EF4444" },
  weekPillPull: { backgroundColor: "#3B82F6" },
  weekPillLegs: { backgroundColor: "#10B981" },
  weekPillRest: { backgroundColor: "#9CA3AF" },
  weekPlanArrow: { color: "#6366F1", fontSize: 18, fontWeight: "600", marginLeft: 8 },

  // Programs section
  programCard: {
    width: 130,
    marginRight: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  programImage: {
    width: "100%",
    height: 80,
  },
  programCardContent: {
    padding: 10,
  },
  programCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  programCardMeta: {
    fontSize: 11,
  },

  // Recommended section
  recommendedRow: {
    flexDirection: "row",
    gap: 12,
  },
  recommendedItem: {
    flex: 1,
  },
  recommendedImage: {
    width: "100%",
    height: 90,
    borderRadius: 14,
    marginBottom: 8,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  recommendedMeta: {
    fontSize: 11,
  },
  activityPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 14,
  },
  activityPreviewContent: {
    flex: 1,
  },
  activityPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  activityPreviewMeta: {
    fontSize: 12,
  },
  activityArrow: {
    color: "#2AA8FF",
    fontSize: 18,
    fontWeight: "600",
  },
});
