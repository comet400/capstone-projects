import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as VideoThumbnails from "expo-video-thumbnails";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/app/config/api";

// Fallback image
const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface RepSummary {
  id: number;
  quality: { score: number; grade: string };
  timing: { duration_seconds: number };
  form: { issues: string[]; is_perfect: boolean };
  metrics: Record<string, number | string>;
}

interface AnalysisReport {
  metadata: {
    exercise_type: string;
    duration_seconds: number;
    video_fps: number;
  };
  summary: {
    total_reps: number;
    average_quality: { score: number; grade: string };
    performance_tier:
      | "excellent"
      | "good"
      | "needs_improvement"
      | "No_Valid_Reps_Detected";
    has_issues: boolean;
  };
  issues: { overall: string[]; frequency: Record<string, number> };
  analytics: { quality_trend: number[]; rep_durations: number[] };
  reps: RepSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "#4ADE80";
  if (score >= 60) return "#FACC15";
  return "#F87171";
}

function tierLabel(
  tier: AnalysisReport["summary"]["performance_tier"]
): string {
  if (tier === "excellent") return "EXCELLENT";
  if (tier === "good") return "GOOD";
  return "NEEDS WORK";
}

function tierColors(
  tier: AnalysisReport["summary"]["performance_tier"]
): [string, string] {
  if (tier === "excellent") return ["#4ADE80", "#22C55E"];
  if (tier === "good") return ["#FACC15", "#EAB308"];
  return ["#F87171", "#EF4444"];
}

function isValidReport(parsed: any): parsed is AnalysisReport {
  return (
    parsed?.summary?.average_quality?.score !== undefined &&
    parsed?.metadata?.exercise_type &&
    parsed?.issues &&
    parsed?.analytics &&
    Array.isArray(parsed?.reps)
  );
}

// ─── Demo / fallback data ─────────────────────────────────────────────────────
const DEMO_REPORT: AnalysisReport = {
  metadata: { exercise_type: "squat", duration_seconds: 45.2, video_fps: 30 },
  summary: {
    total_reps: 0,
    average_quality: { score: 0, grade: "N/A" },
    performance_tier: "No_Valid_Reps_Detected",
    has_issues: true,
  },
  issues: { overall: ["N/A"], frequency: { "N/A": 0 } },
  analytics: { quality_trend: [0], rep_durations: [0] },
  reps: [
    {
      id: 1,
      quality: { score: 0, grade: "N/A" },
      timing: { duration_seconds: 0 },
      form: { issues: [], is_perfect: false },
      metrics: { knee_angle: 0, back_lean: 0 },
    },
  ],
};

