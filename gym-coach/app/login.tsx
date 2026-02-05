import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Decorative corner pattern (approx) */}
          <CornerPipes position="topLeft" />
          <CornerPipes position="topRight" />

          <View style={styles.content}>
            {/* Robot-ish icon */}
            <View style={styles.iconRow}>
              <View style={styles.dotGreen} />
              <View style={styles.eyeBlack} />
              <View style={styles.eyeBlue} />
              <View style={styles.mouth} />
              <View style={styles.eyeBlue} />
              <View style={styles.eyeBlack} />
              <View style={styles.dotGreen} />
            </View>

            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Sign in to continue.</Text>

            <View style={styles.form}>
              <Text style={styles.label}>NAME</Text>
              <TextInput
                placeholder="Hi Robin!"
                placeholderTextColor="#6f6f6f"
                autoCapitalize="words"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 14 }]}>PASSWORD</Text>
              <TextInput
                placeholder="******"
                placeholderTextColor="#6f6f6f"
                secureTextEntry
                style={styles.input}
              />

              <Pressable style={styles.button} onPress={() => {}}>
                <Text style={styles.buttonText}>Log in</Text>
              </Pressable>

              <Pressable style={styles.forgotWrap} onPress={() => {}}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>

              <View style={styles.signupRow}>
                <Link href="/register" style={styles.signup}>
                  Sign up!
                </Link>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CornerPipes({ position }: { position: "topLeft" | "topRight" }) {
  const isRight = position === "topRight";
  return (
    <View style={[styles.pipesWrap, isRight ? { right: -10 } : { left: -10 }]}>
      {/* 8-ish pipe blocks, hand-placed */}
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
  // Simple layout map for the blocks (top corners)
  const base = [
    { top: 0, left: 0 },
    { top: 18, left: 34 },
    { top: 44, left: 10 },
    { top: 62, left: 44 },
    { top: 88, left: 18 },
    { top: 110, left: 54 },
    { top: 132, left: 28 },
    { top: 156, left: 64 },
  ];

  const p = base[i] ?? { top: 0, left: 0 };
  // Flip horizontally for right corner
  const left = isRight ? 140 - p.left : p.left;
  return { top: p.top, left };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  pipesWrap: {
    position: "absolute",
    top: -14,
    width: 180,
    height: 220,
    opacity: 0.95,
  },

  pipe: {
    position: "absolute",
    width: 46,
    height: 24,
    borderRadius: 14,
    backgroundColor: "#33A8FF",
    transform: [{ rotate: "90deg" }],
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  dotGreen: {
    width: 10,
    height: 22,
    borderRadius: 10,
    backgroundColor: "#B6F35B",
  },
  eyeBlack: {
    width: 14,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0A0A0A",
  },
  eyeBlue: {
    width: 12,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#2AA8FF",
  },
  mouth: {
    width: 44,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#5E5E5E",
    marginHorizontal: 2,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1B1B1B",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#9B9B9B",
    marginTop: 4,
    marginBottom: 26,
  },

  form: {
    width: "100%",
    maxWidth: 320,
  },

  label: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: "#A4A4A4",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#D7D7D7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1B1B1B",
  },

  button: {
    backgroundColor: "#171C1D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  forgotWrap: {
    alignItems: "center",
    marginTop: 18,
  },
  forgot: {
    color: "#B0B0B0",
    fontSize: 12,
  },

  signupRow: {
    alignItems: "center",
    marginTop: 10,
  },
  signup: {
    color: "#2AA8FF",
    fontSize: 12,
    fontWeight: "700",
  },
});
