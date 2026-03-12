import React, { useRef, useEffect, useState } from "react";
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
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { API_BASE_URL } from "@/app/config/api";
import axios from "axios";

const { width } = Dimensions.get("window");

const PROFILE_IMAGE = require("@/assets/images/home/featured.jpg");

// ── Animated grid card ──────────────────────────────────────────
function GridCard({
  icon,
  label,
  onPress,
  delay,
  accent,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  delay: number;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View
      style={[
        gridStyles.wrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <Pressable
        style={[
          gridStyles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={[gridStyles.iconCircle, accent && gridStyles.iconCircleAccent]}>
          <Ionicons name={icon as any} size={26} color="#2AA8FF" />
        </View>
        <Text style={[gridStyles.label, { color: colors.text }]}>{label}</Text>
        <View style={[gridStyles.arrow, accent ? gridStyles.arrowAccent : { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="arrow-forward" size={12} color={accent ? "#2AA8FF" : colors.textSecondary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const gridStyles = StyleSheet.create({
  wrap: { width: "47%" },
  card: {
    aspectRatio: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  cardAccent: {
    backgroundColor: "#171C1D",
    borderColor: "#171C1D",
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(42,168,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  iconCircleAccent: { backgroundColor: "rgba(42,168,255,0.18)" },
  label: {
    fontSize: 15, fontWeight: "800", letterSpacing: -0.3, marginTop: 8,
  },
  arrow: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center", alignSelf: "flex-end",
  },
  arrowAccent: { backgroundColor: "rgba(42,168,255,0.18)" },
});

// ── Reco card ───────────────────────────────────────────────────
function RecoCard({ source, label }: { source: any; label: string }) {
  return (
    <View style={recoStyles.wrap}>
      <Image source={source} style={recoStyles.image} resizeMode="cover" />
      <View style={recoStyles.scrim} />
      <Text style={recoStyles.label}>{label}</Text>
    </View>
  );
}

const recoStyles = StyleSheet.create({
  wrap: {
    width: 160, height: 120, borderRadius: 18,
    overflow: "hidden", marginRight: 12, position: "relative",
  },
  image: { width: "100%", height: "100%" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(23,28,29,0.28)" },
  label: {
    position: "absolute", bottom: 10, left: 12,
    color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 0.2,
  },
});

// ── Main Screen ─────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { colors } = useTheme();

  const [workoutsCompleted, setWorkoutsCompleted] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [formScore, setFormScore] = useState<number | null>(null);

  // Fetch dashboard overview stats
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE_URL}/api/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res: { data: { workoutsCompleted?: number; streak?: number } }) => {
        setWorkoutsCompleted(res.data.workoutsCompleted ?? 0);
        setStreak(res.data.streak ?? 0);
      })
      .catch((_err: unknown) => {
        // Fallback to zeros on error
        setWorkoutsCompleted(0);
        setStreak(0);
      });
  }, [token]);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const avatarScale = useRef(new Animated.Value(0.85)).current;
  const avatarFade = useRef(new Animated.Value(0)).current;
  const sectionFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 120 }),
        Animated.timing(avatarFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(sectionFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayName = user?.full_name ?? "Athlete";
  const firstName = displayName.split(" ")[0];

  const stats = [
    { val: workoutsCompleted != null ? String(workoutsCompleted) : "—", label: "Workouts" },
    { val: streak != null ? String(streak) : "—", label: "Streak" },
    { val: formScore != null ? String(formScore) : "—", label: "Form Score" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Name heading */}
        <Animated.View
          style={[
            styles.nameBlock,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>YOUR PROFILE</Text>
          <Text style={[styles.nameTitle, { color: colors.text }]}>{firstName}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <View style={styles.levelDot} />
            <Text style={styles.levelText}>
              {user?.fitness_level ? user.fitness_level.toUpperCase() : "MEMBER"}
            </Text>
          </View>
        </Animated.View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarWrap,
            { opacity: avatarFade, transform: [{ scale: avatarScale }] },
          ]}
        >
          <View style={styles.avatarRing}>
            <Image source={PROFILE_IMAGE} style={styles.mainAvatar} resizeMode="cover" />
          </View>
          <Pressable
            style={[styles.editBadge, { borderColor: colors.isDark ? '#2A2A2A' : '#FFFFFF' }]}
            onPress={() => router.push("/edit-profile")}
          >
            <Ionicons name="pencil" size={14} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        {/* Stats strip */}
        <Animated.View style={[styles.statsStrip, { opacity: sectionFade, backgroundColor: colors.surface, borderColor: colors.border }]}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.text }]}>{s.val}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
              {i < 2 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* Grid */}
        <View style={styles.grid}>
          <GridCard
            icon="barbell-outline"
            label="Past Workouts"
            onPress={() => router.push("/past-workouts")}
            delay={100}
            accent
          />
          <GridCard
            icon="bar-chart-outline"
            label="Progress"
            onPress={() => router.push("/progress")}
            delay={180}
          />
          <GridCard
            icon="sparkles-outline"
            label="Highlights"
            onPress={() => router.push("/highlights")}
            delay={260}
          />
          <GridCard
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
            delay={340}
          />
        </View>

        {/* Recommended */}
        <Animated.View style={[{ opacity: sectionFade }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended for you</Text>
            <Pressable style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={12} color="#2AA8FF" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}
          >
            <RecoCard source={require("@/assets/images/home/reco1.jpg")} label="HIIT Cardio" />
            <RecoCard source={require("@/assets/images/home/reco2.jpg")} label="Strength Builder" />
            <RecoCard source={require("@/assets/images/home/featured.jpg")} label="Core Blast" />
          </ScrollView>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgBlob1: {
    position: "absolute", top: -40, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#2AA8FF", opacity: 0.06,
  },
  bgBlob2: {
    position: "absolute", bottom: 200, left: -70,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#171C1D", opacity: 0.04,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  nameBlock: { marginTop: 60, marginBottom: 20 },
  greeting: { fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  nameTitle: { fontSize: 44, fontWeight: "900", lineHeight: 48, letterSpacing: -1.5 },
  levelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2AA8FF" },
  levelText: { color: "#2AA8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },

  avatarWrap: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  avatarRing: {
    width: 148, height: 148, borderRadius: 74,
    borderWidth: 3, borderColor: "#2AA8FF", padding: 3,
    shadowColor: "#2AA8FF", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  mainAvatar: { width: "100%", height: "100%", borderRadius: 70 },
  editBadge: {
    position: "absolute", bottom: 8, right: width / 2 - 82,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#171C1D",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },

  statsStrip: {
    flexDirection: "row",
    borderRadius: 20, paddingVertical: 18,
    paddingHorizontal: 12, marginBottom: 20,
    borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginTop: 3 },
  statDivider: { width: 1, marginVertical: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllText: { color: "#2AA8FF", fontSize: 12, fontWeight: "700" },
});