import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getWeekSchedule } from "./lib/ppl-cycle";
import { PPL_WEEK_PLAN_KEY, type PPLWeekPlan } from "@/app/(tabs)/home";

const colors = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  primary: "#6366F1",
  border: "#F0F0F0",
  Rest: "#9CA3AF",
  Push: "#EF4444",
  Pull: "#3B82F6",
  Legs: "#10B981",
};

export default function WeekPlanScreen() {
  const router = useRouter();
  const [weekPlan, setWeekPlan] = useState<PPLWeekPlan | null>(null);
  const week = React.useMemo(() => getWeekSchedule(new Date()), []);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(PPL_WEEK_PLAN_KEY).then((raw) => {
        if (raw) setWeekPlan(JSON.parse(raw) as PPLWeekPlan);
      });
    }, [])
  );

  const getExerciseCount = (dayType: string) => {
    if (!weekPlan || dayType === "Rest") return 0;
    const day = weekPlan[dayType.toLowerCase() as keyof PPLWeekPlan];
    return day?.exercises?.length ?? 0;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Your week</Text>
      </View>

      <Text style={styles.intro}>
        Push / Pull / Legs split. Sunday is rest; cycle restarts Monday. Tap a day to see exercises.
      </Text>

      {week.map((day) => {
        const typeColor = colors[day.type] ?? colors.textSecondary;
        const count = getExerciseCount(day.type);
        return (
          <Pressable
            key={day.dayName}
            style={styles.dayCard}
            onPress={() =>
              router.push({
                pathname: "/day-preview",
                params: { date: day.date.toISOString() },
              })
            }
          >
            <View style={styles.dayLeft}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              {(day.isToday || day.isTomorrow) && (
                <View style={[styles.badge, day.isToday && styles.badgeToday]}>
                  <Text style={styles.badgeText}>
                    {day.isToday ? "Today" : "Tomorrow"}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.typePill, { backgroundColor: typeColor + "22" }]}>
              <Text style={[styles.typePillText, { color: typeColor }]}>
                {day.type}
                {count > 0 ? ` · ${count} exercises` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        );
      })}

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
    paddingBottom: 12,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  dayName: { fontSize: 16, fontWeight: "600", color: colors.text },
  badge: { backgroundColor: colors.primary + "22", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeToday: { backgroundColor: "#10B98122" },
  badgeText: { fontSize: 11, fontWeight: "600", color: colors.primary },
  typePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  typePillText: { fontSize: 13, fontWeight: "700" },
});
