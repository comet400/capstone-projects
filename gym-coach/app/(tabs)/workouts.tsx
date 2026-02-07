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
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Spacing, Typography, IconSizes } from "@/constants/design";

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
      <ScreenHeader subtitle="Always good to check your form" title="MORGAN MAXWELL" />

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
              <Ionicons name="time-outline" size={IconSizes.sm} color={Colors.secondary} />
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
              <Text style={[styles.metricValue, { color: Colors.success }]}>
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
            <Ionicons name="body-outline" size={IconSizes.lg} color={Colors.primary} />
            <Text style={styles.statValue}>{CURRENT_WORKOUT.posture}</Text>
            <Text style={styles.statLabel}>Posture</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hand-left-outline" size={IconSizes.lg} color={Colors.warning} />
            <Text style={styles.statValue}>{CURRENT_WORKOUT.control}</Text>
            <Text style={styles.statLabel}>Control</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="expand-outline" size={IconSizes.lg} color={Colors.success} />
            <Text style={styles.statValue}>{CURRENT_WORKOUT.rangeOfMotion}</Text>
            <Text style={styles.statLabel}>Range</Text>
          </View>
        </View>

        {/* Form Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={IconSizes.md} color={Colors.secondary} />
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
              <Ionicons name="chevron-back" size={36} color={Colors.iconDark} />
            </Pressable>
          </View>

          <Pressable
            style={styles.pastWorkoutsBtn}
            onPress={() => router.push("/past-workouts")}
          >
            <Ionicons name="barbell-outline" size={48} color={Colors.iconDark} />
            <Text style={styles.pastWorkoutsText}>Past Workouts</Text>
          </Pressable>

          <View style={styles.navSide}>
            <Text style={styles.navLabel}>NEXT</Text>
            <Pressable style={styles.navCircleBtn}>
              <Ionicons name="chevron-forward" size={36} color={Colors.iconDark} />
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
    backgroundColor: Colors.background,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 24 },

  workoutInfoCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
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
    color: Colors.text,
    fontSize: Typography.sizes.xl,
    fontWeight: "700",
    marginBottom: 4,
  },
  exerciseName: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.md,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: Colors.secondary,
    fontSize: Typography.sizes.md,
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  setInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setText: {
    color: Colors.text,
    fontSize: Typography.sizes.md,
    fontWeight: "600",
  },
  repsText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.md,
  },

  workoutViewWrap: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
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
    borderColor: Colors.secondary,
    alignItems: "center",
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: "600",
    marginBottom: 2,
  },
  metricValue: {
    color: Colors.secondary,
    fontSize: Typography.sizes.lg,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    color: Colors.text,
    fontSize: Typography.sizes.xl,
    fontWeight: "700",
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },

  tipsCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    color: Colors.secondary,
    fontSize: Typography.sizes.md,
    fontWeight: "700",
  },
  tipsText: {
    color: Colors.text,
    fontSize: Typography.sizes.md,
    lineHeight: 20,
  },

  summaryBtn: {
    marginTop: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBtnText: {
    color: Colors.iconDark,
    fontSize: Typography.sizes.md,
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
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
  },
  navCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  pastWorkoutsBtn: {
    width: 120,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pastWorkoutsText: {
    color: Colors.iconDark,
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    textAlign: "center",
  },

  bottomPad: { height: 100 },
});
