import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import {
  type SplitId,
  type GoalId,
  type DayType,
  getAllSplits,
  getWeekEntries,
  getWeekSchedule,
  DAY_COLORS,
  GOAL_COLORS,
  getSplitDefinition,
  getGoalDefinition,
} from "@/app/lib/split-cycle";
import { SPLIT_WEEK_PLAN_KEY, type SplitWeekPlan } from "@/app/(tabs)/home";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MON_SUN_INDICES = [1, 2, 3, 4, 5, 6, 0];

function shortLabel(dayType: DayType): string {
  const map: Record<string, string> = {
    Push: "Push", Pull: "Pull", Legs: "Legs",
    "Chest/Back": "C/B", "Shoulders/Arms": "S/A",
    Chest: "Chest", Back: "Back", Shoulders: "Shld", Arms: "Arms",
    Upper: "Upper", Lower: "Lower", "Full Body": "Full",
  };
  return map[dayType] || dayType;
}

export default function WeekPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateUser, token } = useAuth();
  const [weekPlan, setWeekPlan] = useState<SplitWeekPlan | null>(null);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeSplit, setActiveSplit] = useState<SplitId>(
    (user?.workout_split as SplitId) || "ppl"
  );
  const [savedSplit, setSavedSplit] = useState<SplitId>(activeSplit);
  const [currentGoal, setCurrentGoal] = useState<GoalId>(
    (user?.fitness_goal as GoalId) || "gain_muscle"
  );
  const prevGoalRef = useRef(currentGoal);
  const splitDef = getSplitDefinition(activeSplit);
  const fitnessLevel = user?.fitness_level || "intermediate";
  const splits = getAllSplits();

  const week = React.useMemo(
    () => getWeekEntries(new Date(), activeSplit, fitnessLevel),
    [activeSplit, fitnessLevel]
  );

  // Sync goal from AuthContext (fires when goal-selector updates context)
  useEffect(() => {
    const newGoal = (user?.fitness_goal as GoalId) || "gain_muscle";
    setCurrentGoal(newGoal);
  }, [user?.fitness_goal]);

  // Regenerate plan when goal changes (not on initial mount)
  useEffect(() => {
    if (currentGoal === prevGoalRef.current) return;
    prevGoalRef.current = currentGoal;

    const regenerate = async () => {
      const authToken = token || (await AsyncStorage.getItem("token"));
      if (!authToken) return;
      await AsyncStorage.removeItem(SPLIT_WEEK_PLAN_KEY);
      setWeekPlan(null);
      try {
        const weekRes = await axios.post<SplitWeekPlan>(
          `${API_BASE_URL}/api/workout-plan/generate-week`,
          { splitType: activeSplit },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setWeekPlan(weekRes.data);
        await AsyncStorage.setItem(SPLIT_WEEK_PLAN_KEY, JSON.stringify(weekRes.data));
      } catch (e) {
        console.log("Failed to regenerate after goal change:", e);
      }
    };
    regenerate();
  }, [currentGoal, activeSplit, token]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        let dbSplit: SplitId = (user?.workout_split as SplitId) || "ppl";
        const authToken = token || (await AsyncStorage.getItem("token"));

        try {
          if (authToken) {
            const res = await axios.get(`${API_BASE_URL}/api/profile/`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            dbSplit = (res.data.workout_split as SplitId) || "ppl";
            setActiveSplit(dbSplit);
            setSavedSplit(dbSplit);
            const dbGoal = (res.data.fitness_goal as GoalId) || "gain_muscle";
            setCurrentGoal(dbGoal);
            updateUser({ workout_split: dbSplit, fitness_goal: dbGoal });
          }
        } catch (e) {
          console.log("Failed to fetch split:", e);
        }

        const raw = await AsyncStorage.getItem(SPLIT_WEEK_PLAN_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as SplitWeekPlan;
          setWeekPlan(cached);
        } else if (authToken) {
          try {
            const weekRes = await axios.post<SplitWeekPlan>(
              `${API_BASE_URL}/api/workout-plan/generate-week`,
              { splitType: dbSplit },
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setWeekPlan(weekRes.data);
            await AsyncStorage.setItem(SPLIT_WEEK_PLAN_KEY, JSON.stringify(weekRes.data));
          } catch (e) {
            console.log("Failed to regenerate week plan:", e);
          }
        }
      };
      load();
    }, [])
  );

  const getExerciseCount = (dayType: string) => {
    if (!weekPlan || dayType === "Rest") return 0;
    if (weekPlan.splitType !== activeSplit) return 0;
    const day = weekPlan.days?.[dayType];
    return day?.exercises?.length ?? 0;
  };

  const handleSelectSplit = (id: SplitId) => {
    setActiveSplit(id);
  };

  const handleConfirmSplit = useCallback(async () => {
    if (activeSplit === savedSplit) {
      setShowSplitPicker(false);
      return;
    }

    setSaving(true);
    try {
      const authToken = token || (await AsyncStorage.getItem("token"));
      if (!authToken) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/profile/update-split`,
        { workout_split: activeSplit },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      updateUser({ workout_split: activeSplit });
      setSavedSplit(activeSplit);
      await AsyncStorage.removeItem(SPLIT_WEEK_PLAN_KEY);
      setWeekPlan(null);
      setShowSplitPicker(false);

      try {
        const weekRes = await axios.post<SplitWeekPlan>(
          `${API_BASE_URL}/api/workout-plan/generate-week`,
          { splitType: activeSplit },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setWeekPlan(weekRes.data);
        await AsyncStorage.setItem(SPLIT_WEEK_PLAN_KEY, JSON.stringify(weekRes.data));
      } catch {
        // Plan will regenerate on next home screen load
      }
    } catch (err: any) {
      console.error("Failed to save split:", err?.message ?? err);
      Alert.alert("Error", "Failed to save your training split. Please try again.");
      setActiveSplit(savedSplit);
    } finally {
      setSaving(false);
    }
  }, [activeSplit, savedSplit, token, updateUser]);

  const hasChanges = activeSplit !== savedSplit;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Week</Text>
      </View>

      {/* Current split row — tap to expand the picker */}
      <Pressable
        style={[styles.splitInfoRow, { backgroundColor: colors.surface, borderColor: showSplitPicker ? "#2AA8FF" : colors.border }]}
        onPress={() => setShowSplitPicker(!showSplitPicker)}
      >
        <MaterialCommunityIcons name={splitDef.icon as any} size={20} color="#2AA8FF" />
        <Text style={[styles.splitInfoText, { color: colors.text }]}>{splitDef.name}</Text>
        <Ionicons
          name={showSplitPicker ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Inline split picker list */}
      {showSplitPicker && (
        <View style={[styles.splitPickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.textSecondary }]}>
            CHOOSE YOUR TRAINING SPLIT
          </Text>

          {splits.map((split) => {
            const isSelected = activeSplit === split.id;
            const isCurrent = savedSplit === split.id;
            const schedule = getWeekSchedule(split.id, fitnessLevel);
            const activeDays = schedule.filter((d) => d !== "Rest").length;

            return (
              <Pressable
                key={split.id}
                style={[
                  styles.splitOption,
                  {
                    backgroundColor: isSelected ? "#2AA8FF10" : colors.background,
                    borderColor: isSelected ? "#2AA8FF" : colors.border,
                  },
                ]}
                onPress={() => handleSelectSplit(split.id)}
              >
                <View style={styles.splitOptionHeader}>
                  <View style={styles.splitOptionLeft}>
                    <MaterialCommunityIcons
                      name={split.icon as any}
                      size={20}
                      color={isSelected ? "#2AA8FF" : colors.textSecondary}
                    />
                    <View>
                      <View style={styles.splitNameRow}>
                        <Text style={[styles.splitOptionName, { color: colors.text }]}>
                          {split.name}
                        </Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Current</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.splitOptionDesc, { color: colors.textSecondary }]}>
                        {activeDays} days/week · {split.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#2AA8FF" />
                  )}
                </View>

                {/* Mini week preview */}
                <View style={styles.miniWeekRow}>
                  {MON_SUN_INDICES.map((schedIdx, displayIdx) => {
                    const dayType = schedule[schedIdx];
                    const color = DAY_COLORS[dayType] || DAY_COLORS.Rest;
                    const isRest = dayType === "Rest";
                    return (
                      <View key={displayIdx} style={styles.miniDayCol}>
                        <Text style={[styles.miniDayLabel, { color: colors.textSecondary }]}>
                          {DAY_LABELS[displayIdx]}
                        </Text>
                        <View style={[styles.miniDayPill, { backgroundColor: color + (isRest ? "15" : "20") }]}>
                          <Text style={[styles.miniDayText, { color }]} numberOfLines={1}>
                            {isRest ? "Off" : shortLabel(dayType)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            );
          })}

          {/* Confirm / Cancel buttons */}
          <View style={styles.pickerActions}>
            {hasChanges ? (
              <>
                <Pressable
                  style={[styles.pickerCancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setActiveSplit(savedSplit); setShowSplitPicker(false); }}
                >
                  <Text style={[styles.pickerCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.pickerConfirmBtn, saving && { opacity: 0.6 }]}
                  onPress={handleConfirmSplit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.pickerConfirmText}>Apply & Regenerate</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.pickerDoneBtn}
                onPress={() => setShowSplitPicker(false)}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Goal indicator */}
      <Pressable
        style={[styles.splitInfoRow, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 16 }]}
        onPress={() => router.push("/goal-selector" as any)}
      >
        <MaterialCommunityIcons
          name={getGoalDefinition(currentGoal).icon as any}
          size={20}
          color={GOAL_COLORS[currentGoal]}
        />
        <Text style={[styles.splitInfoText, { color: colors.text }]}>
          {getGoalDefinition(currentGoal).name}
        </Text>
        <Text style={{ color: "#2AA8FF", fontSize: 12, fontWeight: "600" }}>Change</Text>
      </Pressable>

      {/* Description */}
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        {splitDef.description}. Tap a day to see exercises.
      </Text>

      {/* Weekly schedule */}
      {week.map((day) => {
        const typeColor = DAY_COLORS[day.type] ?? "#9CA3AF";
        const count = getExerciseCount(day.type);
        return (
          <Pressable
            key={day.dayName}
            style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() =>
              router.push({
                pathname: "/day-preview",
                params: { date: day.date.toISOString(), splitId: activeSplit },
              })
            }
          >
            <View style={styles.dayLeft}>
              <Text style={[styles.dayName, { color: colors.text }]}>{day.dayName}</Text>
              {(day.isToday || day.isTomorrow) && (
                <View style={[styles.badge, day.isToday && styles.badgeToday]}>
                  <Text style={[styles.badgeText, { color: day.isToday ? "#10B981" : "#6366F1" }]}>
                    {day.isToday ? "Today" : "Tomorrow"}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.typePill, { backgroundColor: typeColor + "22" }]}>
              <Text style={[styles.typePillText, { color: typeColor }]}>
                {day.type}
                {count > 0 ? ` · ${count} ex` : ""}
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
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700" },

  // Split info row (tap to expand)
  splitInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  splitInfoText: { fontSize: 15, fontWeight: "600", flex: 1 },

  // Inline split picker
  splitPickerContainer: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  pickerTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  splitOption: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  splitOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  splitOptionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  splitNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitOptionName: {
    fontSize: 15,
    fontWeight: "700",
  },
  currentBadge: {
    backgroundColor: "#10B98122",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  splitOptionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  // Mini week preview inside split option
  miniWeekRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 10,
  },
  miniDayCol: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  miniDayLabel: {
    fontSize: 9,
    fontWeight: "600",
  },
  miniDayPill: {
    borderRadius: 6,
    paddingVertical: 3,
    width: "100%",
    alignItems: "center",
  },
  miniDayText: {
    fontSize: 8,
    fontWeight: "700",
  },

  // Picker action buttons
  pickerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  pickerCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  pickerCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pickerConfirmBtn: {
    flex: 2,
    backgroundColor: "#2AA8FF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  pickerConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  pickerDoneBtn: {
    flex: 1,
    backgroundColor: "#2AA8FF15",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  pickerDoneText: {
    color: "#2AA8FF",
    fontSize: 14,
    fontWeight: "700",
  },

  intro: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 22,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  dayLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  dayName: { fontSize: 16, fontWeight: "600" },
  badge: { backgroundColor: "#6366F122", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeToday: { backgroundColor: "#10B98122" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  typePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  typePillText: { fontSize: 13, fontWeight: "700" },
});
