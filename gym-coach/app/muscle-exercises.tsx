// app/muscle-exercises.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/app/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import { Ionicons } from "@expo/vector-icons";

type Exercise = {
  id: number;
  name: string;
  description: string | null;
  target_muscles: string | null;
  difficulty_level: string | null;
  category: string | null;
  thumbnail_url?: string;
};

export default function MuscleExercisesScreen() {
  const { muscle } = useLocalSearchParams<{ muscle: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/api/exercises`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { target_muscles: muscle },
        });
        setExercises(res.data);
      } catch (err: any) {
        console.log("Error fetching exercises:", err);
        setError("Could not load exercises. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [muscle]);

  const handleExercisePress = async (exercise: Exercise) => {
    const planPayload = {
      plan: { plan_id: 0, name: exercise.name },
      day: {
        plan_day_id: `single_${exercise.id}`,
        day_number: 1,
        day_label: exercise.name,
        exercises: [
          {
            exercise_id: exercise.id,
            name: exercise.name,
            description: exercise.description,
            target_muscles: exercise.target_muscles,
            difficulty_level: exercise.difficulty_level,
            category: exercise.category,
            prescription: {
              sets: 3,
              reps: 10,
              duration_seconds: 0,
              rest_seconds: 60,
            },
          },
        ],
      },
    };
    await AsyncStorage.setItem("active_workout_plan", JSON.stringify(planPayload));
    router.push("/today-workout");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2AA8FF" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading {muscle} exercises...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: colors.surface }]}
          onPress={() => setLoading(true)}
        >
          <Text style={{ color: colors.text }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{muscle} Exercises</Text>
      </View>

      {exercises.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No exercises found for {muscle}. Check back soon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.exerciseCard, { backgroundColor: colors.surface }]}
              onPress={() => handleExercisePress(item)}
            >
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="fitness-outline" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{item.name}</Text>
                {item.target_muscles && (
                  <Text style={[styles.muscleText, { color: colors.textSecondary }]}>
                    {item.target_muscles}
                  </Text>
                )}
                {item.difficulty_level && (
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>{item.difficulty_level}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="play-circle-outline" size={28} color="#2AA8FF" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 16, textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyText: { fontSize: 16, textAlign: "center" },
  list: { padding: 16, gap: 12 },
  exerciseCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 12, gap: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 12 },
  thumbnailPlaceholder: { width: 60, height: 60, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, gap: 4 },
  exerciseName: { fontSize: 16, fontWeight: "600" },
  muscleText: { fontSize: 13 },
  difficultyBadge: { backgroundColor: "#2AA8FF20", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  difficultyText: { fontSize: 11, fontWeight: "600", color: "#2AA8FF" },
});