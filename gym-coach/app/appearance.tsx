import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, ThemePreference } from "@/app/context/ThemeContext";

// ── Mini preview card ─────────────────────────────────────────────
function PreviewPhone({ dark }: { dark: boolean }) {
  const bg = dark ? "#121212" : "#FFFFFF";
  const card = dark ? "#1E1E1E" : "#F0F0F0";
  const pill = dark ? "#2A2A2A" : "#E0E0E0";
  const dot = "#2AA8FF";
  return (
    <View style={[previewStyles.phone, { backgroundColor: bg }]}>
      {/* Nav dots */}
      <View style={previewStyles.topRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[previewStyles.dot, { backgroundColor: i === 1 ? dot : pill }]} />
        ))}
      </View>
      {/* Cards */}
      <View style={[previewStyles.card, { backgroundColor: card }]} />
      <View style={[previewStyles.cardSm, { backgroundColor: card }]} />
    </View>
  );
}

const previewStyles = StyleSheet.create({
  phone: {
    width: 70,
    height: 100,
    borderRadius: 12,
    padding: 10,
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  topRow: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: { height: 28, borderRadius: 8 },
  cardSm: { height: 18, borderRadius: 6 },
});

// ── Option card ───────────────────────────────────────────────────
function OptionCard({
  label,
  desc,
  value,
  current,
  dark,
  onPress,
  delay,
}: {
  label: string;
  desc: string;
  value: ThemePreference;
  current: ThemePreference;
  dark: boolean;
  onPress: () => void;
  delay: number;
}) {
  const { colors } = useTheme();
  const selected = current === value;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        flex: 1,
      }}
    >
      <Pressable
        style={[
          styles.optCard,
          {
            backgroundColor: selected ? "#171C1D" : colors.surface,
            borderColor: selected ? "#2AA8FF" : colors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <PreviewPhone dark={dark} />
        <Text style={[styles.optLabel, { color: selected ? "#FFFFFF" : colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.optDesc, { color: selected ? "rgba(255,255,255,0.6)" : colors.textSecondary }]}>
          {desc}
        </Text>
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────
export default function AppearanceScreen() {
  const router = useRouter();
  const { preference, setPreference, colors } = useTheme();

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const options: { label: string; desc: string; value: ThemePreference; dark: boolean }[] = [
    { label: "System", desc: "Follows your device", value: "system", dark: false },
    { label: "Light", desc: "Always light", value: "light", dark: false },
    { label: "Dark", desc: "Always dark", value: "dark", dark: true },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
        >
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.tagRow}>
            <View style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>SETTINGS</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose how GymCoach looks to you
          </Text>
          <View style={[styles.accentLine]} />
        </Animated.View>

        {/* Options row */}
        <View style={styles.optRow}>
          {options.map((o, i) => (
            <OptionCard
              key={o.value}
              {...o}
              current={preference}
              onPress={() => setPreference(o.value)}
              delay={120 + i * 80}
            />
          ))}
        </View>

        {/* Info note */}
        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color="#2AA8FF" />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Your preference is saved automatically and applied across the entire app.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob1: {
    position: "absolute", top: -40, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#2AA8FF", opacity: 0.06,
  },
  blob2: {
    position: "absolute", bottom: 200, left: -70,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#171C1D", opacity: 0.04,
  },
  scroll: { paddingHorizontal: 20 },
  header: { marginTop: 64, marginBottom: 32 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    marginBottom: 20, justifyContent: "center",
  },
  tagRow: { marginBottom: 12 },
  tagPill: {
    alignSelf: "flex-start",
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  tagText: { fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { fontSize: 38, fontWeight: "900", letterSpacing: -1.2, lineHeight: 42 },
  subtitle: { fontSize: 14, fontWeight: "500", marginTop: 8, lineHeight: 20 },
  accentLine: {
    marginTop: 18, width: 48, height: 4, borderRadius: 2, backgroundColor: "#2AA8FF",
  },

  // Option cards
  optRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  optCard: {
    borderRadius: 20, padding: 14, borderWidth: 1.5,
    alignItems: "center", gap: 10, position: "relative",
  },
  optLabel: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  optDesc: { fontSize: 11, fontWeight: "500" },
  checkBadge: {
    position: "absolute", top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#2AA8FF",
    alignItems: "center", justifyContent: "center",
  },

  // Info note
  note: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "500" },
});
