import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/app/config/api";
import { useTheme } from "@/app/context/ThemeContext";

import { useAuth } from "@/app/context/AuthContext";
import {
  type SplitId,
  type GoalId,
  type DayType,
  getDayType,
  getDayName,
  getDayFocus,
  DAY_COLORS,
  GOAL_COLORS,
  getSplitDefinition,
  getGoalDefinition,
} from "@/app/lib/split-cycle";

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
  prescription: {
    sets: number;
    reps: number;
    duration_seconds: number;
    rest_seconds: number;
  };
};

type GeneratedPlanDay = {
  plan_day_id: number | string;
  day_number: number;
  day_label: string;
  exercises: GeneratedPlanDayExercise[];
};

export const SPLIT_WEEK_PLAN_KEY = "split_week_plan";

export type SplitWeekPlan = {
  splitType: string;
  splitName: string;
  schedule: DayType[];
  days: Record<string, GeneratedPlanDay>;
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [weekPlan, setWeekPlan] = useState<SplitWeekPlan | null>(null);
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

  const splitId: SplitId = (authUser?.workout_split as SplitId) || (user?.workout_split as SplitId) || "ppl";
  const goalId: GoalId = (authUser?.fitness_goal as GoalId) || (user?.fitness_goal as GoalId) || "gain_muscle";
  const splitDef = getSplitDefinition(splitId);
  const goalDef = getGoalDefinition(goalId);
  const lastLoadedSplit = useRef<string | null>(null);
  const lastLoadedGoal = useRef<string | null>(null);

  // Re-sync local user state when AuthContext changes (e.g. goal/split changed on another screen)
  useEffect(() => {
    if (authUser) {
      setUser((prev: any) => prev ? { ...prev, fitness_goal: authUser.fitness_goal, workout_split: authUser.workout_split } : prev);
    }
  }, [authUser?.fitness_goal, authUser?.workout_split]);

  const loadData = useCallback(async (force = false) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    let profileSplitId: SplitId = splitId;
    let profileGoalId: GoalId = goalId;
    try {
      const profileRes = await axios.get(`${API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);
      if (profileRes.data.workout_split) {
        profileSplitId = profileRes.data.workout_split as SplitId;
      }
      if (profileRes.data.fitness_goal) {
        profileGoalId = profileRes.data.fitness_goal as GoalId;
      }
      updateUser({ workout_split: profileRes.data.workout_split, fitness_goal: profileRes.data.fitness_goal });
    } catch (e) {
      console.log("Failed to load profile:", e);
    }

    const cached = await AsyncStorage.getItem(SPLIT_WEEK_PLAN_KEY);
    const cachedPlan = cached ? (JSON.parse(cached) as SplitWeekPlan) : null;
    const cacheValid = cachedPlan
      && cachedPlan.splitType === profileSplitId
      && (cachedPlan as any).goal === profileGoalId;

    if (cacheValid && !force && lastLoadedSplit.current === profileSplitId && lastLoadedGoal.current === profileGoalId) {
      setWeekPlan(cachedPlan);
      return;
    }

    lastLoadedSplit.current = profileSplitId;
    lastLoadedGoal.current = profileGoalId;
    setIsLoadingPlan(true);
    setPlanError(null);
    setWeekPlan(null);

    try {
      const weekRes = await axios.post<SplitWeekPlan>(
        `${API_BASE_URL}/api/workout-plan/generate-week`,
        { splitType: profileSplitId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWeekPlan(weekRes.data);
      await AsyncStorage.setItem(SPLIT_WEEK_PLAN_KEY, JSON.stringify(weekRes.data));
    } catch (error: any) {
      console.log("Generate week failed:", error?.message ?? error);
      try {
        const weekViaGenerate = await axios.post<SplitWeekPlan>(
          `${API_BASE_URL}/api/workout-plan/generate`,
          { week: true, splitType: profileSplitId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWeekPlan(weekViaGenerate.data);
        await AsyncStorage.setItem(SPLIT_WEEK_PLAN_KEY, JSON.stringify(weekViaGenerate.data));
      } catch (_e) {
        console.log("Fallback week generation also failed");
        setPlanError("Could not generate workout plan. Please try again.");
      }
    } finally {
      setIsLoadingPlan(false);
    }
  }, [splitId, goalId, updateUser]);

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
    fetchOverview();

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const fitnessLevel = user?.fitness_level || authUser?.fitness_level || "intermediate";
  const todayType = getDayType(new Date(), splitId, fitnessLevel);

  const todayDay: GeneratedPlanDay | null =
    weekPlan && todayType !== "Rest"
      ? weekPlan.days?.[todayType] ?? null
      : null;

  const todayDisplayName = todayDay ? todayType : "Workout";

  const tomorrowDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })();
  const tomorrowType = getDayType(tomorrowDate, splitId, fitnessLevel);
  const tomorrowFocus = getDayFocus(tomorrowDate, splitId, fitnessLevel);

  const handleStartWorkout = () => {
    if (!todayDay) return;
    const planPayload = {
      plan: {
        plan_id: 0,
        name: todayDisplayName,
      },
      day: todayDay,
    };
    AsyncStorage.setItem("active_workout_plan", JSON.stringify(planPayload));
    router.push("/today-workout");
  };

  const todayColor = DAY_COLORS[todayType] || DAY_COLORS.Rest;

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
            {(user?.full_name || authUser?.full_name)
              ? (user?.full_name || authUser?.full_name)
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
              : "U"}
          </Text>
        </Pressable>
      </View>

      {/* Current split & goal badges */}
      <View style={styles.badgeRow}>
        <Pressable
          style={[styles.splitBadge, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}
          onPress={() => router.push("/split-selector")}
        >
          <View style={styles.splitBadgeLeft}>
            <View style={[styles.splitDot, { backgroundColor: "#2AA8FF" }]} />
            <Text style={[styles.splitBadgeText, { color: colors.text }]} numberOfLines={1}>{splitDef.shortName}</Text>
          </View>
          <Text style={styles.splitBadgeAction}>Change</Text>
        </Pressable>
        <Pressable
          style={[styles.splitBadge, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}
          onPress={() => router.push("/goal-selector")}
        >
          <View style={styles.splitBadgeLeft}>
            <View style={[styles.splitDot, { backgroundColor: GOAL_COLORS[goalId] || "#2AA8FF" }]} />
            <Text style={[styles.splitBadgeText, { color: colors.text }]} numberOfLines={1}>{goalDef.shortName}</Text>
          </View>
          <Text style={styles.splitBadgeAction}>Change</Text>
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
          {todayType !== "Rest" && (
            <View style={[styles.dayTypePill, { backgroundColor: todayColor + "22" }]}>
              <Text style={[styles.dayTypePillText, { color: todayColor }]}>{todayType}</Text>
            </View>
          )}
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
              <Text style={[styles.workoutName, { color: colors.text }]}>Rest Day</Text>
              <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
                Recovery · Light stretch or rest
              </Text>
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
                {(todayDay as any).estimatedMinutes ? ` · ~${(todayDay as any).estimatedMinutes} min` : ""}
              </Text>
            </View>
          </Pressable>
        )}

        {!isLoadingPlan && !todayDay && !planError && todayType !== "Rest" && (
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

      {/* Tomorrow's Workout */}
      <View style={[styles.dashboardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>TOMORROW'S WORKOUT</Text>
          <Pressable onPress={() => router.push({ pathname: "/day-preview", params: { date: tomorrowDate.toISOString(), splitId } })}>
            <Text style={styles.cardLink}>View</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.workoutRow}
          onPress={() => router.push({ pathname: "/day-preview", params: { date: tomorrowDate.toISOString(), splitId } })}
        >
          <Image
            source={require("@/assets/images/home/featured.jpg")}
            style={styles.workoutImage}
          />
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: colors.text }]}>
              {tomorrowType === "Rest" ? "Rest Day" : `${tomorrowType}`}
            </Text>
            <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
              {tomorrowType === "Rest"
                ? "Recovery · Light stretch or rest"
                : tomorrowFocus.muscleGroups.join(", ")}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Week plan */}
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
    marginBottom: 12,
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
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  splitBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  splitBadgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  splitBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  splitBadgeAction: {
    color: "#2AA8FF",
    fontSize: 13,
    fontWeight: "600",
  },
  dayTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayTypePillText: {
    fontSize: 12,
    fontWeight: "700",
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
});
