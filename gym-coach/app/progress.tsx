import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import { useTheme } from "@/app/context/ThemeContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  totalHours: number;
  bestScore: number;
  avgScore: number;
  totalReps: number;
  exerciseBreakdown: { name: string; count: number }[];
  weeklyWorkouts: { weekLabel: string; count: number }[];
  recentScores: { score: number; date: string; exercise: string }[];
}

interface Overview {
  weeklyProgress: number;
  totalMinutes: number;
  totalCalories: number;
  workoutsCompleted: number;
  streak: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "#4ADE80";
  if (score >= 60) return "#FACC15";
  return "#F87171";
}

function capitalizeExercise(s: string): string {
  return s
    .split(/[_\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const [statsRes, overviewRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/workouts/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(statsRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      console.warn("[Progress] fetch error:", err);
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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2AA8FF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading progress…
        </Text>
      </View>
    );
  }

  const weeklyGoal = 3;
  const completed = overview?.workoutsCompleted ?? 0;
  const progress = weeklyGoal > 0 ? Math.min((completed / weeklyGoal) * 100, 100) : 0;
  const maxWeekly = Math.max(...(stats?.weeklyWorkouts?.map((w) => w.count) ?? [1]), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor="#2AA8FF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Track your performance
      </Text>

      {/* Weekly Overview */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Overview</Text>
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            {completed} / {weeklyGoal} Workouts
          </Text>
          <MaterialCommunityIcons name="chart-line" size={22} color="#2AA8FF" />
        </View>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.background }]}>
          <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
        </View>
        {overview && (
          <View style={styles.weeklySummaryRow}>
            <Text style={[styles.weeklyDetail, { color: colors.textSecondary }]}>
              {overview.totalMinutes} min · {overview.totalCalories} kcal · {overview.streak} day streak
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="fire"
          label="Calories"
          value={stats ? stats.totalCalories.toLocaleString() : "0"}
          colors={colors}
        />
        <StatCard
          icon="clock-outline"
          label="Minutes"
          value={stats ? stats.totalMinutes.toLocaleString() : "0"}
          colors={colors}
        />
        <StatCard
          icon="arm-flex"
          label="Workouts"
          value={stats ? String(stats.totalWorkouts) : "0"}
          colors={colors}
        />
        <StatCard
          icon="trophy-outline"
          label="Streak"
          value={overview ? `${overview.streak} Days` : "0"}
          colors={colors}
        />
      </View>

      {/* Score Trend */}
      {stats && stats.recentScores.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Score Trend</Text>
          <View style={[styles.trendCard, { backgroundColor: colors.surface }]}>
            <View style={styles.trendHeader}>
              <Text style={[styles.trendAvg, { color: colors.text }]}>
                Avg: {stats.avgScore}
              </Text>
              <Text style={[styles.trendBest, { color: "#4ADE80" }]}>
                Best: {stats.bestScore}
              </Text>
            </View>
            <View style={styles.trendBars}>
              {stats.recentScores.map((s, i) => (
                <View key={i} style={styles.trendBarWrap}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: `${Math.max(s.score, 5)}%` as any,
                        backgroundColor: scoreColor(s.score),
                      },
                    ]}
                  />
                  <Text style={[styles.trendScore, { color: colors.textSecondary }]}>
                    {s.score}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Weekly Activity */}
      {stats && stats.weeklyWorkouts.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Activity</Text>
          <View style={[styles.weeklyCard, { backgroundColor: colors.surface }]}>
            <View style={styles.weeklyBars}>
              {stats.weeklyWorkouts.map((w, i) => (
                <View key={i} style={styles.weeklyBarWrap}>
                  <View
                    style={[
                      styles.weeklyBar,
                      {
                        height: maxWeekly > 0 ? `${(w.count / maxWeekly) * 100}%` as any : "0%",
                        backgroundColor: w.count > 0 ? "#2AA8FF" : colors.surfaceHighlight,
                      },
                    ]}
                  />
                  <Text style={[styles.weeklyCount, { color: colors.text }]}>{w.count}</Text>
                  <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                    {w.weekLabel}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Exercise Breakdown */}
      {stats && stats.exerciseBreakdown.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise Breakdown</Text>
          {stats.exerciseBreakdown.slice(0, 5).map((ex, i) => {
            const pct = stats.totalWorkouts > 0 ? (ex.count / stats.totalWorkouts) * 100 : 0;
            return (
              <View
                key={i}
                style={[styles.breakdownRow, { backgroundColor: colors.surface }]}
              >
                <View style={styles.breakdownInfo}>
                  <Text style={[styles.breakdownName, { color: colors.text }]}>
                    {capitalizeExercise(ex.name)}
                  </Text>
                  <Text style={[styles.breakdownCount, { color: colors.textSecondary }]}>
                    {ex.count} session{ex.count !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={[styles.breakdownTrack, { backgroundColor: colors.background }]}>
                  <View
                    style={[styles.breakdownFill, { width: `${pct}%` as any }]}
                  />
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <MaterialCommunityIcons name={icon} size={28} color="#2AA8FF" />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 56,
    marginBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, marginBottom: 4, textAlign: "center" },
  sectionTitle: { marginTop: 24, marginBottom: 12, fontSize: 16, fontWeight: "700" },

  summaryCard: { borderRadius: 20, padding: 18 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTitle: { fontSize: 15, fontWeight: "600" },
  progressBarBackground: {
    marginTop: 14, height: 10, borderRadius: 10, overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#2AA8FF", borderRadius: 10 },
  weeklySummaryRow: { marginTop: 10 },
  weeklyDetail: { fontSize: 12, fontWeight: "500" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: "48%", borderRadius: 20, padding: 20, marginBottom: 14 },
  statValue: { marginTop: 12, fontSize: 18, fontWeight: "700" },
  statLabel: { marginTop: 4, fontSize: 11, fontWeight: "600" },

  trendCard: { borderRadius: 20, padding: 18 },
  trendHeader: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 16,
  },
  trendAvg: { fontSize: 14, fontWeight: "700" },
  trendBest: { fontSize: 14, fontWeight: "700" },
  trendBars: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-around", height: 100,
  },
  trendBarWrap: { alignItems: "center", flex: 1, justifyContent: "flex-end", height: "100%" },
  trendBar: { width: 12, borderRadius: 6, minHeight: 4 },
  trendScore: { fontSize: 9, fontWeight: "600", marginTop: 4 },

  weeklyCard: { borderRadius: 20, padding: 18 },
  weeklyBars: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-around", height: 100,
  },
  weeklyBarWrap: { alignItems: "center", flex: 1, justifyContent: "flex-end", height: "100%" },
  weeklyBar: { width: 28, borderRadius: 8, minHeight: 4 },
  weeklyCount: { fontSize: 12, fontWeight: "700", marginTop: 6 },
  weeklyLabel: { fontSize: 9, fontWeight: "500", marginTop: 2 },

  breakdownRow: {
    borderRadius: 16, padding: 16, marginBottom: 10,
  },
  breakdownInfo: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 10,
  },
  breakdownName: { fontSize: 14, fontWeight: "600" },
  breakdownCount: { fontSize: 12, fontWeight: "500" },
  breakdownTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  breakdownFill: { height: "100%", backgroundColor: "#2AA8FF", borderRadius: 3 },
});
