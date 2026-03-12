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
import { Ionicons } from "@expo/vector-icons";
import { getDayFocus, getDayName, getDayType } from "./lib/ppl-cycle";
import { PPL_WEEK_PLAN_KEY, type PPLWeekPlan } from "@/app/(tabs)/home";

const colors = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  primary: "#6366F1",
  Rest: "#9CA3AF",
  Push: "#EF4444",
  Pull: "#3B82F6",
  Legs: "#10B981",
};

export default function DayPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; weekday?: string }>();
  const [weekPlan, setWeekPlan] = useState<PPLWeekPlan | null>(null);

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
    AsyncStorage.getItem(PPL_WEEK_PLAN_KEY).then((raw) => {
      if (raw) setWeekPlan(JSON.parse(raw) as PPLWeekPlan);
    });
  }, []);

  const dayType = getDayType(date);
  const focus = getDayFocus(date);
  const typeColor = colors[focus.type] ?? colors.textSecondary;
  const dayExercises =
    dayType !== "Rest" && weekPlan
      ? weekPlan[dayType.toLowerCase() as keyof PPLWeekPlan]?.exercises ?? []
      : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{getDayName(date)}</Text>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
        <Text style={[styles.typeText, { color: typeColor }]}>{focus.type}</Text>
      </View>

      <Text style={styles.title}>{focus.title}</Text>
      <Text style={styles.subtitle}>{focus.subtitle}</Text>

      {focus.muscleGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus areas</Text>
          <View style={styles.chipRow}>
            {focus.muscleGroups.map((m) => (
              <View key={m} style={styles.chip}>
                <Text style={styles.chipText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {dayType !== "Rest" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {!weekPlan ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : dayExercises.length === 0 ? (
            <Text style={styles.emptyExercises}>No exercises loaded for this day.</Text>
          ) : (
            dayExercises.map((ex, idx) => (
              <View key={ex.exercise_id ?? idx} style={styles.exerciseRow}>
                <Text style={styles.exerciseBullet}>{idx + 1}</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {ex.prescription?.sets ?? 0} sets × {ex.prescription?.reps ?? 0} reps
                    {ex.target_muscles ? ` · ${ex.target_muscles}` : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <Text style={styles.tipText}>{focus.tip}</Text>
      </View>

      {focus.type === "Rest" && (
        <Text style={styles.restNote}>
          Your Push / Pull / Legs cycle restarts on Monday with Push day.
        </Text>
      )}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 10, letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.text },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 22 },
  restNote: { fontSize: 13, color: colors.textSecondary, fontStyle: "italic", marginBottom: 24 },
  exerciseRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  exerciseBullet: { width: 24, fontSize: 14, fontWeight: "700", color: colors.primary },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600", color: colors.text },
  exerciseMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  emptyExercises: { fontSize: 14, color: colors.textSecondary, fontStyle: "italic" },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
