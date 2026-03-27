import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import { useTheme } from "@/app/context/ThemeContext";

const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  totalWorkouts: number;
  totalMinutes: number;
  totalHours: number;
  bestScore: number;
  avgScore: number;
  totalReps: number;
}

interface Overview {
  streak: number;
  workoutsCompleted: number;
}

interface Highlight {
  id: string;
  type: "achievement" | "milestone" | "personal-best";
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
}

// ── Compute highlights from real data ─────────────────────────────────────────
function computeHighlights(stats: Stats, overview: Overview): Highlight[] {
  const highlights: Highlight[] = [];

  // Streak achievements
  const streak = overview.streak ?? 0;
  if (streak >= 30) {
    highlights.push({
      id: "streak-30",
      type: "achievement",
      title: "30 Day Streak! 🔥",
      description: `Incredible! You've worked out for ${streak} consecutive days`,
      icon: "flame",
      color: "#F87171",
      badge: "🔥",
    });
  } else if (streak >= 7) {
    highlights.push({
      id: "streak-7",
      type: "achievement",
      title: `${streak} Day Streak!`,
      description: `You've completed workouts for ${streak} consecutive days`,
      icon: "flame",
      color: "#F87171",
      badge: "🔥",
    });
  } else if (streak >= 3) {
    highlights.push({
      id: "streak-3",
      type: "achievement",
      title: `${streak} Day Streak`,
      description: `You're building momentum — ${streak} days in a row!`,
      icon: "flame",
      color: "#F87171",
      badge: "🔥",
    });
  }

  // Workout milestones
  const total = stats.totalWorkouts;
  const milestones = [100, 50, 25, 10, 5];
  for (const m of milestones) {
    if (total >= m) {
      highlights.push({
        id: `milestone-${m}`,
        type: "milestone",
        title: `${m} Workouts Completed`,
        description:
          m >= 100
            ? "Incredible dedication! You're a gym legend!"
            : m >= 50
            ? "Half century of workouts — amazing commitment!"
            : m >= 25
            ? "Quarter century milestone — great consistency!"
            : m >= 10
            ? "Double digits! You're building a solid habit"
            : "You're off to a great start!",
        icon: "trophy",
        color: "#FACC15",
        badge: "🏆",
      });
      break; // Only show the highest milestone
    }
  }

  // Best score achievement
  if (stats.bestScore >= 90) {
    highlights.push({
      id: "score-90",
      type: "personal-best",
      title: "Elite Form Score",
      description: `Best score: ${stats.bestScore}/100 — your form is outstanding!`,
      icon: "star",
      color: "#4ADE80",
      badge: "⭐",
    });
  } else if (stats.bestScore >= 70) {
    highlights.push({
      id: "score-70",
      type: "personal-best",
      title: "Great Form Score",
      description: `Best score: ${stats.bestScore}/100 — solid technique!`,
      icon: "star",
      color: "#4ADE80",
      badge: "⭐",
    });
  }

  // Hours trained milestones
  const hours = stats.totalHours ?? 0;
  if (hours >= 50) {
    highlights.push({
      id: "hours-50",
      type: "milestone",
      title: `${hours} Hours Trained`,
      description: "You've logged over 50 hours of training time!",
      icon: "time",
      color: "#2AA8FF",
      badge: "⏱️",
    });
  } else if (hours >= 10) {
    highlights.push({
      id: "hours-10",
      type: "milestone",
      title: `${hours} Hours Trained`,
      description: "Great progress — keep pushing!",
      icon: "time",
      color: "#2AA8FF",
      badge: "⏱️",
    });
  }

  // Total reps milestone
  if (stats.totalReps >= 1000) {
    highlights.push({
      id: "reps-1000",
      type: "milestone",
      title: `${stats.totalReps.toLocaleString()} Total Reps`,
      description: "Over a thousand reps! Pure dedication!",
      icon: "repeat",
      color: "#8B5CF6",
      badge: "💪",
    });
  } else if (stats.totalReps >= 100) {
    highlights.push({
      id: "reps-100",
      type: "achievement",
      title: `${stats.totalReps} Total Reps`,
      description: "Building strength rep by rep!",
      icon: "repeat",
      color: "#8B5CF6",
      badge: "💪",
    });
  }

  // If no highlights at all, add an encouraging one
  if (highlights.length === 0) {
    highlights.push({
      id: "start",
      type: "achievement",
      title: "Your Journey Begins",
      description: "Complete your first workout to start earning highlights!",
      icon: "rocket",
      color: "#2AA8FF",
      badge: "🚀",
    });
  }

  return highlights;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HighlightsScreen() {
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
      console.warn("[Highlights] fetch error:", err);
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
          Loading highlights…
        </Text>
      </View>
    );
  }

  const safeStats: Stats = stats ?? {
    totalWorkouts: 0, totalMinutes: 0, totalHours: 0,
    bestScore: 0, avgScore: 0, totalReps: 0,
  };
  const safeOverview: Overview = overview ?? { streak: 0, workoutsCompleted: 0 };
  const highlights = computeHighlights(safeStats, safeOverview);

  const STATS_DISPLAY = [
    { label: "Current Streak", value: `${safeOverview.streak} days`, icon: "flame", color: "#F87171" },
    { label: "Total Workouts", value: String(safeStats.totalWorkouts), icon: "barbell", color: "#2AA8FF" },
    { label: "Best Score", value: safeStats.bestScore > 0 ? `${safeStats.bestScore}/100` : "—", icon: "star", color: "#4ADE80" },
    { label: "Hours Trained", value: `${safeStats.totalHours}h`, icon: "time", color: "#FACC15" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Highlights</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {STATS_DISPLAY.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconWrap, { backgroundColor: stat.color + "20" }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Highlights List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Achievements</Text>
      </View>

      {highlights.map((highlight) => (
        <View key={highlight.id} style={[styles.highlightCard, { backgroundColor: colors.surface }]}>
          <View style={styles.highlightHeader}>
            <View style={styles.highlightLeft}>
              <View
                style={[styles.highlightIconWrap, { backgroundColor: highlight.color + "20" }]}
              >
                <Ionicons
                  name={highlight.icon as any}
                  size={28}
                  color={highlight.color}
                />
              </View>
              <View style={styles.highlightTextWrap}>
                <Text style={[styles.highlightTitle, { color: colors.text }]}>
                  {highlight.title}
                </Text>
                <Text style={[styles.highlightDescription, { color: colors.textSecondary }]}>
                  {highlight.description}
                </Text>
              </View>
            </View>
            <Text style={styles.highlightBadge}>{highlight.badge}</Text>
          </View>
          <View style={[styles.highlightFooter, { borderTopColor: colors.border }]}>
            <View style={[styles.typeBadge, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.typeText, { color: colors.textSecondary }]}>
                {highlight.type}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Featured Achievement */}
      <View style={styles.featuredCard}>
        <View style={styles.featuredImageWrap}>
          <Image source={WORKOUT_IMAGE} style={styles.featuredImage} />
          <View style={styles.featuredOverlay} />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredBadge}>
              {safeStats.totalWorkouts >= 50 ? "🏆" : safeStats.totalWorkouts >= 10 ? "⭐" : "🚀"}
            </Text>
            <Text style={styles.featuredTitle}>
              {safeStats.totalWorkouts >= 50
                ? "Champion Status"
                : safeStats.totalWorkouts >= 10
                ? "Rising Star"
                : "Getting Started"}
            </Text>
            <Text style={styles.featuredSubtitle}>
              {safeStats.totalWorkouts >= 50
                ? "Your dedication is truly inspiring!"
                : safeStats.totalWorkouts >= 10
                ? "You're building an amazing habit!"
                : "Every journey starts with a single step!"}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "500" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },

  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
  },
  statCard: {
    width: "47%", borderRadius: 16, padding: 16, alignItems: "center",
  },
  statIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  statValue: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: "center" },

  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },

  highlightCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
  highlightHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 12,
  },
  highlightLeft: { flexDirection: "row", gap: 12, flex: 1 },
  highlightIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  highlightTextWrap: { flex: 1 },
  highlightTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  highlightDescription: { fontSize: 13, lineHeight: 18 },
  highlightBadge: { fontSize: 32 },
  highlightFooter: {
    flexDirection: "row", justifyContent: "flex-end",
    alignItems: "center", paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  typeText: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },

  featuredCard: { borderRadius: 18, overflow: "hidden", marginTop: 8, marginBottom: 8 },
  featuredImageWrap: { position: "relative", height: 200 },
  featuredImage: { width: "100%", height: "100%" },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  featuredContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 20, alignItems: "center",
  },
  featuredBadge: { fontSize: 48, marginBottom: 8 },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  featuredSubtitle: { color: "#CFCFCF", fontSize: 13, textAlign: "center" },
});
