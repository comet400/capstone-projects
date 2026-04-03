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
import { useTheme } from "@/app/context/ThemeContext";

const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface CategoryScore {
  raw_score: number;
  weighted_score: number;
  weight: number;
  max_possible: number;
}

interface GradeBreakdown {
  [key: string]: CategoryScore;
}

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

// ─── Parsers ──────────────────────────────────────────────────────────────────
function parseGradeBreakdown(raw: string | undefined): GradeBreakdown | null {
  if (!raw) return null;
  try {
    if (typeof raw === "object") return raw as GradeBreakdown;
    const json = (raw as string)
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    return JSON.parse(json) as GradeBreakdown;
  } catch {
    return null;
  }
}

function parseFeedback(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const json = (raw as string).replace(/'/g, '"');
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

/** "knee_alignment" → "Knee Alignment" */
function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Map common category keys → Ionicons names; fallback to analytics icon */
const CATEGORY_ICONS: Record<string, string> = {
  depth:               "arrow-down-circle-outline",
  knee_alignment:      "git-compare-outline",
  torso_angle:         "body-outline",
  torso_control:       "body-outline",
  tempo_control:       "timer-outline",
  stability:           "pulse-outline",
  elbow_depth:         "arrow-down-circle-outline",
  body_alignment:      "body-outline",
  elbow_flare:         "expand-outline",
  shoulder_position:   "accessibility-outline",
  range_of_motion:     "resize-outline",
  chin_clearance:      "trending-up-outline",
  body_control:        "pulse-outline",
  shoulder_engagement: "accessibility-outline",
  full_extension:      "resize-outline",
  lockout_quality:     "lock-closed-outline",
  wrist_alignment:     "hand-left-outline",
  bar_symmetry:        "git-compare-outline",
  bar_path:            "navigate-outline",
  symmetry:            "git-compare-outline",
  peak_contraction:    "flash-outline",
  elbow_stability:     "remove-circle-outline",
  spine_neutrality:    "body-outline",
  hip_hinge_quality:   "shuffle-outline",
  lockout_strength:    "lock-closed-outline",
};

function categoryIcon(key: string): string {
  return CATEGORY_ICONS[key] ?? "analytics-outline";
}

/** Score-range tip that works for any exercise/category */
function genericTip(categoryKey: string, rawScore: number): string {
  const label = humanizeKey(categoryKey);
  if (rawScore >= 0.85) return `${label} is solid — keep it consistent.`;
  if (rawScore >= 0.65)
    return `Minor issues with ${label.toLowerCase()}. Slow the movement down and focus on control.`;
  return `${label} needs attention. Reduce load/speed and drill the movement pattern deliberately.`;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#4ADE80";
  if (score >= 60) return "#FACC15";
  return "#F87171";
}

function rawScoreColor(raw: number): string {
  if (raw >= 0.85) return "#4ADE80";
  if (raw >= 0.65) return "#FACC15";
  return "#F87171";
}

function tierLabel(tier: AnalysisReport["summary"]["performance_tier"]): string {
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

// ─── Demo / fallback ──────────────────────────────────────────────────────────
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
  reps: [],
};

// ─── AI feedback ──────────────────────────────────────────────────────────────
function getAiFeedback(report: AnalysisReport): string {
  const { performance_tier } = report.summary;
  const reps = report.summary.total_reps;
  const allFeedback = report.reps
    .flatMap((r) => parseFeedback(r.metrics.feedback as string))
    .filter(Boolean);
  const uniqueFeedback = [...new Set(allFeedback)];

  if (performance_tier === "excellent") {
    return uniqueFeedback.length
      ? `Incredible session — ${reps} reps with near-perfect mechanics. One refinement: ${uniqueFeedback[0].toLowerCase()}`
      : `Incredible session — ${reps} reps with near-perfect mechanics. Keep this momentum!`;
  }
  if (performance_tier === "good") {
    return uniqueFeedback.length
      ? `Solid work across ${reps} reps! Main focus: ${uniqueFeedback[0].toLowerCase()} Lock that in and you'll break into excellent territory.`
      : `Good session with ${reps} clean reps. Small refinements in tempo will push your score higher.`;
  }
  return uniqueFeedback.length
    ? `${reps} reps recorded. Priority fix: ${uniqueFeedback[0].toLowerCase()} Address this first for immediate gains.`
    : `${reps} reps completed. Focus on controlled movement and consistent form.`;
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const animValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animValue, { toValue: score / 100, duration: 1200, useNativeDriver: false }).start();
  }, [score]);
  const color = scoreColor(score);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        position: "absolute", width: size, height: size,
        borderRadius: size / 2, borderWidth: 8, borderColor: "rgba(255,255,255,0.07)",
      }} />
      <View style={{
        position: "absolute", width: size - 10, height: size - 10,
        borderRadius: (size - 10) / 2,
        shadowColor: color, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
      }} />
      <Text style={{ color, fontSize: size * 0.3, fontWeight: "800", letterSpacing: -1 }}>{score}</Text>
      <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "600", marginTop: -2 }}>/100</Text>
    </View>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function QualitySparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const W = SCREEN_WIDTH - 96;
  const H = 52;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - ((v - min) / (max - min + 0.001)) * H,
    v,
  }));
  return (
    <View style={{ height: H + 28, marginTop: 4 }}>
      {pts.slice(0, -1).map((pt, i) => {
        const next = pts[i + 1];
        const dx = next.x - pt.x, dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View key={`ln-${i}`} style={{
            position: "absolute", left: pt.x, top: pt.y, width: len, height: 1.5,
            backgroundColor: "rgba(255,255,255,0.13)",
            transformOrigin: "left center", transform: [{ rotate: `${angle}deg` }],
          }} />
        );
      })}
      {pts.map((pt, i) => (
        <View key={i} style={{ position: "absolute", left: pt.x - 5, top: pt.y - 5 }}>
          <View style={{
            width: 10, height: 10, borderRadius: 5, backgroundColor: scoreColor(pt.v),
            shadowColor: scoreColor(pt.v), shadowOpacity: 0.8, shadowRadius: 8,
          }} />
        </View>
      ))}
      {pts.map((pt, i) => (
        <Text key={`lb-${i}`} style={{
          position: "absolute", left: pt.x - 8, top: H + 10,
          color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: "600",
        }}>R{i + 1}</Text>
      ))}
    </View>
  );
}

