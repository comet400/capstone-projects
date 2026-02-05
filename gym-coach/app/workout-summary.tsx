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

// Swap to @/assets/images/workout/rowing-form.jpg when you add the image
const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

const METRICS = [
  { label: "Posture", score: 70, color: "#4ADE80" },
  { label: "Control", score: 62, color: "#FACC15" },
  { label: "Comfort", score: 20, color: "#F87171" },
  { label: "Range of Motion", score: 90, color: "#4ADE80" },
  { label: "Symmetry", score: 67, color: "#FACC15" },
] as const;

const OVERALL_SCORE = 62;
const OVERALL_COLOR = "#FACC15";
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
            <Ionicons name="ellipsis-horizontal" size={22} color="#9B9B9B" />
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
    backgroundColor: "#121212",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
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
    borderColor: "#BFFF5A",
    overflow: "hidden",
    position: "relative",
    aspectRatio: 4 / 3,
  },
  cornerSquare: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "#BFFF5A",
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
    backgroundColor: "#1E1E1E",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsLabel: {
    color: "#9B9B9B",
    fontSize: 13,
  },
  detailsDate: {
    color: "#fff",
    fontSize: 13,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  metricLabel: {
    color: "#fff",
    fontSize: 14,
  },
  metricScore: {
    fontSize: 14,
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
    color: "#fff",
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
    backgroundColor: "#2AA8FF",
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
    backgroundColor: "#4ADE80",
  },
  speechBubble: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
    borderTopLeftRadius: 4,
  },
  speechText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },

  goBackBtn: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  goBackText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
