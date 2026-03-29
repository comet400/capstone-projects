import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import {
  type SplitId,
  type DayType,
  SPLIT_DEFINITIONS,
  DAY_COLORS,
  getAllSplits,
  getWeekSchedule,
} from "@/app/lib/split-cycle";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MON_SUN_INDICES = [1, 2, 3, 4, 5, 6, 0];

export default function SplitSelectorScreen() {
  const router = useRouter();
  const { user, updateUser, token } = useAuth();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<SplitId>(
    (user?.workout_split as SplitId) || "ppl"
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const splits = getAllSplits();

  useEffect(() => {
    const fetchCurrentSplit = async () => {
      try {
        const authToken = token || (await AsyncStorage.getItem("token"));
        if (!authToken) { setLoading(false); return; }
        const res = await axios.get(`${API_BASE_URL}/api/profile/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.data.workout_split) {
          setSelected(res.data.workout_split as SplitId);
          updateUser({ workout_split: res.data.workout_split });
        }
      } catch (e) {
        console.log("Failed to fetch current split:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentSplit();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const authToken = token || (await AsyncStorage.getItem("token"));
      if (!authToken) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/profile/update-split`,
        { workout_split: selected },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      updateUser({ workout_split: selected });

      await AsyncStorage.removeItem("split_week_plan");

      Alert.alert("Split Updated", "Your training split has been updated. Your workout plan will regenerate.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Failed to save split:", err?.message ?? err);
      Alert.alert("Error", "Failed to save your training split. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [selected, token, updateUser, router]);

  const fitnessLevel = user?.fitness_level || "intermediate";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Training Split</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose a training split that fits your schedule and goals. Your weekly plan will automatically adjust.
      </Text>

      {loading && (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#2AA8FF" />
        </View>
      )}

      {!loading && splits.map((split) => {
        const isActive = selected === split.id;
        const schedule = getWeekSchedule(split.id, fitnessLevel);
        const activeDays = schedule.filter((d) => d !== "Rest").length;

        return (
          <Pressable
            key={split.id}
            style={[
              styles.splitCard,
              {
                backgroundColor: colors.surface,
                borderColor: isActive ? "#2AA8FF" : colors.border,
                borderWidth: isActive ? 2 : 1,
              },
            ]}
            onPress={() => setSelected(split.id)}
          >
            <View style={styles.splitHeader}>
              <View style={styles.splitTitleRow}>
                <MaterialCommunityIcons
                  name={split.icon as any}
                  size={22}
                  color={isActive ? "#2AA8FF" : colors.textSecondary}
                />
                <Text style={[styles.splitName, { color: colors.text }]}>{split.name}</Text>
              </View>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={22} color="#2AA8FF" />
                </View>
              )}
            </View>

            <Text style={[styles.splitDesc, { color: colors.textSecondary }]}>
              {split.description}
            </Text>

            <Text style={[styles.frequencyLabel, { color: colors.textSecondary }]}>
              {activeDays} days/week ({fitnessLevel})
            </Text>

            <View style={styles.weekPreview}>
              {MON_SUN_INDICES.map((schedIdx, displayIdx) => {
                const dayType = schedule[schedIdx];
                const color = DAY_COLORS[dayType] || DAY_COLORS.Rest;
                const isRest = dayType === "Rest";
                return (
                  <View key={displayIdx} style={styles.weekDayCol}>
                    <Text style={[styles.weekDayLabel, { color: colors.textSecondary }]}>
                      {DAY_LABELS[displayIdx]}
                    </Text>
                    <View
                      style={[
                        styles.weekDayPill,
                        {
                          backgroundColor: color + (isRest ? "20" : "22"),
                          borderColor: color + "44",
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.weekDayType, { color }]}
                        numberOfLines={1}
                      >
                        {isRest ? "Rest" : shortLabel(dayType)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Pressable>
        );
      })}

      {!loading && (
        <Pressable
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save & Regenerate Plan</Text>
          )}
        </Pressable>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function shortLabel(dayType: DayType): string {
  const map: Record<string, string> = {
    Push: "Push",
    Pull: "Pull",
    Legs: "Legs",
    "Chest/Back": "C/B",
    "Shoulders/Arms": "S/A",
    Chest: "Chest",
    Back: "Back",
    Shoulders: "Shld",
    Arms: "Arms",
    Upper: "Upper",
    Lower: "Lower",
    "Full Body": "Full",
  };
  return map[dayType] || dayType;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 8,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 20,
  },
  splitCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  splitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  splitName: {
    fontSize: 17,
    fontWeight: "700",
  },
  activeBadge: {},
  splitDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  frequencyLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  weekPreview: {
    flexDirection: "row",
    gap: 4,
  },
  weekDayCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  weekDayPill: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
    width: "100%",
    alignItems: "center",
  },
  weekDayType: {
    fontSize: 9,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#2AA8FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
