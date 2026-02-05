import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("Jiara Martins");
  const [email, setEmail] = useState("hello@reallygreatsite.com");
  const [password, setPassword] = useState("******");
  const [dob, setDob] = useState<string>("Select");
  const [dobOpen, setDobOpen] = useState(false);

  // quick preset DOB list (simple + looks like your mockup “Select” dropdown)
  const dobOptions = useMemo(
    () => [
      "Jan 01, 2000",
      "Mar 14, 2002",
      "Aug 22, 2004",
      "Dec 31, 2006",
      "Select",
    ],
    []
  );

  const pickDob = (v: string) => {
    setDob(v === "Select" ? "Select" : v);
    setDobOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top pattern + back arrow */}
        <CornerPipes position="topLeft" />
        <CornerPipes position="topRight" />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        {/* Dark rounded panel */}
        <View style={styles.panel}>
          <Text style={styles.title}>Create new{"\n"}Account</Text>

          <Text style={styles.sub}>
            Already Registered?{" "}
            <Text style={styles.subLink} onPress={() => router.replace("/login")}>
              Log in here.
            </Text>
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#8e8e8e"
              autoCapitalize="words"
              style={styles.input}
            />

            <Text style={[styles.label, styles.mt]}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor="#8e8e8e"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={[styles.label, styles.mt]}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="******"
              placeholderTextColor="#8e8e8e"
              secureTextEntry
              style={styles.input}
            />

            <Text style={[styles.label, styles.mt]}>DATE OF BIRTH</Text>
            <Pressable
              style={styles.select}
              onPress={() => setDobOpen(true)}
              accessibilityRole="button"
            >
              <Text style={[styles.selectText, dob === "Select" && styles.selectMuted]}>
                {dob}
              </Text>
            </Pressable>

            <Pressable style={styles.cta} onPress={() => {}}>
              <Text style={styles.ctaText}>Sign up</Text>
            </Pressable>
          </View>
        </View>

        {/* DOB Modal (simple list) */}
        <Modal visible={dobOpen} transparent animationType="fade" onRequestClose={() => setDobOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setDobOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Select date of birth</Text>
              <FlatList
                data={dobOptions.filter((x) => x !== "Select")}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable style={styles.modalItem} onPress={() => pickDob(item)}>
                    <Text style={styles.modalItemText}>{item}</Text>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSep} />}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/** Decorative corner pattern (same idea as Login) */
function CornerPipes({ position }: { position: "topLeft" | "topRight" }) {
  const isRight = position === "topRight";
  return (
    <View style={[styles.pipesWrap, isRight ? { right: -10 } : { left: -10 }]}>
      <View style={[styles.pipe, pipePos(isRight, 0)]} />
      <View style={[styles.pipe, pipePos(isRight, 1)]} />
      <View style={[styles.pipe, pipePos(isRight, 2)]} />
      <View style={[styles.pipe, pipePos(isRight, 3)]} />
      <View style={[styles.pipe, pipePos(isRight, 4)]} />
      <View style={[styles.pipe, pipePos(isRight, 5)]} />
      <View style={[styles.pipe, pipePos(isRight, 6)]} />
      <View style={[styles.pipe, pipePos(isRight, 7)]} />
    </View>
  );
}

function pipePos(isRight: boolean, i: number) {
  const base = [
    { top: 0, left: 6 },
    { top: 20, left: 42 },
    { top: 48, left: 10 },
    { top: 64, left: 54 },
    { top: 92, left: 22 },
    { top: 114, left: 64 },
    { top: 138, left: 30 },
    { top: 160, left: 78 },
  ];
  const p = base[i] ?? { top: 0, left: 0 };
  const left = isRight ? 150 - p.left : p.left;
  return { top: p.top, left };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },

  pipesWrap: {
    position: "absolute",
    top: -10,
    width: 200,
    height: 220,
    opacity: 0.95,
  },
  pipe: {
    position: "absolute",
    width: 48,
    height: 24,
    borderRadius: 14,
    backgroundColor: "#33A8FF",
    transform: [{ rotate: "90deg" }],
  },

  backBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 18 : 10,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 24, color: "#0F0F0F" },

  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 140,
    backgroundColor: "#161B1C",
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 26,
    paddingTop: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 34,
    textAlign: "center",
  },

  sub: {
    marginTop: 10,
    textAlign: "center",
    color: "#9AA0A6",
    fontSize: 12,
  },
  subLink: {
    color: "#BFFF5A",
    fontWeight: "700",
  },

  form: {
    marginTop: 26,
  },

  label: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: "#2AA8FF",
    marginBottom: 8,
  },
  mt: { marginTop: 14 },

  input: {
    backgroundColor: "#5F676B",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#fff",
  },

  select: {
    backgroundColor: "#5F676B",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  selectText: { fontSize: 14, color: "#fff" },
  selectMuted: { color: "#D3D3D3" },

  cta: {
    marginTop: 24,
    backgroundColor: "#BFFF5A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    color: "#0D0F10",
    fontWeight: "800",
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalItemText: { fontSize: 14, color: "#111" },
  modalSep: { height: 1, backgroundColor: "#eee" },
});