// ─── AI feedback ──────────────────────────────────────────────────────────────
function getAiFeedback(report: AnalysisReport): string {
  const { performance_tier } = report.summary;
  const topIssue = report.issues.overall[0];
  const reps = report.summary.total_reps;
  if (performance_tier === "excellent")
    return `Incredible session — ${reps} reps with near-perfect mechanics. Your consistency is paying off. Keep this momentum!`;
  if (performance_tier === "good") {
    if (topIssue)
      return `Solid work across ${reps} reps! Main area to target: "${topIssue}". Lock that in and you'll break into excellent territory.`;
    return `Good session with ${reps} clean reps. Small refinements in tempo will push your score higher next time.`;
  }
  if (topIssue)
    return `${reps} reps recorded. Your biggest limiter right now is "${topIssue}" — address this first and you'll see immediate improvement.`;
  return `${reps} reps completed. Focus on controlled movement and consistent depth. You've got this!`;
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const animValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: score / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);
  const color = scoreColor(score);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 8,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size - 10,
          height: size - 10,
          borderRadius: (size - 10) / 2,
          shadowColor: color,
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 10,
        }}
      />
      <Text style={{ color, fontSize: size * 0.3, fontWeight: "800", letterSpacing: -1 }}>
        {score}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "600", marginTop: -2 }}>
        /100
      </Text>
    </View>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function QualitySparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const W = SCREEN_WIDTH - 80;
  const H = 48;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - ((v - min) / (max - min + 0.001)) * H,
    v,
  }));
  return (
    <View style={{ height: H + 24, marginTop: 8 }}>
      {pts.map((pt, i) => (
        <View key={i} style={{ position: "absolute", left: pt.x - 4, top: pt.y - 4 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: scoreColor(pt.v),
              shadowColor: scoreColor(pt.v),
              shadowOpacity: 0.9,
              shadowRadius: 6,
            }}
          />
        </View>
      ))}
      {pts.slice(0, -1).map((pt, i) => {
        const next = pts[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={`line-${i}`}
            style={{
              position: "absolute",
              left: pt.x,
              top: pt.y,
              width: len,
              height: 1.5,
              backgroundColor: "rgba(255,255,255,0.2)",
              transformOrigin: "left center",
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
      {pts.map((pt, i) => (
        <Text
          key={`lbl-${i}`}
          style={{
            position: "absolute",
            left: pt.x - 6,
            top: H + 6,
            color: "rgba(255,255,255,0.35)",
            fontSize: 9,
            fontWeight: "600",
          }}
        >
          R{i + 1}
        </Text>
      ))}
    </View>
  );
}

// ─── Rep card ─────────────────────────────────────────────────────────────────
function RepCard({ rep }: { rep: RepSummary }) {
  const color = scoreColor(rep.quality.score);
  return (
    <View style={repStyles.card}>
      <View style={repStyles.header}>
        <View style={repStyles.repBadge}>
          <Text style={repStyles.repNum}>Rep {rep.id}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[repStyles.score, { color }]}>
            {rep.quality.score.toFixed(0)}
          </Text>
          <View style={[repStyles.gradeBadge, { borderColor: color }]}>
            <Text style={[repStyles.grade, { color }]}>{rep.quality.grade}</Text>
          </View>
        </View>
      </View>
      <View style={repStyles.meta}>
        <View style={repStyles.metaItem}>
          <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={repStyles.metaText}>
            {rep.timing.duration_seconds.toFixed(1)}s
          </Text>
        </View>
        {rep.form.is_perfect && (
          <View style={repStyles.perfectBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
            <Text style={repStyles.perfectText}>Perfect</Text>
          </View>
        )}
      </View>
      {rep.form.issues.length > 0 && (
        <View style={repStyles.issues}>
          {rep.form.issues.map((issue, i) => (
            <View key={i} style={repStyles.issueRow}>
              <View style={repStyles.issueDot} />
              <Text style={repStyles.issueText}>{issue}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const repStyles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  repBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  repNum: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700" },
  score: { fontSize: 22, fontWeight: "800" },
  gradeBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  grade: { fontSize: 12, fontWeight: "800" },
  meta: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  perfectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74,222,128,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  perfectText: { color: "#4ADE80", fontSize: 11, fontWeight: "600" },
  issues: { gap: 4 },
  issueRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  issueDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#F87171",
    marginTop: 5,
  },
  issueText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WorkoutSummaryScreen() {
  const router = useRouter();

  // Supports two entry paths:
  //  1. Fresh from camera:  params.report + params.videoUri
  //  2. From history:       params.workoutId  (fetches from DB)
  const params = useLocalSearchParams<{
    report?: string;
    videoUri?: string;
    workoutId?: string;
  }>();

  const [report, setReport] = useState<AnalysisReport>(DEMO_REPORT);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (loadingReport) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [loadingReport]);

  // ── Path 1: load from DB by workoutId ────────────────────────────────────
  useEffect(() => {
    if (!params.workoutId) return;
    setLoadingReport(true);
    setLoadError(null);

    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/workouts/${params.workoutId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();

        if (data.report && isValidReport(data.report)) {
          setReport(data.report);
        } else {
          console.warn("[WorkoutSummary] Invalid report from DB, using demo");
        }

        if (data.thumbnail_base64) {
          setThumbnail(`data:image/jpeg;base64,${data.thumbnail_base64}`);
        }
      } catch (e: any) {
        console.warn("[WorkoutSummary] DB fetch failed:", e);
        setLoadError("Could not load this workout.");
      } finally {
        setLoadingReport(false);
      }
    })();
  }, [params.workoutId]);

  // ── Path 2: parse from params (fresh from camera) ────────────────────────
  useEffect(() => {
    if (params.workoutId) return; // handled above

    // Parse report from params
    if (params.report) {
      try {
        const raw = JSON.parse(decodeURIComponent(params.report));
        const parsed = raw.report ?? raw;
        if (isValidReport(parsed)) {
          setReport(parsed);
        } else {
          console.warn("[WorkoutSummary] Invalid report structure in params");
        }
      } catch (e) {
        console.warn("[WorkoutSummary] Failed to parse report param:", e);
      }
    }

    // Generate thumbnail from video URI
    if (params.videoUri) {
      VideoThumbnails.getThumbnailAsync(decodeURIComponent(params.videoUri), {
        time: 1500,
        quality: 0.85,
      })
        .then(({ uri }) => setThumbnail(uri))
        .catch(() => {});
    }
  }, [params.report, params.videoUri]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingReport) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color="#4ADE80" size="large" />
        <Text style={styles.loadingText}>Loading workout…</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={styles.loadingRoot}>
        <Ionicons name="cloud-offline-outline" size={40} color="#F87171" />
        <Text style={styles.loadingText}>{loadError}</Text>
        <Pressable style={styles.errorBackBtn} onPress={() => router.back()}>
          <Text style={styles.errorBackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const { summary, issues, analytics, reps, metadata } = report;
  const overallScore = summary.average_quality.score;
  const overallColor = scoreColor(overallScore);
  const [tierC1, tierC2] = tierColors(summary.performance_tier);
  const exerciseName = metadata.exercise_type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .toUpperCase();
  const aiFeedback = getAiFeedback(report);

  // ── "Record Again" navigates correctly for both entry paths ──────────────
  const handleRecordAgain = () => {
    if (params.workoutId) {
      // Came from history — go back to past workouts, not camera
      router.back();
    } else {
      // Came from camera — go back to camera screen
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Back button — shown when loading from history */}
          {params.workoutId && (
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}

          <View style={styles.heroWrap}>
            <View style={styles.imageFrame}>
              <View style={[styles.frameBorder, { borderColor: overallColor }]}>
                {/* Corner decorators */}
                {(["TL", "TR", "BL", "BR"] as const).map((pos) => (
                  <View
                    key={pos}
                    style={[
                      styles.frameCorner,
                      pos.includes("T") ? { top: -2 } : { bottom: -2 },
                      pos.includes("L") ? { left: -2 } : { right: -2 },
                      { borderColor: overallColor },
                      pos === "TL" && { borderRightWidth: 0, borderBottomWidth: 0 },
                      pos === "TR" && { borderLeftWidth: 0, borderBottomWidth: 0 },
                      pos === "BL" && { borderRightWidth: 0, borderTopWidth: 0 },
                      pos === "BR" && { borderLeftWidth: 0, borderTopWidth: 0 },
                    ]}
                  />
                ))}

                {thumbnail ? (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={WORKOUT_IMAGE}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                )}

                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.75)"]}
                  style={styles.heroGradient}
                />

                <View style={[styles.exerciseBadge, { borderColor: overallColor }]}>
                  <Text style={[styles.exerciseBadgeText, { color: overallColor }]}>
                    {exerciseName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Score banner */}
            <View style={styles.scoreBanner}>
              <View style={styles.scoreBannerLeft}>
                <Text style={styles.scoreBannerTitle}>
                  {params.workoutId ? "WORKOUT HISTORY" : "ANALYSIS COMPLETE"}
                </Text>
                <View
                  style={[
                    styles.tierPill,
                    { backgroundColor: `${tierC1}22`, borderColor: tierC1 },
                  ]}
                >
                  <View style={[styles.tierDot, { backgroundColor: tierC1 }]} />
                  <Text style={[styles.tierText, { color: tierC1 }]}>
                    {tierLabel(summary.performance_tier)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="repeat-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.metaSmall}>{summary.total_reps} reps</Text>
                  <View style={styles.metaDivider} />
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.metaSmall}>
                    {metadata.duration_seconds.toFixed(0)}s
                  </Text>
                </View>
              </View>
              <ScoreRing score={Math.round(overallScore)} />
            </View>
          </View>
        </Animated.View>

        {/* ── METRICS GRID ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FORM BREAKDOWN</Text>
          <View style={styles.metricsGrid}>
            {[
              { key: "Quality", val: overallScore },
              { key: "Reps", val: summary.total_reps, unit: "" },
              { key: "Grade", val: summary.average_quality.grade, isText: true },
              {
                key: "Duration",
                val: metadata.duration_seconds.toFixed(0),
                unit: "s",
                isText: true,
              },
            ].map(({ key, val, unit, isText }) => {
              const numVal =
                typeof val === "number" ? val : parseFloat(String(val));
              const displayColor = isText
                ? "rgba(255,255,255,0.9)"
                : scoreColor(numVal);
              return (
                <View key={key} style={styles.metricTile}>
                  <Text style={[styles.metricTileVal, { color: displayColor }]}>
                    {val}
                    {unit ?? (isText ? "" : "")}
                  </Text>
                  <Text style={styles.metricTileKey}>{key}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── ISSUES ───────────────────────────────────────────────────── */}
        {issues.overall.length > 0 && issues.overall[0] !== "N/A" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMMON ISSUES</Text>
            <View style={styles.issuesCard}>
              {issues.overall.map((issue, i) => {
                const freq = issues.frequency[issue] ?? 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.issueItem,
                      i < issues.overall.length - 1 && styles.issueItemBorder,
                    ]}
                  >
                    <View style={styles.issueLeft}>
                      <View style={styles.issueIconWrap}>
                        <Ionicons name="warning-outline" size={14} color="#F87171" />
                      </View>
                      <Text style={styles.issueItemText}>{issue}</Text>
                    </View>
                    {freq > 0 && (
                      <View style={styles.freqBadge}>
                        <Text style={styles.freqText}>{freq}×</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── QUALITY TREND ────────────────────────────────────────────── */}
        {analytics.quality_trend.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUALITY TREND</Text>
            <View style={styles.trendCard}>
              <QualitySparkline data={analytics.quality_trend} />
            </View>
          </View>
        )}

        {/* ── AI COACH ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI COACH</Text>
          <View style={styles.aiCard}>
            <View style={styles.aiAvatarWrap}>
              <LinearGradient colors={[tierC1, tierC2]} style={styles.aiAvatar}>
                <Text style={{ fontSize: 22 }}>🤖</Text>
              </LinearGradient>
              <View style={[styles.aiOnline, { backgroundColor: tierC1 }]} />
            </View>
            <View style={styles.aiBubble}>
              <Text style={styles.aiText}>{aiFeedback}</Text>
            </View>
          </View>
        </View>

        {/* ── REP-BY-REP ───────────────────────────────────────────────── */}
        {reps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REP BY REP</Text>
            {reps.map((rep) => (
              <RepCard key={rep.id} rep={rep} />
            ))}
          </View>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          {/* Only show "Record Again" when coming fresh from camera */}
          {!params.workoutId && (
            <Pressable
              style={({ pressed }) => [
                styles.actionPrimary,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleRecordAgain}
            >
              <LinearGradient
                colors={[tierC1, tierC2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <Ionicons name="camera-outline" size={18} color="#000" />
                <Text style={styles.actionPrimaryText}>Record Again</Text>
              </LinearGradient>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.actionSecondary,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.actionSecondaryText}>
              {params.workoutId ? "Back to History" : "Back to Home"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0F" },
  scroll: { flex: 1 },
  content: { paddingTop: 56 },

  // Loading / error
  loadingRoot: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  loadingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  errorBackBtn: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  errorBackText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },

  // Back button (history mode)
  backBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  // Hero
  heroWrap: { marginHorizontal: 16, marginBottom: 8 },
  imageFrame: { marginBottom: 0 },
  frameBorder: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  frameCorner: {
    position: "absolute",
    width: 18,
    height: 18,
    borderWidth: 2.5,
    zIndex: 3,
  },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  exerciseBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 4,
  },
  exerciseBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },

  scoreBanner: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.07)",
  },
  scoreBannerLeft: { flex: 1, gap: 8 },
  scoreBannerTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaSmall: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // Sections
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Metrics grid
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricTile: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 52) / 2 - 5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  metricTileVal: { fontSize: 28, fontWeight: "800" },
  metricTileKey: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Issues
  issuesCard: {
    backgroundColor: "rgba(248,113,113,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
    overflow: "hidden",
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  issueItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(248,113,113,0.15)",
  },
  issueLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  issueIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(248,113,113,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  issueItemText: { color: "rgba(255,255,255,0.65)", fontSize: 13, flex: 1 },
  freqBadge: {
    backgroundColor: "rgba(248,113,113,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freqText: { color: "#F87171", fontSize: 11, fontWeight: "700" },

  // Trend
  trendCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    paddingBottom: 20,
  },

  // AI coach
  aiCard: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  aiAvatarWrap: { position: "relative" },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  aiOnline: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#0A0A0F",
  },
  aiBubble: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  aiText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },

  // Actions
  actions: { marginHorizontal: 16, marginTop: 28, gap: 10 },
  actionPrimary: { borderRadius: 16, overflow: "hidden" },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  actionPrimaryText: { color: "#000", fontSize: 15, fontWeight: "800" },
  actionSecondary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionSecondaryText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
});