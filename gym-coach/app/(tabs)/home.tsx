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

const lightColors = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  primary: "#6366F1",
  secondary: "#10B981",
  accent: "#F59E0B",
  border: "#F0F0F0",
  shadow: "#000000",
};

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

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [todayPlan, setTodayPlan] = useState<GeneratedPlanResponse | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [overview, setOverview] = useState<{
  weeklyProgress: number;
  totalMinutes: number;
  totalCalories: number;
  workoutsCompleted: number;
  streak: number;
  } | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

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
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Load basic profile
      const profileRes = await axios.get(`${API_BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);

      // Generate today's workout plan
      setIsLoadingPlan(true);
      setPlanError(null);

      const planRes = await axios.post<GeneratedPlanResponse>(
        `${API_BASE_URL}/api/workout-plan/generate`,
        { durationWeeks: 4, daysPerWeek: 3, exercisesPerDay: 6 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTodayPlan(planRes.data);
    } catch (error: any) {
      console.log("Failed to load profile or plan:", error?.message ?? error);
      setPlanError("Could not generate today's workout. Please try again.");
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Call both functions
  fetchOverview();
  fetchUserAndPlan();
}, []);

  const todayDay: GeneratedPlanDay | null =
    todayPlan && todayPlan.days && todayPlan.days.length > 0
      ? todayPlan.days[0]
      : null;

  const handleStartWorkout = () => {
    // For now, navigate to the Workouts tab, where the live workout/camera flow lives.
    router.push("/(tabs)/workouts");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with profile icon */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, {user?.full_name?.split(" ")[0] || "User"}</Text>
          <Text style={styles.subGreeting}>Let's crush your goals today</Text>
        </View>
        <View style={styles.profileIcon}>
          <Text style={styles.profileInitials}>
            {user?.full_name
              ? user.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
              : "U"}
        </Text>
        </View>
      </View>

      {/* Today's Overview */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>TODAY'S OVERVIEW</Text>
          <Text style={styles.cardLink}>Details</Text>
        </View>
        
        <View style={styles.progressRow}>
          <View style={styles.progressRingContainer}>
            <View style={styles.progressRing}>
              <View style={styles.progressInner}>
                <Text style={styles.progressNumber}>
                  {overview ? `${overview.weeklyProgress}%` : "0%"} </Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>weekly Progress</Text>
          </View>

          <View style={styles.statsGrid}>
            {loadingOverview ? (
              <ActivityIndicator size="small" color={lightColors.primary} />
            ) : overviewError ? (
              <Text style={styles.errorText}>{overviewError}</Text>
            ) : overview ? (
              <>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{overview.totalMinutes}</Text>
                  <Text style={styles.statLabel}>mins</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{overview.totalCalories}</Text>
                  <Text style={styles.statLabel}>kcal</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{overview.workoutsCompleted}</Text>
                  <Text style={styles.statLabel}>workouts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{overview.streak}</Text>
                  <Text style={styles.statLabel}>streak</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.statBox}><Text style={styles.statValue}>0</Text><Text style={styles.statLabel}>mins</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>0</Text><Text style={styles.statLabel}>kcal</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>0</Text><Text style={styles.statLabel}>workouts</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>0</Text><Text style={styles.statLabel}>streak</Text></View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Today's Workout */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>TODAY'S WORKOUT</Text>
          {todayDay && (
            <Pressable onPress={handleStartWorkout}>
              <Text style={styles.cardLink}>Start</Text>
            </Pressable>
          )}
        </View>

        {isLoadingPlan && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={lightColors.primary} />
            <Text style={styles.loadingText}>Building your workout...</Text>
          </View>
        )}

        {!isLoadingPlan && planError && (
          <Text style={styles.errorText}>{planError}</Text>
        )}

        {!isLoadingPlan && todayDay && (
          <Pressable style={styles.workoutRow} onPress={handleStartWorkout}>
            <Image
              source={require("@/assets/images/home/featured.jpg")}
              style={styles.workoutImage}
            />
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>
                {todayPlan?.plan?.name ?? "Personalized Session"}
              </Text>
              <Text style={styles.workoutMeta}>
                {todayDay.exercises.length} exercises ·{" "}
                {todayDay.exercises.reduce(
                  (total, ex) => total + (ex.prescription.sets || 0),
                  0
                )}{" "}
                total sets
              </Text>
              <View style={styles.workoutTags}>
                {todayDay.exercises.slice(0, 3).map((ex) => (
                  <View key={ex.exercise_id} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {ex.target_muscles || ex.category || ex.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        )}

        {!isLoadingPlan && !todayDay && !planError && (
          <Text style={styles.emptyText}>
            No workout generated yet. Complete your profile to get started.
          </Text>
        )}
      </View>

      {/* Recent Activity Preview */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>RECENT ACTIVITY</Text>

          <Pressable onPress={() => router.push("/(tabs)/activities")}>
            <Text style={styles.cardLink}>View All</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.activityPreview}
          onPress={() => router.push("/(tabs)/activities")}
        >
          <View style={styles.activityPreviewContent}>
            <Text style={styles.activityPreviewTitle}>
              Upper Body Strength
            </Text>

            <Text style={styles.activityPreviewMeta}>
              45 min · 320 kcal · Today
            </Text>
          </View>

          <Text style={styles.activityArrow}>→</Text>
        </Pressable>
      </View>
      

      {/* Tomorrows's Workout */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>TOMORROW'S WORKOUT</Text>
          <Text style={styles.cardLink}>View</Text>
        </View>
        
        <View style={styles.workoutRow}>
          <Image
            source={require("@/assets/images/home/featured.jpg")}
            style={styles.workoutImage}
          />
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>30 Min HIIT Cardio</Text>
            <Text style={styles.workoutMeta}>3 exercises · 4 sets</Text>
            <View style={styles.workoutTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Full Body</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>HIIT</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>RECOMMENDED FOR YOU</Text>
          <Text style={styles.cardLink}>More</Text>
        </View>
        
        <View style={styles.recommendedRow}>
          <View style={styles.recommendedItem}>
            <Image
              source={require("@/assets/images/home/reco1.jpg")}
              style={styles.recommendedImage}
            />
            <Text style={styles.recommendedName}>Full Body Stretch</Text>
            <Text style={styles.recommendedMeta}>15 min · beginner</Text>
          </View>
          
          <View style={styles.recommendedItem}>
            <Image
              source={require("@/assets/images/home/reco2.jpg")}
              style={styles.recommendedImage}
            />
            <Text style={styles.recommendedName}>Core Strength</Text>
            <Text style={styles.recommendedMeta}>20 min · intermediate</Text>
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
    backgroundColor: lightColors.background,
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
    color: lightColors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  subGreeting: {
    color: lightColors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  // New profile icon styles
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lightColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  // Dashboard card styles
  dashboardCard: {
    backgroundColor: lightColors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: lightColors.border,
    shadowColor: lightColors.shadow,
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
    color: lightColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardLink: {
    color: lightColors.primary,
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
    color: lightColors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: lightColors.textSecondary,
    fontSize: 13,
  },

  // Progress section
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
    borderColor: lightColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: lightColors.background,
  },
  progressInner: {
    alignItems: "center",
  },
  progressNumber: {
    color: lightColors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  progressLabel: {
    color: lightColors.textTertiary,
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
    backgroundColor: lightColors.surface,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  statValue: {
    color: lightColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    color: lightColors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },

  // Workout section
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
    color: lightColors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  workoutMeta: {
    color: lightColors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  workoutTags: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    backgroundColor: lightColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: lightColors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },

  // Programs section
  programCard: {
    width: 130,
    marginRight: 12,
    backgroundColor: lightColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  programImage: {
    width: "100%",
    height: 80,
  },
  programCardContent: {
    padding: 10,
  },
  programCardTitle: {
    color: lightColors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  programCardMeta: {
    color: lightColors.textTertiary,
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
    color: lightColors.text,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  recommendedMeta: {
    color: lightColors.textTertiary,
    fontSize: 11,
  },

  // Upgrade card (special)
  upgradeCard: {
    backgroundColor: lightColors.primary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  upgradeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upgradeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  upgradeDescription: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  upgradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "300",
  },

  activityPreview: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: lightColors.surface,
  borderRadius: 14,
  padding: 14,
},

activityPreviewContent: {
  flex: 1,
},

activityPreviewTitle: {
  color: lightColors.text,
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 2,
},

activityPreviewMeta: {
  color: lightColors.textSecondary,
  fontSize: 12,
},

activityArrow: {
  color: lightColors.primary,
  fontSize: 18,
  fontWeight: "600",
},
});

