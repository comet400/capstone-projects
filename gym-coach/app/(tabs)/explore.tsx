import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/app/context/ThemeContext";

// ── Exercise data ─────────────────────────────────────────────────────────────
type Exercise = {
  name: string;
  muscle: string;
  equipment: string;
  level: "Beginner" | "Intermediate" | "Advanced";
};

type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
  exercises: Exercise[];
};

const CATEGORIES: Category[] = [
  {
    id: "upper",
    label: "Upper Body",
    icon: "arm-flex",
    color: "#EF4444",
    exercises: [
      { name: "Bench Press", muscle: "Chest", equipment: "Barbell", level: "Intermediate" },
      { name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", level: "Intermediate" },
      { name: "Incline Dumbbell Press", muscle: "Upper Chest", equipment: "Dumbbells", level: "Intermediate" },
      { name: "Lateral Raises", muscle: "Shoulders", equipment: "Dumbbells", level: "Beginner" },
      { name: "Tricep Dips", muscle: "Triceps", equipment: "Bodyweight", level: "Beginner" },
      { name: "Bicep Curls", muscle: "Biceps", equipment: "Dumbbells", level: "Beginner" },
    ],
  },
  {
    id: "back",
    label: "Back & Pull",
    icon: "rowing",
    color: "#3B82F6",
    exercises: [
      { name: "Barbell Row", muscle: "Back", equipment: "Barbell", level: "Intermediate" },
      { name: "Pull-ups", muscle: "Lats", equipment: "Bodyweight", level: "Advanced" },
      { name: "Lat Pulldown", muscle: "Lats", equipment: "Cable", level: "Beginner" },
      { name: "Face Pulls", muscle: "Rear Delts", equipment: "Cable", level: "Beginner" },
      { name: "Seated Cable Row", muscle: "Mid Back", equipment: "Cable", level: "Beginner" },
    ],
  },
  {
    id: "legs",
    label: "Lower Body",
    icon: "run",
    color: "#10B981",
    exercises: [
      { name: "Barbell Squat", muscle: "Quads", equipment: "Barbell", level: "Intermediate" },
      { name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", level: "Intermediate" },
      { name: "Leg Press", muscle: "Quads", equipment: "Machine", level: "Beginner" },
      { name: "Lunges", muscle: "Quads & Glutes", equipment: "Dumbbells", level: "Beginner" },
      { name: "Calf Raises", muscle: "Calves", equipment: "Machine", level: "Beginner" },
      { name: "Hip Thrusts", muscle: "Glutes", equipment: "Barbell", level: "Intermediate" },
    ],
  },
  {
    id: "core",
    label: "Core",
    icon: "human-handsup",
    color: "#F59E0B",
    exercises: [
      { name: "Plank", muscle: "Core", equipment: "Bodyweight", level: "Beginner" },
      { name: "Hanging Leg Raises", muscle: "Lower Abs", equipment: "Bar", level: "Advanced" },
      { name: "Ab Wheel Rollout", muscle: "Core", equipment: "Ab Wheel", level: "Intermediate" },
      { name: "Cable Woodchops", muscle: "Obliques", equipment: "Cable", level: "Intermediate" },
      { name: "Russian Twists", muscle: "Obliques", equipment: "Bodyweight", level: "Beginner" },
    ],
  },
  {
    id: "stretch",
    label: "Stretching & Mobility",
    icon: "yoga",
    color: "#8B5CF6",
    exercises: [
      { name: "Hip Flexor Stretch", muscle: "Hip Flexors", equipment: "None", level: "Beginner" },
      { name: "Pigeon Pose", muscle: "Glutes & Hips", equipment: "None", level: "Beginner" },
      { name: "Cat-Cow Stretch", muscle: "Spine", equipment: "None", level: "Beginner" },
      { name: "Shoulder Pass-throughs", muscle: "Shoulders", equipment: "Band", level: "Beginner" },
      { name: "Foam Roll IT Band", muscle: "Legs", equipment: "Foam Roller", level: "Beginner" },
    ],
  },
];

// ── Level color helper ────────────────────────────────────────────────────────
function levelColor(level: string): string {
  if (level === "Beginner") return "#4ADE80";
  if (level === "Intermediate") return "#FACC15";
  return "#F87171";
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const filteredCategories = searchQuery.trim()
    ? CATEGORIES.map((cat) => ({
        ...cat,
        exercises: cat.exercises.filter(
          (ex) =>
            ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ex.muscle.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.exercises.length > 0)
    : CATEGORIES;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Browse exercises by category
      </Text>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search exercises…"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      {filteredCategories.map((cat) => {
        const isExpanded = expandedId === cat.id || searchQuery.trim().length > 0;
        return (
          <View key={cat.id} style={{ marginBottom: 12 }}>
            <Pressable
              style={({ pressed }) => [
                styles.categoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => toggle(cat.id)}
            >
              <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}18` }]}>
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={26}
                  color={cat.color}
                />
              </View>
              <View style={styles.catInfo}>
                <Text style={[styles.catLabel, { color: colors.text }]}>{cat.label}</Text>
                <Text style={[styles.catCount, { color: colors.textSecondary }]}>
                  {cat.exercises.length} exercises
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {/* Exercise list */}
            {isExpanded &&
              cat.exercises.map((ex, i) => (
                <View
                  key={i}
                  style={[
                    styles.exerciseRow,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {ex.name}
                    </Text>
                    <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
                      {ex.muscle} · {ex.equipment}
                    </Text>
                  </View>
                  <View style={[styles.levelBadge, { backgroundColor: `${levelColor(ex.level)}18` }]}>
                    <Text style={[styles.levelText, { color: levelColor(ex.level) }]}>
                      {ex.level}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        );
      })}

      {filteredCategories.length === 0 && (
        <View style={styles.emptyWrap}>
          <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No exercises match "{searchQuery}"
          </Text>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  title: { marginTop: 60, fontSize: 28, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 14, marginBottom: 16 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  catIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catInfo: { flex: 1 },
  catLabel: { fontSize: 16, fontWeight: "700" },
  catCount: { fontSize: 12, marginTop: 2 },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginLeft: 24,
    borderLeftWidth: 2,
    borderColor: "#2AA8FF",
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: "600" },
  exerciseMeta: { fontSize: 12, marginTop: 2 },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: { fontSize: 10, fontWeight: "700" },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
});
