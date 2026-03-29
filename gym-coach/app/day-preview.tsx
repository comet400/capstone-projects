import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { API_BASE_URL } from "@/app/config/api";
import {
  type SplitId,
  getDayFocus,
  getDayName,
  getDayType,
  DAY_COLORS,
} from "@/app/lib/split-cycle";
import { SPLIT_WEEK_PLAN_KEY, type SplitWeekPlan } from "@/app/(tabs)/home";

export default function DayPreviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ date?: string; weekday?: string; splitId?: string }>();
  const [weekPlan, setWeekPlan] = useState<SplitWeekPlan | null>(null);

  const splitId: SplitId = (params.splitId as SplitId) || (user?.workout_split as SplitId) || "ppl";
  const fitnessLevel = user?.fitness_level || "intermediate";

  const date = React.useMemo(() => {
    if (params.date) return new Date(params.date);
    if (params.weekday != null) {
      const d = new Date();
      const today = d.getDay();
      let diff = Number(params.weekday) - today;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
    return new Date();
  }, [params.date, params.weekday]);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(SPLIT_WEEK_PLAN_KEY);
      if (raw) {
        setWeekPlan(JSON.parse(raw) as SplitWeekPlan);
        return;
      }
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.post<SplitWeekPlan>(
          `${API_BASE_URL}/api/workout-plan/generate-week`,
          { splitType: splitId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWeekPlan(res.data);
        await AsyncStorage.setItem(SPLIT_WEEK_PLAN_KEY, JSON.stringify(res.data));
      } catch (e) {
        console.log("day-preview: failed to generate plan", e);
      }
    };
    load();
  }, [splitId]);

  const dayType = getDayType(date, splitId, fitnessLevel);
  const focus = getDayFocus(date, splitId, fitnessLevel);
  const typeColor = DAY_COLORS[focus.type] ?? colors.textSecondary;
  const dayExercises =
    dayType !== "Rest" && weekPlan
      ? weekPlan.days?.[dayType]?.exercises ?? []
      : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getDayName(date)}</Text>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
        <Text style={[styles.typeText, { color: typeColor }]}>{focus.type}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{focus.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{focus.subtitle}</Text>

      {focus.muscleGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Focus areas</Text>
          <View style={styles.chipRow}>
            {focus.muscleGroups.map((m) => (
              <View key={m} style={[styles.chip, { backgroundColor: colors.surface }]}>
                <Text style={[styles.chipText, { color: colors.text }]}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {dayType !== "Rest" && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Exercises</Text>
          {!weekPlan ? (
            <ActivityIndicator size="small" color={typeColor} style={{ marginVertical: 12 }} />
          ) : dayExercises.length === 0 ? (
            <Text style={[styles.emptyExercises, { color: colors.textSecondary }]}>
              No exercises loaded for this day.
            </Text>
          ) : (
            dayExercises.map((ex: any, idx: number) => (
              <View key={ex.exercise_id ?? idx} style={styles.exerciseRow}>
                <Text style={[styles.exerciseBullet, { color: typeColor }]}>{idx + 1}</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name}</Text>
                  <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                    {ex.prescription?.sets ?? 0} sets × {ex.prescription?.reps ?? 0} reps
                    {ex.target_muscles ? ` · ${ex.target_muscles}` : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="bulb-outline" size={20} color={typeColor} />
        <Text style={[styles.tipText, { color: colors.text }]}>{focus.tip}</Text>
      </View>

      {focus.type === "Rest" && (
        <Text style={[styles.restNote, { color: colors.textSecondary }]}>
          Enjoy your rest day. Your next training day is coming up!
        </Text>
      )}

      <Pressable style={[styles.backButton, { backgroundColor: typeColor }]} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 15, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  chipText: { fontSize: 14, fontWeight: "600" },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  tipText: { flex: 1, fontSize: 14, lineHeight: 22 },
  restNote: { fontSize: 13, fontStyle: "italic", marginBottom: 24 },
  exerciseRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  exerciseBullet: { width: 24, fontSize: 14, fontWeight: "700" },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600" },
  exerciseMeta: { fontSize: 13, marginTop: 2 },
  emptyExercises: { fontSize: 14, fontStyle: "italic" },
  backButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
