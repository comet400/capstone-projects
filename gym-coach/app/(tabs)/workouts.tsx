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

const PROFILE_IMAGE = require("@/assets/images/home/featured.jpg");
// Swap to require("@/assets/images/workout/rowing-form.jpg") when you add that image
const WORKOUT_VIEW_IMAGE = require("@/assets/images/home/featured.jpg");

// Mock data for current workout
const CURRENT_WORKOUT = {
  name: "30 Minute HIIT Cardio",
  exercise: "Rowing Form",
  duration: "30:00",
  sets: 4,
  reps: 12,
  currentSet: 2,
  formScore: 72,
  posture: 85,
  control: 68,
  rangeOfMotion: 90,
};

export default function WorkoutsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Header: menu | mini profile | premium */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>

        <View style={styles.miniProfile}>
          <Image source={PROFILE_IMAGE} style={styles.miniAvatar} />
          <View>
            <Text style={styles.subtitle}>Always good to check your form</Text>
            <Text style={styles.name}>MORGAN MAXWELL</Text>
          </View>
        </View>

        <Pressable style={styles.crownBtn}>
          <Text style={styles.crownIcon}>👑</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info Card */}
        <View style={styles.workoutInfoCard}>
          <View style={styles.workoutInfoHeader}>
            <View>
              <Text style={styles.workoutName}>{CURRENT_WORKOUT.name}</Text>
              <Text style={styles.exerciseName}>{CURRENT_WORKOUT.exercise}</Text>
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={16} color="#BFFF5A" />
              <Text style={styles.timerText}>{CURRENT_WORKOUT.duration}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(CURRENT_WORKOUT.currentSet / CURRENT_WORKOUT.sets) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.setInfo}>
            <Text style={styles.setText}>
              Set {CURRENT_WORKOUT.currentSet} of {CURRENT_WORKOUT.sets}
            </Text>
            <Text style={styles.repsText}>{CURRENT_WORKOUT.reps} reps</Text>
          </View>
        </View>

        {/* Workout visualization (video/image + form overlay) */}
        <View style={styles.workoutViewWrap}>
          <Image
            source={WORKOUT_VIEW_IMAGE}
            style={styles.workoutViewImage}
            resizeMode="cover"
          />
          {/* Real-time metrics overlay */}
          <View style={styles.metricsOverlay}>
            <View style={styles.metricBadge}>
              <Text style={styles.metricLabel}>Form Score</Text>
              <Text style={styles.metricValue}>{CURRENT_WORKOUT.formScore}</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={styles.metricLabel}>Posture</Text>
              <Text style={[styles.metricValue, { color: "#4ADE80" }]}>
                {CURRENT_WORKOUT.posture}
              </Text>
            </View>
          </View>
          {/* Form analysis overlay placeholder – skeleton/pose lines go here */}
          <View style={styles.formOverlay} pointerEvents="none" />
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="body-outline" size={24} color="#2AA8FF" />
            <Text style={styles.statValue}>{CURRENT_WORKOUT.posture}</Text>
            <Text style={styles.statLabel}>Posture</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hand-left-outline" size={24} color="#FACC15" />
            <Text style={styles.statValue}>{CURRENT_WORKOUT.control}</Text>
            <Text style={styles.statLabel}>Control</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="expand-outline" size={24} color="#4ADE80" />
            <Text style={styles.statValue}>{CURRENT_WORKOUT.rangeOfMotion}</Text>
            <Text style={styles.statLabel}>Range</Text>
          </View>
        </View>

        {/* Form Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color="#BFFF5A" />
            <Text style={styles.tipsTitle}>Form Tip</Text>
          </View>
          <Text style={styles.tipsText}>
            Keep your back straight and core engaged. Focus on smooth, controlled movements.
          </Text>
        </View>

        <Pressable
          style={styles.summaryBtn}
          onPress={() => router.push("/workout-summary")}
        >
          <Text style={styles.summaryBtnText}>SEE WORKOUT SUMMARY</Text>
        </Pressable>

        {/* Workout navigation: Previous | Past Workouts | Next */}
        <View style={styles.navSection}>
          <View style={styles.navSide}>
            <Text style={styles.navLabel}>PREVIOUS</Text>
            <Pressable style={styles.navCircleBtn}>
              <Ionicons name="chevron-back" size={36} color="#0D0F10" />
            </Pressable>
          </View>

          <Pressable
            style={styles.pastWorkoutsBtn}
            onPress={() => router.push("/past-workouts")}
          >
            <Ionicons name="barbell-outline" size={48} color="#0D0F10" />
            <Text style={styles.pastWorkoutsText}>Past Workouts</Text>
          </Pressable>

          <View style={styles.navSide}>
            <Text style={styles.navLabel}>NEXT</Text>
            <Pressable style={styles.navCircleBtn}>
              <Ionicons name="chevron-forward" size={36} color="#0D0F10" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomPad} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  header: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },

  miniProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  subtitle: {
    color: "#9B9B9B",
    fontSize: 11,
  },
  name: {
    color: "#2AA8FF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  crownBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: { fontSize: 22 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  workoutInfoCard: {
    marginTop: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 18,
  },
  workoutInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  workoutName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  exerciseName: {
    color: "#9B9B9B",
    fontSize: 13,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: "#BFFF5A",
    fontSize: 13,
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#2A2A2A",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#BFFF5A",
    borderRadius: 3,
  },
  setInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  repsText: {
    color: "#9B9B9B",
    fontSize: 13,
  },

  workoutViewWrap: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1E1E1E",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  workoutViewImage: {
    width: "100%",
    height: "100%",
  },
  metricsOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    gap: 8,
    zIndex: 2,
  },
  metricBadge: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#BFFF5A",
    alignItems: "center",
  },
  metricLabel: {
    color: "#9B9B9B",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  metricValue: {
    color: "#BFFF5A",
    fontSize: 16,
    fontWeight: "700",
  },
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: "#9B9B9B",
    fontSize: 11,
  },

  tipsCard: {
    marginTop: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#BFFF5A",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    color: "#BFFF5A",
    fontSize: 14,
    fontWeight: "700",
  },
  tipsText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 20,
  },

  summaryBtn: {
    marginTop: 16,
    backgroundColor: "#BFFF5A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBtnText: {
    color: "#0D0F10",
    fontSize: 14,
    fontWeight: "800",
  },

  navSection: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navSide: {
    alignItems: "center",
    gap: 8,
  },
  navLabel: {
    color: "#9B9B9B",
    fontSize: 11,
    fontWeight: "700",
  },
  navCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#BFFF5A",
    alignItems: "center",
    justifyContent: "center",
  },
  pastWorkoutsBtn: {
    width: 120,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pastWorkoutsText: {
    color: "#0D0F10",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  bottomPad: { height: 100 },
});