// ─── Score breakdown bars — fully generic ─────────────────────────────────────
function ScoreBreakdownBars({ breakdown }: { breakdown: GradeBreakdown }) {
  const entries = Object.entries(breakdown).sort(([, a], [, b]) => a.raw_score - b.raw_score);
  return (
    <View>
      {entries.map(([key, cat], idx) => {
        const pct = cat.raw_score * 100;
        const color = rawScoreColor(cat.raw_score);
        const isWeak = cat.raw_score < 0.85;
        const isLast = idx === entries.length - 1;
        return (
          <View key={key} style={[bdStyles.row, !isLast && bdStyles.rowBorder]}>
            <View style={bdStyles.labelRow}>
              <View style={bdStyles.labelLeft}>
                <View style={[bdStyles.iconWrap, { backgroundColor: `${color}18` }]}>
                  <Ionicons name={categoryIcon(key) as any} size={14} color={color} />
                </View>
                <Text style={bdStyles.catLabel}>{humanizeKey(key)}</Text>
                {isWeak && (
                  <View style={[bdStyles.flagBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
                    <Text style={[bdStyles.flagText, { color }]}>
                      {cat.raw_score < 0.65 ? "FIX" : "REFINE"}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[bdStyles.scoreVal, { color }]}>
                {Math.round(cat.weighted_score)}/{Math.round(cat.max_possible)}
              </Text>
            </View>
            <View style={bdStyles.barTrack}>
              <View style={[bdStyles.barFill, { width: `${pct}%` as any, backgroundColor: color, shadowColor: color }]} />
            </View>
            {isWeak && (
              <View style={[bdStyles.tipBox, { borderLeftColor: color }]}>
                <Text style={bdStyles.tipText}>{genericTip(key, cat.raw_score)}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const bdStyles = StyleSheet.create({
  row: { paddingVertical: 14, gap: 8 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", flex: 1 },
  flagBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  flagText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  scoreVal: { fontSize: 12, fontWeight: "700", minWidth: 38, textAlign: "right" },
  barTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3, shadowOpacity: 0.5, shadowRadius: 6, elevation: 3 },
  tipBox: { borderLeftWidth: 2, paddingLeft: 10, paddingVertical: 2 },
  tipText: { color: "rgba(255,255,255,0.42)", fontSize: 12, lineHeight: 18 },
});

// ─── Generic symmetry panel ───────────────────────────────────────────────────
/** Auto-detects any left_* / right_* numeric metric pairs */
function SymmetryPanel({ metrics }: { metrics: Record<string, number | string> }) {
  const pairs: Array<{ label: string; left: number; right: number }> = [];
  const seen = new Set<string>();
  for (const key of Object.keys(metrics)) {
    if (!key.startsWith("left_")) continue;
    const suffix = key.slice(5);
    const rightKey = `right_${suffix}`;
    if (rightKey in metrics && !seen.has(suffix)) {
      const left = parseFloat(String(metrics[key]));
      const right = parseFloat(String(metrics[rightKey]));
      if (!isNaN(left) && !isNaN(right) && left > 0 && right > 0) {
        pairs.push({ label: humanizeKey(suffix), left, right });
        seen.add(suffix);
      }
    }
  }
  if (!pairs.length) return null;

  return (
    <View>
      {pairs.map(({ label, left, right }, idx) => {
        const diff = Math.abs(left - right);
        const total = left + right;
        const leftPct = (left / total) * 100;
        const symmetryScore = Math.max(0, 100 - diff * 2.5);
        const color = scoreColor(symmetryScore);
        const isLast = idx === pairs.length - 1;
        return (
          <View key={label} style={[symStyles.row, !isLast && symStyles.rowBorder]}>
            <Text style={symStyles.label}>{label}</Text>
            <View style={symStyles.angleRow}>
              <View style={symStyles.angleSide}>
                <Text style={[symStyles.angleVal, { color: left < right ? "#FACC15" : "rgba(255,255,255,0.8)" }]}>
                  {left.toFixed(1)}°
                </Text>
                <Text style={symStyles.angleLbl}>LEFT</Text>
              </View>
              <View style={[symStyles.diffChip, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
                <Text style={[symStyles.diffVal, { color }]}>{diff.toFixed(1)}°</Text>
                <Text style={symStyles.diffLbl}>diff</Text>
              </View>
              <View style={symStyles.angleSide}>
                <Text style={[symStyles.angleVal, { color: right < left ? "#FACC15" : "rgba(255,255,255,0.8)" }]}>
                  {right.toFixed(1)}°
                </Text>
                <Text style={symStyles.angleLbl}>RIGHT</Text>
              </View>
            </View>
            <View style={symStyles.splitTrack}>
              <View style={[symStyles.splitSide, { flex: leftPct, backgroundColor: left < right ? "#FACC15" : "#4ADE80" }]} />
              <View style={symStyles.splitDivider} />
              <View style={[symStyles.splitSide, { flex: 100 - leftPct, backgroundColor: right < left ? "#FACC15" : "#4ADE80" }]} />
            </View>
            {diff > 12 && (
              <View style={symStyles.warnBox}>
                <Ionicons name="warning-outline" size={13} color="#FACC15" />
                <Text style={symStyles.warnText}>
                  {diff.toFixed(1)}° imbalance detected. Focus on equal weight distribution and check mobility on the weaker side.
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const symStyles = StyleSheet.create({
  row: { paddingVertical: 14, gap: 10 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  label: { color: "rgba(255,255,255,0.38)", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  angleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  angleSide: { alignItems: "center", gap: 3, minWidth: 60 },
  angleVal: { fontSize: 20, fontWeight: "800" },
  angleLbl: { color: "rgba(255,255,255,0.22)", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  diffChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: "center", gap: 1 },
  diffVal: { fontSize: 15, fontWeight: "800" },
  diffLbl: { color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: "700" },
  splitTrack: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 },
  splitSide: { borderRadius: 3, height: "100%" },
  splitDivider: { width: 2, backgroundColor: "rgba(255,255,255,0.1)" },
  warnBox: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: "rgba(250,204,21,0.07)", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "rgba(250,204,21,0.2)",
  },
  warnText: { color: "rgba(255,255,255,0.48)", fontSize: 12, flex: 1, lineHeight: 18 },
});

// ─── Coaching panel — fully generic ──────────────────────────────────────────
function CoachingPanel({ reps }: { reps: RepSummary[] }) {
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  const allFeedback: string[] = [];

  for (const rep of reps) {
    const bd = parseGradeBreakdown(rep.metrics.grade_breakdown as string);
    if (bd) {
      for (const [key, cat] of Object.entries(bd)) {
        if (!categoryTotals[key]) categoryTotals[key] = { sum: 0, count: 0 };
        categoryTotals[key].sum += cat.raw_score;
        categoryTotals[key].count += 1;
      }
    }
    allFeedback.push(...parseFeedback(rep.metrics.feedback as string));
  }

  const uniqueFeedback = [...new Set(allFeedback)];
  const priorities = Object.entries(categoryTotals)
    .map(([key, { sum, count }]) => ({ key, avg: sum / count }))
    .filter((c) => c.avg < 0.85)
    .sort((a, b) => a.avg - b.avg);

  if (!priorities.length && !uniqueFeedback.length) return null;

  return (
    <View style={coachStyles.container}>
      {uniqueFeedback.length > 0 && (
        <View style={coachStyles.section}>
          <Text style={coachStyles.subHeader}>WHAT WAS FLAGGED</Text>
          {uniqueFeedback.map((msg, i) => (
            <View key={i} style={coachStyles.flagItem}>
              <Ionicons name="alert-circle-outline" size={14} color="#F87171" />
              <Text style={coachStyles.flagMsg}>{msg}</Text>
            </View>
          ))}
        </View>
      )}
      {priorities.length > 0 && (
        <View style={coachStyles.section}>
          <Text style={coachStyles.subHeader}>HOW TO IMPROVE</Text>
          <View>
            {priorities.map(({ key, avg }, idx) => {
              const color = rawScoreColor(avg);
              const isLast = idx === priorities.length - 1;
              return (
                <View key={key} style={[coachStyles.priorityItem, !isLast && coachStyles.priorityBorder]}>
                  <View style={coachStyles.priorityHeader}>
                    <View style={[coachStyles.priorityIcon, { backgroundColor: `${color}18` }]}>
                      <Ionicons name={categoryIcon(key) as any} size={14} color={color} />
                    </View>
                    <Text style={[coachStyles.priorityCat, { color }]}>{humanizeKey(key)}</Text>
                    <View style={[coachStyles.pctBadge, { backgroundColor: `${color}18` }]}>
                      <Text style={[coachStyles.pctText, { color }]}>{Math.round(avg * 100)}%</Text>
                    </View>
                  </View>
                  <Text style={coachStyles.tip}>{genericTip(key, avg)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const coachStyles = StyleSheet.create({
  container: { gap: 20 },
  section: { gap: 10 },
  subHeader: { color: "rgba(255,255,255,0.22)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  flagItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "rgba(248,113,113,0.07)", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "rgba(248,113,113,0.18)",
  },
  flagMsg: { color: "rgba(255,255,255,0.58)", fontSize: 13, flex: 1, lineHeight: 20 },
  priorityItem: { paddingVertical: 14, gap: 7 },
  priorityBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  priorityHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  priorityIcon: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  priorityCat: { fontSize: 13, fontWeight: "700", flex: 1 },
  pctBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pctText: { fontSize: 11, fontWeight: "700" },
  tip: { color: "rgba(255,255,255,0.42)", fontSize: 12, lineHeight: 18 },
});

// ─── Rep card ─────────────────────────────────────────────────────────────────
function RepCard({ rep }: { rep: RepSummary }) {
  const [expanded, setExpanded] = useState(false);
  const color = scoreColor(rep.quality.score);
  const breakdown = parseGradeBreakdown(rep.metrics.grade_breakdown as string);
  const feedback = parseFeedback(rep.metrics.feedback as string);

  const weakest = breakdown
    ? Object.entries(breakdown).sort(([, a], [, b]) => a.raw_score - b.raw_score)[0]
    : null;

  const hasPairs = Object.keys(rep.metrics).some(
    (k) => k.startsWith("left_") && `right_${k.slice(5)}` in rep.metrics
  );

  return (
    <View style={repStyles.card}>
      <Pressable style={repStyles.header} onPress={() => setExpanded((e) => !e)}>
        <View style={repStyles.repBadge}>
          <Text style={repStyles.repNum}>Rep {rep.id}</Text>
        </View>
        <View style={repStyles.weakWrap}>
          {weakest && weakest[1].raw_score < 0.85 && (
            <View style={repStyles.weakBadge}>
              <Ionicons name={categoryIcon(weakest[0]) as any} size={11} color="#FACC15" />
              <Text style={repStyles.weakText} numberOfLines={1}>{humanizeKey(weakest[0])}</Text>
            </View>
          )}
        </View>
        <View style={repStyles.scoreRow}>
          <Text style={[repStyles.score, { color }]}>{rep.quality.score.toFixed(0)}</Text>
          <View style={[repStyles.gradeBadge, { borderColor: color }]}>
            <Text style={[repStyles.grade, { color }]}>{rep.quality.grade}</Text>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color="rgba(255,255,255,0.22)" />
        </View>
      </Pressable>

      <View style={repStyles.meta}>
        <View style={repStyles.metaItem}>
          <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.22)" />
          <Text style={repStyles.metaText}>{rep.timing.duration_seconds.toFixed(1)}s</Text>
        </View>
        {rep.form.is_perfect && (
          <View style={repStyles.perfectBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
            <Text style={repStyles.perfectText}>Perfect form</Text>
          </View>
        )}
      </View>

      {feedback.length > 0 && (
        <View style={repStyles.feedbackBox}>
          {feedback.map((msg, i) => (
            <View key={i} style={repStyles.feedbackRow}>
              <Ionicons name="bulb-outline" size={13} color="#FACC15" />
              <Text style={repStyles.feedbackText}>{msg}</Text>
            </View>
          ))}
        </View>
      )}

      {expanded && (
        <View style={repStyles.expandedWrap}>
          {breakdown && (
            <>
              <Text style={repStyles.expandedTitle}>SCORE BREAKDOWN</Text>
              <ScoreBreakdownBars breakdown={breakdown} />
            </>
          )}
          {hasPairs && (
            <View style={{ marginTop: breakdown ? 16 : 0 }}>
              <Text style={repStyles.expandedTitle}>SYMMETRY</Text>
              <SymmetryPanel metrics={rep.metrics as Record<string, number | string>} />
            </View>
          )}
        </View>
      )}

      {(breakdown || hasPairs) && !expanded && (
        <Pressable style={repStyles.expandHint} onPress={() => setExpanded(true)}>
          <Text style={repStyles.expandHintText}>View full breakdown →</Text>
        </Pressable>
      )}
    </View>
  );
}

const repStyles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  repBadge: { backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
  repNum: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "700" },
  weakWrap: { flex: 1 },
  weakBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(250,204,21,0.1)", borderRadius: 7,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(250,204,21,0.22)", alignSelf: "flex-start",
  },
  weakText: { color: "#FACC15", fontSize: 11, fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  score: { fontSize: 22, fontWeight: "800" },
  gradeBadge: { width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  grade: { fontSize: 11, fontWeight: "800" },
  meta: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "rgba(255,255,255,0.25)", fontSize: 11 },
  perfectBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(74,222,128,0.1)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  perfectText: { color: "#4ADE80", fontSize: 11, fontWeight: "600" },
  feedbackBox: {
    backgroundColor: "rgba(250,204,21,0.06)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(250,204,21,0.15)", padding: 10, gap: 6,
  },
  feedbackRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  feedbackText: { color: "rgba(255,255,255,0.58)", fontSize: 12, flex: 1, lineHeight: 18 },
  expandedWrap: { paddingTop: 4, gap: 6 },
  expandedTitle: { color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2 },
  expandHint: { alignSelf: "flex-start" },
  expandHintText: { color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: "600" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ report?: string; videoUri?: string; workoutId?: string }>();
  const { colors } = useTheme();

  const [report, setReport] = useState<AnalysisReport>(DEMO_REPORT);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [annotatedFrame, setAnnotatedFrame] = useState<string | null>(null);
  const [annotatedGif, setAnnotatedGif] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (loadingReport) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [loadingReport]);

  useEffect(() => {
    if (!params.workoutId) return;
    setLoadingReport(true);
    setLoadError(null);
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/workouts/${params.workoutId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();
        if (data.report && isValidReport(data.report)) setReport(data.report);
        if (data.thumbnail_base64) setThumbnail(`data:image/jpeg;base64,${data.thumbnail_base64}`);
        if (data.annotated_frame) setAnnotatedFrame(`data:image/jpeg;base64,${data.annotated_frame}`);
        else if (data.report?.annotated_frame) setAnnotatedFrame(`data:image/jpeg;base64,${data.report.annotated_frame}`);
        const gif = data.annotated_gif ?? data.report?.annotated_gif;
        if (gif) setAnnotatedGif(`data:image/gif;base64,${gif}`);
      } catch {
        setLoadError("Could not load this workout.");
      } finally {
        setLoadingReport(false);
      }
    })();
  }, [params.workoutId]);

  useEffect(() => {
    if (params.workoutId) return;
    if (params.report) {
      try {
        const raw = JSON.parse(decodeURIComponent(params.report));
        const parsed = raw.report ?? raw;
        if (isValidReport(parsed)) setReport(parsed);
        if (raw.annotated_frame) setAnnotatedFrame(`data:image/jpeg;base64,${raw.annotated_frame}`);
        const gif = raw.annotated_gif ?? raw.report?.annotated_gif;
        if (gif) setAnnotatedGif(`data:image/gif;base64,${gif}`);
      } catch {}
    }
    if (params.videoUri) {
      VideoThumbnails.getThumbnailAsync(decodeURIComponent(params.videoUri), { time: 1500, quality: 0.85 })
        .then(({ uri }) => setThumbnail(uri))
        .catch(() => {});
    }
  }, [params.report, params.videoUri]);

  if (loadingReport) {
    return (
      <View style={S.loadingRoot}>
        <ActivityIndicator color="#4ADE80" size="large" />
        <Text style={S.loadingText}>Loading workout…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={S.loadingRoot}>
        <Ionicons name="cloud-offline-outline" size={40} color="#F87171" />
        <Text style={S.loadingText}>{loadError}</Text>
        <Pressable style={S.errorBackBtn} onPress={() => router.back()}>
          <Text style={S.errorBackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { summary, analytics, reps, metadata } = report;
  const overallScore = summary.average_quality.score;
  const overallColor = scoreColor(overallScore);
  const [tierC1, tierC2] = tierColors(summary.performance_tier);

  const exerciseName = metadata.exercise_type
    .split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").toUpperCase();
  const aiFeedback = getAiFeedback(report);

  // Aggregate grade breakdown across all reps
  const aggBreakdown: GradeBreakdown = {};
  if (reps.length > 0) {
    const totals: Record<string, { sr: number; sw: number; w: number; m: number; n: number }> = {};
    for (const rep of reps) {
      const bd = parseGradeBreakdown(rep.metrics.grade_breakdown as string);
      if (!bd) continue;
      for (const [key, cat] of Object.entries(bd)) {
        if (!totals[key]) totals[key] = { sr: 0, sw: 0, w: cat.weight, m: cat.max_possible, n: 0 };
        totals[key].sr += cat.raw_score;
        totals[key].sw += cat.weighted_score;
        totals[key].n += 1;
      }
    }
    for (const [key, t] of Object.entries(totals)) {
      aggBreakdown[key] = { raw_score: t.sr / t.n, weighted_score: t.sw / t.n, weight: t.w, max_possible: t.m };
    }
  }

  // Aggregate left/right metrics for symmetry panel
  const avgMetrics: Record<string, number | string> = {};
  if (reps.length > 0) {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const rep of reps) {
      for (const [key, val] of Object.entries(rep.metrics)) {
        const num = parseFloat(String(val));
        if (!isNaN(num)) { sums[key] = (sums[key] ?? 0) + num; counts[key] = (counts[key] ?? 0) + 1; }
      }
    }
    for (const key of Object.keys(sums)) avgMetrics[key] = sums[key] / counts[key];
  }

  const hasSymmetry = Object.keys(avgMetrics).some(
    (k) => k.startsWith("left_") && `right_${k.slice(5)}` in avgMetrics
  );

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <ScrollView style={S.scroll} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {params.workoutId && (
            <Pressable style={S.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
          <View style={S.heroWrap}>
            <View style={[S.frameBorder, { borderColor: overallColor }]}>
              {(["TL", "TR", "BL", "BR"] as const).map((pos) => (
                <View key={pos} style={[
                  S.frameCorner, { borderColor: overallColor },
                  pos.includes("T") ? { top: -2 } : { bottom: -2 },
                  pos.includes("L") ? { left: -2 } : { right: -2 },
                  pos === "TL" && { borderRightWidth: 0, borderBottomWidth: 0 },
                  pos === "TR" && { borderLeftWidth: 0, borderBottomWidth: 0 },
                  pos === "BL" && { borderRightWidth: 0, borderTopWidth: 0 },
                  pos === "BR" && { borderLeftWidth: 0, borderTopWidth: 0 },
                ]} />
              ))}
              {thumbnail
                ? <Image source={{ uri: thumbnail }} style={S.heroImage} resizeMode="cover" />
                : <Image source={WORKOUT_IMAGE} style={S.heroImage} resizeMode="cover" />
              }
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.82)"]} style={S.heroGradient} />
              <View style={[S.exerciseBadge, { borderColor: overallColor }]}>
                <Text style={[S.exerciseBadgeText, { color: overallColor }]}>{exerciseName}</Text>
              </View>
            </View>

            <View style={S.scoreBanner}>
              <View style={S.scoreBannerLeft}>
                <Text style={S.bannerEyebrow}>
                  {params.workoutId ? "WORKOUT HISTORY" : "ANALYSIS COMPLETE"}
                </Text>
                <View style={[S.tierPill, { backgroundColor: `${tierC1}20`, borderColor: `${tierC1}55` }]}>
                  <View style={[S.tierDot, { backgroundColor: tierC1 }]} />
                  <Text style={[S.tierText, { color: tierC1 }]}>{tierLabel(summary.performance_tier)}</Text>
                </View>
                <View style={S.metaRow}>
                  <Ionicons name="repeat-outline" size={13} color="rgba(255,255,255,0.32)" />
                  <Text style={S.metaSmall}>{summary.total_reps} reps</Text>
                  <View style={S.metaDivider} />
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.32)" />
                  <Text style={S.metaSmall}>{metadata.duration_seconds.toFixed(0)}s</Text>
                </View>
              </View>
              <ScoreRing score={Math.round(overallScore)} />
            </View>
          </View>
        </Animated.View>

        {/* ── STATS STRIP ───────────────────────────────────────────────── */}
        <View style={S.section}>
          <View style={S.statsStrip}>
            {[
              { label: "Score", value: Math.round(overallScore).toString(), colored: true },
              { label: "Reps",  value: summary.total_reps.toString(), colored: false },
              { label: "Grade", value: summary.average_quality.grade, colored: false },
              { label: "Time",  value: `${metadata.duration_seconds.toFixed(0)}s`, colored: false },
            ].map(({ label, value, colored }, idx, arr) => (
              <View key={label} style={[S.statItem, idx < arr.length - 1 && S.statBorder]}>
                <Text style={[S.statVal, { color: colored ? overallColor : "rgba(255,255,255,0.88)" }]}>
                  {value}
                </Text>
                <Text style={S.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SCORE BREAKDOWN ───────────────────────────────────────────── */}
        {Object.keys(aggBreakdown).length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SCORE BREAKDOWN</Text>
            <View style={S.card}>
              <ScoreBreakdownBars breakdown={aggBreakdown} />
            </View>
          </View>
        )}

        {/* ── SYMMETRY ──────────────────────────────────────────────────── */}
        {hasSymmetry && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SYMMETRY</Text>
            <View style={S.card}>
              <SymmetryPanel metrics={avgMetrics} />
            </View>
          </View>
        )}

        {/* ── COACHING PLAN ─────────────────────────────────────────────── */}
        {reps.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>COACHING PLAN</Text>
            <View style={[S.card, { paddingVertical: 16 }]}>
              <CoachingPanel reps={reps} />
            </View>
          </View>
        )}

        {/* ── FORM ANALYSIS ─────────────────────────────────────────────── */}
        {(annotatedGif || annotatedFrame) && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>FORM ANALYSIS</Text>
            <View style={S.skeletonCard}>
              <Image source={{ uri: annotatedGif ?? annotatedFrame! }} style={S.skeletonImage} resizeMode="contain" />
              {annotatedGif && <Text style={S.skeletonCaption}>First rep replay - looping</Text>}
              <View style={S.legendRow}>
                {[["#4ADE80","Good"], ["#FACC15","Borderline"], ["#F87171","Needs work"]].map(([c, l]) => (
                  <View key={l} style={S.legendItem}>
                    <View style={[S.legendDot, { backgroundColor: c }]} />
                    <Text style={S.legendText}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── QUALITY TREND ─────────────────────────────────────────────── */}
        {analytics.quality_trend.length > 1 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>QUALITY TREND</Text>
            <View style={S.card}>
              <QualitySparkline data={analytics.quality_trend} />
            </View>
          </View>
        )}

        {/* ── AI COACH ──────────────────────────────────────────────────── */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>AI COACH</Text>
          <View style={S.aiRow}>
            <View>
              <LinearGradient colors={[tierC1, tierC2]} style={S.aiAvatar}>
                <Ionicons name="sparkles-outline" size={22} color="#000" />
              </LinearGradient>
              <View style={[S.aiOnline, { backgroundColor: tierC1 }]} />
            </View>
            <View style={S.aiBubble}>
              <Text style={S.aiText}>{aiFeedback}</Text>
            </View>
          </View>
        </View>

        {/* ── REP BY REP ────────────────────────────────────────────────── */}
        {reps.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>REP BY REP</Text>
            {reps.map((rep) => <RepCard key={rep.id} rep={rep} />)}
          </View>
        )}

        {/* ── ACTIONS ───────────────────────────────────────────────────── */}
        <View style={S.actions}>
          {!params.workoutId && (
            <Pressable
              style={({ pressed }) => [S.actionPrimary, pressed && { opacity: 0.8 }]}
              onPress={() => router.back()}
            >
              <LinearGradient colors={[tierC1, tierC2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.actionGradient}>
                <Ionicons name="camera-outline" size={18} color="#000" />
                <Text style={S.actionPrimaryText}>Record Again</Text>
              </LinearGradient>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [S.actionSecondary, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <Text style={S.actionSecondaryText}>
              {params.workoutId ? "Back to History" : "Back to Home"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 64 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A0F" },
  scroll: { flex: 1 },
  content: { paddingTop: 52 },

  loadingRoot: { flex: 1, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  loadingText: { color: "rgba(255,255,255,0.32)", fontSize: 15, fontWeight: "500", textAlign: "center" },
  errorBackBtn: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.07)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  errorBackText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },

  backBtn: { marginHorizontal: 20, marginBottom: 14, width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },

  // Hero
  heroWrap: { marginHorizontal: 20 },
  frameBorder: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden", aspectRatio: 4 / 3, position: "relative" },
  frameCorner: { position: "absolute", width: 18, height: 18, borderWidth: 2.5, zIndex: 3 },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  exerciseBadge: { position: "absolute", bottom: 14, left: 14, borderRadius: 7, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 4 },
  exerciseBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },

  scoreBanner: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingHorizontal: 20, paddingVertical: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderTopWidth: 0, borderColor: "rgba(255,255,255,0.07)" },
  scoreBannerLeft: { flex: 1, gap: 10 },
  bannerEyebrow: { color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  tierPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start" },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  metaSmall: { color: "rgba(255,255,255,0.32)", fontSize: 12 },
  metaDivider: { width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.1)" },

  // Layout
  section: { marginHorizontal: 20, marginTop: 28 },
  sectionLabel: { color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 12 },
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", paddingHorizontal: 16, paddingVertical: 2 },

  // Stats strip
  statsStrip: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", overflow: "hidden" },
  statItem: { flex: 1, paddingVertical: 18, alignItems: "center", gap: 4 },
  statBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "rgba(255,255,255,0.07)" },
  statVal: { fontSize: 22, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },

  // Skeleton
  skeletonCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", overflow: "hidden" },
  skeletonImage: { width: "100%", aspectRatio: 4 / 3, backgroundColor: "#000" },
  skeletonCaption: { color: "rgba(255,255,255,0.28)", fontSize: 11, fontWeight: "600", textAlign: "center", paddingTop: 10, letterSpacing: 0.5 },
  traceVideoButton: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(74,222,128,0.10)", borderWidth: 1, borderColor: "rgba(74,222,128,0.25)" },
  traceVideoButtonText: { color: "#4ADE80", fontSize: 12, fontWeight: "700" },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 20, paddingVertical: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: "rgba(255,255,255,0.38)", fontSize: 11, fontWeight: "600" },

  // AI coach
  aiRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  aiAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  aiOnline: { position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#0A0A0F" },
  aiBubble: { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, borderTopLeftRadius: 4, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  aiText: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 22, fontStyle: "italic" },

  // Actions
  actions: { marginHorizontal: 20, marginTop: 32, gap: 10 },
  actionPrimary: { borderRadius: 16, overflow: "hidden" },
  actionGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  actionPrimaryText: { color: "#000", fontSize: 15, fontWeight: "800" },
  actionSecondary: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  actionSecondaryText: { color: "rgba(255,255,255,0.42)", fontSize: 15, fontWeight: "600" },
});
