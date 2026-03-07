import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Password strength meter
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { level: 0, label: "", color: "#EFEFEF" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "#FF3B30" };
    if (score === 2) return { level: 2, label: "Fair", color: "#F5A623" };
    if (score === 3) return { level: 3, label: "Good", color: "#2AA8FF" };
    return { level: 4, label: "Strong", color: "#27AE60" };
  };

  const { level, label, color } = getStrength();
  if (!password) return null;

  return (
    <View style={strengthStyles.wrap}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i <= level ? color : "#EFEFEF" },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 2,
  },
  bars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: "700", width: 46, textAlign: "right" },
});

// Reusable field component
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.wrapper, focused && fieldStyles.wrapperFocused]}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BDBDBD"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "sentences"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && <View style={fieldStyles.accentBar} />}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9E9E9E",
    letterSpacing: 2,
    marginBottom: 8,
  },
  wrapper: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  wrapperFocused: {
    borderColor: "#2AA8FF",
    backgroundColor: "#F8FBFF",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#171C1D",
    fontWeight: "500",
  },
  accentBar: {
    height: 3,
    backgroundColor: "#2AA8FF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
});

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(40)).current;
  const accentScale = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(accentScale, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        full_name: fullName,
        email,
        password,
      });
      const { token, user } = response.data;
      if (token && user) {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user_id", user.user_id.toString());
        await AsyncStorage.setItem("profile_completed", "false");
        router.replace("/newUser");
      } else {
        Alert.alert("Error", "Registration failed");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || err.message;
      Alert.alert("Registration failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Bg blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />
      <View style={styles.bgDot1} />
      <View style={styles.bgDot2} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerBlock,
              {
                opacity: headerFade,
                transform: [{ translateY: headerSlide }],
              },
            ]}
          >
            <Text style={styles.title}>Let's go{"\n"}Gym!</Text>
            <Animated.View
            />
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formBlock,
              {
                opacity: formFade,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            <Field
              label="FULL NAME"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
            />
            <Field
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password with strength meter */}
            <View style={fieldStyles.group}>
              <Text style={fieldStyles.label}>PASSWORD</Text>
              <View
                style={[
                  fieldStyles.wrapper,
                  password.length > 0 && fieldStyles.wrapperFocused,
                ]}
              >
                <PasswordFieldInner value={password} onChangeText={setPassword} />
              </View>
              <PasswordStrength password={password} />
            </View>

            {/* Confirm Password */}
            <View style={fieldStyles.group}>
              <Text style={fieldStyles.label}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  fieldStyles.wrapper,
                  passwordsMatch && styles.wrapperMatch,
                  passwordsMismatch && styles.wrapperMismatch,
                ]}
              >
                <PasswordFieldInner
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {confirmPassword.length > 0 && (
                  <View style={[
                    fieldStyles.accentBar,
                    { backgroundColor: passwordsMatch ? "#27AE60" : passwordsMismatch ? "#FF3B30" : "#2AA8FF" }
                  ]} />
                )}
              </View>
              {passwordsMismatch && (
                <Text style={styles.mismatchText}>Passwords don't match</Text>
              )}
              {passwordsMatch && (
                <Text style={styles.matchText}>Passwords match ✓</Text>
              )}
            </View>

            {/* Sign up button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                style={[styles.button, loading && styles.buttonLoading]}
                onPress={handleRegister}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
              >
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>
                    {loading ? "Creating Account" : "Create Account"}
                  </Text>
                  {!loading && (
                    <Text style={styles.buttonArrow}>→</Text>
                  )}
                  {loading && <Text style={styles.loadingDots}>...</Text>}
                </View>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HAVE AN ACCOUNT?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login link */}
            <Link href="/login" asChild>
              <Pressable style={styles.loginButton}>
                <Text style={styles.loginText}>Log In</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Separate inner component so focus state doesn't conflict
function PasswordFieldInner({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <TextInput
      style={fieldStyles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="••••••••"
      placeholderTextColor="#BDBDBD"
      secureTextEntry
      autoCapitalize="none"
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // Bg blobs
  bgBlob1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#2AA8FF",
    opacity: 0.06,
  },
  bgBlob2: {
    position: "absolute",
    bottom: 100,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#171C1D",
    opacity: 0.04,
  },
  bgDot1: {
    position: "absolute",
    top: 260,
    right: 22,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2AA8FF",
    opacity: 0.35,
  },
  bgDot2: {
    position: "absolute",
    top: 282,
    right: 38,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#2AA8FF",
    opacity: 0.2,
  },

  // Header
  headerBlock: { marginTop: 24, marginBottom: 36 },
  tagRow: { flexDirection: "row", marginBottom: 16 },
  tagPill: {
    backgroundColor: "#171C1D",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#171C1D",
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  accentLine: {
    marginTop: 16,
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2AA8FF",
  },

  formBlock: { width: "100%" },

  // Password validation feedback
  wrapperMatch: {
    borderColor: "#27AE60",
    backgroundColor: "#F0FBF4",
  },
  wrapperMismatch: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F4",
  },
  mismatchText: {
    color: "#FF3B30",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 4,
  },
  matchText: {
    color: "#27AE60",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 4,
  },

  // Button
  button: {
    backgroundColor: "#171C1D",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#171C1D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonLoading: { opacity: 0.7 },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  buttonArrow: {
    color: "#2AA8FF",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingDots: {
    color: "#2AA8FF",
    fontSize: 16,
    fontWeight: "800",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8E8E8" },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#CACACA",
    letterSpacing: 2,
  },

  // Login button
  loginButton: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8E8E8",
  },
  loginText: {
    color: "#171C1D",
    fontWeight: "700",
    fontSize: 15,
  },
});