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
  type GoalId,
  GOAL_DEFINITIONS,
  GOAL_COLORS,
  getAllGoals,
} from "@/app/lib/split-cycle";

export default function GoalSelectorScreen() {
  const router = useRouter();
  const { user, updateUser, token } = useAuth();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<GoalId>(
    (user?.fitness_goal as GoalId) || "gain_muscle"
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const goals = getAllGoals();
  const fitnessLevel = user?.fitness_level || "intermediate";

  useEffect(() => {
    const fetchCurrentGoal = async () => {
      try {
        const authToken = token || (await AsyncStorage.getItem("token"));
        if (!authToken) { setLoading(false); return; }
        const res = await axios.get(`${API_BASE_URL}/api/profile/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.data.fitness_goal) {
          setSelected(res.data.fitness_goal as GoalId);
          updateUser({ fitness_goal: res.data.fitness_goal });
        }
      } catch (e) {
        console.log("Failed to fetch current goal:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentGoal();
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
        `${API_BASE_URL}/api/profile/update-goal`,
        { fitness_goal: selected },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      updateUser({ fitness_goal: selected });
      await AsyncStorage.removeItem("split_week_plan");

      Alert.alert("Goal Updated", "Your fitness goal has been updated. Your workout plan will regenerate.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Failed to save goal:", err?.message ?? err);
      Alert.alert("Error", "Failed to save your fitness goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [selected, token, updateUser, router]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Fitness Goal</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose a goal that matches what you want to achieve. Your plan's exercises, reps, sets, and rest times will adapt automatically.
      </Text>

      {loading && (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#2AA8FF" />
        </View>
      )}

      {!loading && goals.map((goal) => {
        const isActive = selected === goal.id;
        const goalColor = GOAL_COLORS[goal.id];
        const estMin = goal.estimatedMinutes[fitnessLevel as keyof typeof goal.estimatedMinutes] || goal.estimatedMinutes.intermediate;

        return (
          <Pressable
            key={goal.id}
            style={[
              styles.goalCard,
              {
                backgroundColor: colors.surface,
                borderColor: isActive ? goalColor : colors.border,
                borderWidth: isActive ? 2 : 1,
              },
            ]}
            onPress={() => setSelected(goal.id)}
          >
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleRow}>
                <View style={[styles.iconCircle, { backgroundColor: goalColor + "20" }]}>
                  <MaterialCommunityIcons
                    name={goal.icon as any}
                    size={22}
                    color={goalColor}
                  />
                </View>
                <View>
                  <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                  <Text style={[styles.goalShort, { color: colors.textSecondary }]}>{goal.shortName}</Text>
                </View>
              </View>
              {isActive && (
                <Ionicons name="checkmark-circle" size={24} color={goalColor} />
              )}
            </View>

            <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>
              {goal.description}
            </Text>

            <View style={styles.detailsRow}>
              <DetailPill
                label={goal.strengthLabel}
                color={goalColor}
                bgColor={colors.background}
              />
              <DetailPill
                label={goal.repRange}
                color={goalColor}
                bgColor={colors.background}
              />
              <DetailPill
                label={goal.restLabel}
                color={goalColor}
                bgColor={colors.background}
              />
              <DetailPill
                label={`~${estMin} min`}
                color={goalColor}
                bgColor={colors.background}
              />
            </View>

            {/* Composition breakdown */}
            <View style={[styles.compositionRow, { backgroundColor: colors.background }]}>
              <View style={styles.compositionItem}>
                <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textSecondary} />
                <Text style={[styles.compositionText, { color: colors.text }]}>
                  {goal.strengthLabel}
                </Text>
              </View>
              {goal.cardioCount > 0 && (
                <View style={styles.compositionItem}>
                  <MaterialCommunityIcons name="heart-pulse" size={14} color="#EF4444" />
                  <Text style={[styles.compositionText, { color: colors.text }]}>
                    {goal.cardioCount} cardio
                  </Text>
                </View>
              )}
              {goal.coreCount > 0 && (
                <View style={styles.compositionItem}>
                  <MaterialCommunityIcons name="shield-outline" size={14} color="#F59E0B" />
                  <Text style={[styles.compositionText, { color: colors.text }]}>
                    {goal.coreCount} core
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      {!loading && (
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
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

function DetailPill({
  label,
  color,
  bgColor,
}: {
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[detailStyles.pill, { backgroundColor: bgColor }]}>
      <Text style={[detailStyles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

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
  goalCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  goalName: {
    fontSize: 17,
    fontWeight: "700",
  },
  goalShort: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  goalDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  compositionRow: {
    flexDirection: "row",
    gap: 16,
    padding: 10,
    borderRadius: 10,
  },
  compositionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compositionText: {
    fontSize: 12,
    fontWeight: "600",
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
