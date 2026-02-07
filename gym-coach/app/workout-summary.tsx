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
import { Colors, Spacing, Typography, IconSizes } from "@/constants/design";

// Swap to @/assets/images/workout/rowing-form.jpg when you add the image
const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

const METRICS = [
  { label: "Posture", score: 70, color: Colors.success },
  { label: "Control", score: 62, color: Colors.warning },
  { label: "Comfort", score: 20, color: "#F87171" }, // Red isn't in my basic tokens yet, but good to keep
  { label: "Range of Motion", score: 90, color: Colors.success },
  { label: "Symmetry", score: 67, color: Colors.warning },
] as const;

const OVERALL_SCORE = 62;
const OVERALL_COLOR = Colors.warning;
const SUMMARY_DATE = "15 May 2024";
const AI_FEEDBACK =
  "Careful with your spine! You can do better than that! Focus in your arms, let them do the work!";

export default function WorkoutSummaryScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.headerTitle}>YOUR SUMMARY IS READY!</Text>

      {/* Workout visual with green border and corner squares */}
      <View style={styles.visualWrap}>
        <View style={styles.visualBorder}>
          <View style={[styles.cornerSquare, styles.cornerTL]} />
          <View style={[styles.cornerSquare, styles.cornerTR]} />
          <View style={[styles.cornerSquare, styles.cornerBL]} />
          <View style={[styles.cornerSquare, styles.cornerBR]} />
          <View style={[styles.cornerSquare, styles.midT]} />
          <View style={[styles.cornerSquare, styles.midB]} />
          <View style={[styles.cornerSquare, styles.midL]} />
          <View style={[styles.cornerSquare, styles.midR]} />
          <Image
            source={WORKOUT_IMAGE}
            style={styles.workoutImage}
            resizeMode="cover"
          />
          <View style={styles.poseOverlay} pointerEvents="none" />
        </View>
      </View>

      {/* Workout Summary card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Workout Summary</Text>
          <Pressable hitSlop={12}>
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailsLabel}>Details</Text>
          <Text style={styles.detailsDate}>{SUMMARY_DATE}</Text>
        </View>
        {METRICS.map(({ label, score, color }) => (
          <View key={label} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={[styles.metricScore, { color }]}>{score}/100</Text>
          </View>
        ))}
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Overall</Text>
          <Text style={[styles.overallScore, { color: OVERALL_COLOR }]}>
            {OVERALL_SCORE}/100
          </Text>
        </View>
      </View>

      {/* AI feedback */}
      <View style={styles.aiSection}>
        <View style={styles.robotIconWrap}>
          <View style={styles.robotIcon}>
            <Text style={styles.robotEmoji}>🤖</Text>
            <View style={styles.robotLeaf} />
          </View>
        </View>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{AI_FEEDBACK}</Text>
        </View>
      </View>

      {/* Go Back button */}
      <Pressable
        style={styles.goBackBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.goBackText}>Go Back</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  headerTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.xl,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 20,
  },

  visualWrap: {
    marginBottom: 24,
  },
  visualBorder: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
    overflow: "hidden",
    position: "relative",
    aspectRatio: 4 / 3,
  },
  cornerSquare: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: Colors.secondary,
    zIndex: 2,
  },
  cornerTL: { top: 4, left: 4 },
  cornerTR: { top: 4, right: 4 },
  cornerBL: { bottom: 4, left: 4 },
  cornerBR: { bottom: 4, right: 4 },
  midT: { top: 4, left: "50%", marginLeft: -4 },
  midB: { bottom: 4, left: "50%", marginLeft: -4 },
  midL: { top: "50%", left: 4, marginTop: -4 },
  midR: { top: "50%", right: 4, marginTop: -4 },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  poseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  detailsDate: {
    color: Colors.text,
    fontSize: Typography.sizes.sm,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.surfaceHighlight,
  },
  metricLabel: {
    color: Colors.text,
    fontSize: Typography.sizes.md,
  },
  metricScore: {
    fontSize: Typography.sizes.md,
    fontWeight: "600",
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
  },
  overallLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  overallScore: {
    fontSize: 15,
    fontWeight: "700",
  },

  aiSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 28,
  },
  robotIconWrap: {
    marginBottom: 4,
  },
  robotIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  robotEmoji: {
    fontSize: 26,
  },
  robotLeaf: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderTopLeftRadius: 4,
  },
  speechText: {
    color: Colors.text,
    fontSize: Typography.sizes.md,
    lineHeight: 20,
  },

  goBackBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  goBackText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
