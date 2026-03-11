import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Spacing, Typography, IconSizes } from "@/constants/design";

const { width } = Dimensions.get("window");

const WORKOUT_VIEW_IMAGE = require("@/assets/images/home/featured.jpg");

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

// Animated bar used inside stat cards
function StatBar({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 100,
      duration: 900,
      delay: 500,
      useNativeDriver: false,
    }).start();
  }, []);
  return (
    <View style={barStyles.track}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            backgroundColor: color,
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#EFEFEF",
    overflow: "hidden",
    marginTop: 8,
    width: "100%",
  },
  fill: { height: "100%", borderRadius: 3 },
});

export default function WorkoutsScreen() {
  const router = useRouter();

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const imageFade = useRef(new Animated.Value(0)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(imageFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (CURRENT_WORKOUT.currentSet / CURRENT_WORKOUT.sets) * 100,
      duration: 900,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Soft decorative blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Workout Info Card ── */}
        <Animated.View
          style={[
            styles.workoutInfoCard,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <View style={styles.workoutInfoHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.workoutName}>{CURRENT_WORKOUT.name}</Text>
              <View style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseName}>{CURRENT_WORKOUT.exercise}</Text>
              </View>
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={13} color="#2AA8FF" />
              <Text style={styles.timerText}>{CURRENT_WORKOUT.duration}</Text>
            </View>
          </View>

          {/* Segmented progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
            {[25, 50, 75].map((pct) => (
              <View key={pct} style={[styles.progressNotch, { left: `${pct}%` as any }]} />
            ))}
          </View>

          <View style={styles.setInfo}>
            <View style={styles.setBadge}>
              <Text style={styles.setBadgeText}>
                Set {CURRENT_WORKOUT.currentSet} / {CURRENT_WORKOUT.sets}
              </Text>
            </View>
            <Text style={styles.repsText}>
              <Text style={styles.repsCount}>{CURRENT_WORKOUT.reps}</Text>
              {"  reps"}
            </Text>
          </View>
        </Animated.View>

        {/* ── Workout View ── */}
        <Animated.View style={[styles.workoutViewWrap, { opacity: imageFade }]}>
          <Image
            source={WORKOUT_VIEW_IMAGE}
            style={styles.workoutViewImage}
            resizeMode="cover"
          />

          <View style={styles.imageScrim} />

          {/* Big form score centered at bottom */}
          <View style={styles.formScoreOverlay}>
            <Text style={styles.formScoreNum}>{CURRENT_WORKOUT.formScore}</Text>
            <Text style={styles.formScoreLabel}>FORM SCORE</Text>
          </View>

          {/* Posture card top-right */}
          <View style={styles.postureBadge}>
            <Text style={styles.postureBadgeLabel}>POSTURE</Text>
            <Text style={styles.postureBadgeVal}>{CURRENT_WORKOUT.posture}</Text>
          </View>
        </Animated.View>

        {/* ── Stat Cards ── */}
        <Animated.View
          style={[
            styles.statsRow,
            { opacity: statsFade, transform: [{ translateY: statsSlide }] },
          ]}
        >
          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={[styles.statIconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Ionicons name="body-outline" size={20} color="#2AA8FF" />
            </View>
            <Text style={styles.statValue}>{CURRENT_WORKOUT.posture}</Text>
            <Text style={styles.statLabel}>Posture</Text>
            <StatBar value={CURRENT_WORKOUT.posture} color="#2AA8FF" />
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "#FFF4E5" }]}>
              <Ionicons name="hand-left-outline" size={20} color="#F5A623" />
            </View>
            <Text style={styles.statValue}>{CURRENT_WORKOUT.control}</Text>
            <Text style={styles.statLabel}>Control</Text>
            <StatBar value={CURRENT_WORKOUT.control} color="#F5A623" />
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "#E8FAF0" }]}>
              <Ionicons name="expand-outline" size={20} color="#27AE60" />
            </View>
            <Text style={styles.statValue}>{CURRENT_WORKOUT.rangeOfMotion}</Text>
            <Text style={styles.statLabel}>Range</Text>
            <StatBar value={CURRENT_WORKOUT.rangeOfMotion} color="#27AE60" />
          </View>
        </Animated.View>

        {/* ── Summary Button ── */}
        <Pressable
          style={styles.summaryBtn}
          onPress={() => router.push("/workout-summary")}
        >
          <Text style={styles.summaryBtnText}>SEE WORKOUT SUMMARY</Text>
          <View style={styles.summaryArrow}>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </Pressable>

        {/* ── Navigation ── */}
        <View style={styles.navSection}>
          <View style={styles.navSide}>
            <Pressable style={styles.navCircleBtn}>
              <Ionicons name="chevron-back" size={24} color="#171C1D" />
            </Pressable>
            <Text style={styles.navLabel}>PREV</Text>
          </View>

          <Pressable
            style={styles.pastWorkoutsBtn}
            onPress={() => router.push("/past-workouts")}
          >
            <View style={styles.pastWorkoutsIconWrap}>
              <Ionicons name="barbell-outline" size={26} color="#171C1D" />
            </View>
            <Text style={styles.pastWorkoutsText}>Past{"\n"}Workouts</Text>
          </Pressable>

          <View style={styles.navSide}>
            <Pressable style={[styles.navCircleBtn, styles.navCirclePrimary]}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.navLabel}>NEXT</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomPad} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  bgBlob1: {
    position: "absolute",
    top: -40,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#2AA8FF",
    opacity: 0.06,
  },
  bgBlob2: {
    position: "absolute",
    bottom: 220,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#171C1D",
    opacity: 0.04,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  // Info card
  workoutInfoCard: {
    marginTop: 16,
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  workoutInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  workoutName: {
    color: "#171C1D",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2AA8FF",
  },
  exerciseName: {
    color: "#9E9E9E",
    fontSize: 13,
    fontWeight: "500",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EAF5FF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E8FF",
  },
  timerText: {
    color: "#2AA8FF",
    fontSize: 13,
    fontWeight: "700",
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    marginBottom: 14,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2AA8FF",
    borderRadius: 4,
  },
  progressNotch: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 1,
    marginLeft: -1,
  },
  setInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setBadge: {
    backgroundColor: "#171C1D",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  setBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  repsText: {
    color: "#9E9E9E",
    fontSize: 13,
    fontWeight: "500",
  },
  repsCount: {
    color: "#171C1D",
    fontWeight: "900",
    fontSize: 15,
  },

  // Workout view
  workoutViewWrap: {
    marginTop: 14,
    borderRadius: 22,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    position: "relative",
    backgroundColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  workoutViewImage: { width: "100%", height: "100%" },
  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(23,28,29,0.24)",
  },
  formScoreOverlay: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  formScoreNum: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 58,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  formScoreLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 2,
  },
  postureBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.93)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  postureBadgeLabel: {
    color: "#ABABAB",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  postureBadgeVal: {
    color: "#27AE60",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  livePill: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(23,28,29,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF3B30",
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // Stat cards
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  statCardBlue: {
    borderColor: "#C8E8FF",
    backgroundColor: "#F4FAFF",
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    color: "#171C1D",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    color: "#ABABAB",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Tips
  tipsCard: {
    marginTop: 14,
    backgroundColor: "#F7F7F7",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  tipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF5FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  tipsTitle: {
    color: "#2AA8FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  tipsText: {
    color: "#555",
    fontSize: 13,
    lineHeight: 19,
  },

  // Summary button
  summaryBtn: {
    marginTop: 16,
    backgroundColor: "#171C1D",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#171C1D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  summaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Nav
  navSection: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  navSide: {
    alignItems: "center",
    gap: 8,
  },
  navLabel: {
    color: "#ABABAB",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  navCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  navCirclePrimary: {
    backgroundColor: "#2AA8FF",
    borderColor: "#2AA8FF",
  },
  pastWorkoutsBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    minWidth: 110,
  },
  pastWorkoutsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  pastWorkoutsText: {
    color: "#171C1D",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  bottomPad: { height: 100 },
});