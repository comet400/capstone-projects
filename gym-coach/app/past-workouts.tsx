import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/app/config/api";

const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Animated workout card ─────────────────────────────────────────────────
function WorkoutCard({
  workout,
  index,
  onPress,
}: {
  workout: WorkoutRow;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const color = scoreColor(workout.overall_score);
  const score = Math.round(workout.overall_score);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.workoutCard,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
        onPress={onPress}
      >
        {/* Thumbnail */}
        <View style={styles.workoutImageWrap}>
          {workout.thumbnail_base64 ? (
            <Image
              source={{
                uri: `data:image/jpeg;base64,${workout.thumbnail_base64}`,
              }}
              style={styles.workoutImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={WORKOUT_IMAGE}
              style={styles.workoutImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.imageOverlay} />

          {/* Score badge */}
          <View style={[styles.scoreBadge, { borderColor: color }]}>
            <Text style={[styles.scoreText, { color }]}>{score}</Text>
          </View>

          {/* Grade chip */}
          <View style={[styles.gradeBadge, { backgroundColor: `${color}22` }]}>
            <Text style={[styles.gradeText, { color }]}>{workout.grade}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.workoutInfo}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {capitalizeExercise(workout.exercise_type)}
            </Text>
            <View
              style={[
                styles.tierChip,
                {
                  backgroundColor:
                    workout.performance_tier === "excellent"
                      ? "#4ADE8018"
                      : workout.performance_tier === "good"
                      ? "#FACC1518"
                      : "#F8717118",
                },
              ]}
            >
              <Text
                style={[
                  styles.tierText,
                  {
                    color:
                      workout.performance_tier === "excellent"
                        ? "#4ADE80"
                        : workout.performance_tier === "good"
                        ? "#FACC15"
                        : "#F87171",
                  },
                ]}
              >
                {workout.performance_tier === "excellent"
                  ? "EXCELLENT"
                  : workout.performance_tier === "good"
                  ? "GOOD"
                  : "NEEDS WORK"}
              </Text>
            </View>
          </View>

          <Text style={styles.workoutDate}>{formatDate(workout.created_at)}</Text>

          <View style={styles.workoutDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color="#6B6B6B" />
              <Text style={styles.detailText}>
                {formatDuration(workout.duration_seconds)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="repeat-outline" size={14} color="#6B6B6B" />
              <Text style={styles.detailText}>{workout.total_reps} reps</Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={styles.scoreBarWrap}>
            <View style={styles.scoreBarTrack}>
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

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="barbell-outline" size={32} color="#3A3A3A" />
      </View>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Record your first session to see it here
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PastWorkoutsScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn("[PastWorkouts] fetch failed:", e);
      setError("Failed to load workouts. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time the screen comes into focus (e.g. returning from summary)
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  // ─── Computed stats ──────────────────────────────────────────────────────
  const totalWorkouts = workouts.length;
  const avgScore =
    workouts.length > 0
      ? Math.round(
          workouts.reduce((s, w) => s + w.overall_score, 0) / workouts.length
        )
      : 0;
  const totalReps = workouts.reduce((s, w) => s + w.total_reps, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchWorkouts(true)}
          tintColor="#4ADE80"
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Past Workouts</Text>
        <Pressable style={styles.filterBtn} onPress={() => fetchWorkouts(true)}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* ── Stats summary ── */}
      {!loading && workouts.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: scoreColor(avgScore) }]}>
              {avgScore}
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalReps}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </View>
        </View>
      )}

      {/* ── Content states ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#4ADE80" size="large" />
          <Text style={styles.loadingText}>Loading workouts…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={36} color="#F87171" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchWorkouts()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : workouts.length === 0 ? (
        <EmptyState />
      ) : (
        workouts.map((workout, index) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/workout-summary",
                params: { workoutId: String(workout.id) },
              })
            }
          />
        ))
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },

  // Stats card
  statsCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    color: "#5A5A5A",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#2A2A2A",
  },

  // Workout card
  workoutCard: {
    backgroundColor: "#161616",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222",
  },
  workoutImageWrap: {
    position: "relative",
    height: 155,
  },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  scoreBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(13,13,13,0.85)",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: "800",
  },
  gradeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Card info section
  workoutInfo: {
    padding: 16,
    gap: 8,
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  workoutTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  tierChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  workoutDate: {
    color: "#4A4A4A",
    fontSize: 12,
    fontWeight: "500",
  },
  workoutDetails: {
    flexDirection: "row",
    gap: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    color: "#6B6B6B",
    fontSize: 12,
    fontWeight: "500",
  },

  // Score bar
  scoreBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  scoreBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  scoreBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 38,
    textAlign: "right",
  },

  // Loading
  loadingWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
  },
  loadingText: {
    color: "#4A4A4A",
    fontSize: 14,
    fontWeight: "500",
  },

  // Error
  errorWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 14,
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#5A5A5A",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginBottom: 4,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#4A4A4A",
    fontSize: 14,
    textAlign: "center",
  },
});