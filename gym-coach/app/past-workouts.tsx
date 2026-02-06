import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

const PAST_WORKOUTS = [
  {
    id: "1",
    title: "30 Minute HIIT Cardio",
    date: "15 May 2024",
    duration: "30 min",
    exercises: 3,
    sets: 4,
    overallScore: 72,
    color: "#4ADE80",
  },
  {
    id: "2",
    title: "Upper Body Strength",
    date: "14 May 2024",
    duration: "45 min",
    exercises: 5,
    sets: 6,
    overallScore: 68,
    color: "#FACC15",
  },
  {
    id: "3",
    title: "Core Focus Session",
    date: "13 May 2024",
    duration: "25 min",
    exercises: 4,
    sets: 3,
    overallScore: 85,
    color: "#4ADE80",
  },
  {
    id: "4",
    title: "Leg Day Intensive",
    date: "12 May 2024",
    duration: "50 min",
    exercises: 6,
    sets: 5,
    overallScore: 65,
    color: "#FACC15",
  },
  {
    id: "5",
    title: "Full Body Circuit",
    date: "11 May 2024",
    duration: "35 min",
    exercises: 7,
    sets: 3,
    overallScore: 78,
    color: "#4ADE80",
  },
];

export default function PastWorkoutsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Past Workouts</Text>
        <Pressable style={styles.filterBtn}>
          <Ionicons name="filter" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{PAST_WORKOUTS.length}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(
              PAST_WORKOUTS.reduce((sum, w) => sum + w.overallScore, 0) /
                PAST_WORKOUTS.length
            )}
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {PAST_WORKOUTS.reduce((sum, w) => sum + w.exercises, 0)}
          </Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
      </View>

      {/* Workouts List */}
      {PAST_WORKOUTS.map((workout) => (
        <Pressable
          key={workout.id}
          style={styles.workoutCard}
          onPress={() => router.push("/workout-summary")}
        >
          <View style={styles.workoutImageWrap}>
            <Image source={WORKOUT_IMAGE} style={styles.workoutImage} />
            <View style={styles.imageOverlay} />
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{workout.overallScore}</Text>
            </View>
          </View>
          <View style={styles.workoutInfo}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>{workout.title}</Text>
              <Pressable hitSlop={12}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9B9B9B" />
              </Pressable>
            </View>
            <Text style={styles.workoutDate}>{workout.date}</Text>
            <View style={styles.workoutDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#9B9B9B" />
                <Text style={styles.detailText}>{workout.duration}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="barbell-outline" size={16} color="#9B9B9B" />
                <Text style={styles.detailText}>
                  {workout.exercises} exercises
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="repeat-outline" size={16} color="#9B9B9B" />
                <Text style={styles.detailText}>{workout.sets} sets</Text>
              </View>
            </View>
            <View style={styles.overallRow}>
              <Text style={styles.overallLabel}>Overall Score</Text>
              <Text style={[styles.overallScore, { color: workout.color }]}>
                {workout.overallScore}/100
              </Text>
            </View>
          </View>
        </Pressable>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },

  statsCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9B9B9B",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#2A2A2A",
  },

  workoutCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  workoutImageWrap: {
    position: "relative",
    height: 160,
  },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  scoreBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#BFFF5A",
  },
  scoreText: {
    color: "#BFFF5A",
    fontSize: 14,
    fontWeight: "700",
  },

  workoutInfo: {
    padding: 18,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  workoutTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  workoutDate: {
    color: "#9B9B9B",
    fontSize: 12,
    marginBottom: 12,
  },
  workoutDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: "#9B9B9B",
    fontSize: 12,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2A2A2A",
  },
  overallLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  overallScore: {
    fontSize: 14,
    fontWeight: "700",
  },
});
