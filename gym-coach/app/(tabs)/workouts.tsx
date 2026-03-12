import React, { useRef, useEffect, useState, useCallback } from "react";
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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/app/config/api";
import { useTheme } from "@/app/context/ThemeContext";
import type { ThemeColors } from "@/app/context/ThemeContext";

const { width } = Dimensions.get("window");
const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkoutRow {
  id: number;
  exercise_type: string;
  duration_seconds: number;
  overall_score: number;
  grade: string;
  total_reps: number;
  performance_tier: string;
  thumbnail_base64: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "#4ADE80";
  if (score >= 60) return "#FACC15";
  return "#F87171";
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m < 1 ? `${Math.round(seconds)}s` : `${m} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function capitalizeExercise(s: string): string {
  return s
    .split(/[_\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function tierLabel(tier: string): string {
  if (tier === "excellent") return "EXCELLENT";
  if (tier === "good") return "GOOD";
  return "NEEDS WORK";
}

function tierColor(tier: string): string {
  if (tier === "excellent") return "#4ADE80";
  if (tier === "good") return "#FACC15";
  return "#F87171";
}

// ── Animated workout card ─────────────────────────────────────────────────────
function WorkoutCard({
  workout,
  index,
  onPress,
  colors,
}: {
  workout: WorkoutRow;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const color = scoreColor(workout.overall_score);
  const score = Math.round(workout.overall_score);
  const tc = tierColor(workout.performance_tier);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.workoutCard,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.93, transform: [{ scale: 0.985 }] },
        ]}
        onPress={onPress}
      >
        {/* Thumbnail */}
        <View style={styles.cardImageWrap}>
          {workout.thumbnail_base64 ? (
            <Image
              source={{
                uri: `data:image/jpeg;base64,${workout.thumbnail_base64}`,
              }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={WORKOUT_IMAGE}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardImageOverlay} />

          {/* Score badge */}
          <View style={[styles.scoreBadge, { borderColor: color }]}>
            <Text style={[styles.scoreBadgeText, { color }]}>{score}</Text>
          </View>

          {/* Grade chip */}
          <View style={[styles.gradeBadge, { backgroundColor: `${color}25` }]}>
            <Text style={[styles.gradeText, { color }]}>{workout.grade}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardInfoTop}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {capitalizeExercise(workout.exercise_type)}
            </Text>
            <View style={[styles.tierPill, { backgroundColor: `${tc}18` }]}>
              <Text style={[styles.tierPillText, { color: tc }]}>
                {tierLabel(workout.performance_tier)}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{formatDate(workout.created_at)}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatDuration(workout.duration_seconds)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="repeat-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{workout.total_reps} reps</Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={styles.scoreBarRow}>
            <View style={[styles.scoreBarTrack, { backgroundColor: colors.surfaceHighlight }]}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${Math.min(workout.overall_score, 100)}%` as any,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.scoreBarLabel, { color }]}>{score}/100</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ fadeAnim, colors }: { fadeAnim: Animated.Value; colors: ThemeColors }) {
  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
      <View style={[styles.emptyIconRing, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="barbell-outline" size={36} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No workouts recorded yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Record your first session using the camera{"\n"}and it'll appear here
      </Text>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WorkoutsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const emptyFade = useRef(new Animated.Value(0)).current;

  const fetchWorkouts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/workouts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn("[WorkoutsScreen] fetch failed:", e);
      setError("Could not load workouts. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  // Entrance animations after data loads
  useEffect(() => {
    if (loading) return;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(statsFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    if (workouts.length === 0) {
      Animated.timing(emptyFade, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, workouts.length]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const totalWorkouts = workouts.length;
  const avgScore =
    workouts.length > 0
      ? Math.round(
          workouts.reduce((s, w) => s + w.overall_score, 0) / workouts.length
        )
      : 0;
  const totalReps = workouts.reduce((s, w) => s + (w.total_reps ?? 0), 0);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2AA8FF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading workouts…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
        <Text style={[styles.errorMsg, { color: colors.textSecondary }]}>{error}</Text>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.isDark ? '#2AA8FF' : '#171C1D' }]} onPress={() => fetchWorkouts()}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWorkouts(true)}
            tintColor="#2AA8FF"
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Past Workouts</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {totalWorkouts > 0
                ? `${totalWorkouts} session${totalWorkouts !== 1 ? "s" : ""} recorded`
                : "Your history will appear here"}
            </Text>
          </View>
          <Pressable
            style={[styles.refreshBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => fetchWorkouts(true)}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* ── Stats strip — only visible when there are workouts ── */}
        {workouts.length > 0 && (
          <Animated.View style={[styles.statsStrip, { opacity: statsFade, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalWorkouts}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: scoreColor(avgScore) }]}
              >
                {avgScore}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Score</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalReps}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Reps</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Empty state ── */}
        {workouts.length === 0 && <EmptyState fadeAnim={emptyFade} colors={colors} />}

        {/* ── Workout cards ── */}
        {workouts.map((workout, index) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            index={index}
            colors={colors}
            onPress={() =>
              router.push({
                pathname: "/workout-summary",
                params: { workoutId: String(workout.id) },
              })
            }
          />
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgBlob1: {
    position: "absolute",
    top: -40,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#2AA8FF",
    opacity: 0.06,
  },
  bgBlob2: {
    position: "absolute",
    bottom: 220,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#171C1D",
    opacity: 0.04,
  },

  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  errorMsg: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // Stats strip
  statsStrip: {
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    borderWidth: 1,
  },
  statItem: { alignItems: "center", gap: 4 },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  statDivider: { width: 1 },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    gap: 12,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  // Workout card
  workoutCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageWrap: {
    position: "relative",
    height: 150,
  },
  cardImage: { width: "100%", height: "100%" },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  scoreBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.93)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1.5,
  },
  scoreBadgeText: { fontSize: 14, fontWeight: "800" },
  gradeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  gradeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  cardInfo: { padding: 16, gap: 7 },
  cardInfoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
    letterSpacing: -0.2,
  },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierPillText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  cardDate: { fontSize: 12, fontWeight: "500" },
  cardMeta: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontWeight: "500" },
  scoreBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  scoreBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 2 },
  scoreBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 38,
    textAlign: "right",
  },
});