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
  Dimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/app/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/app/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const accentAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(60)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(accentAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(formFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      if (token && user) {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user_id", (user.user_id || user.id).toString());
        await AsyncStorage.setItem(
          "profile_completed",
          user.profile_completed ? "true" : "false"
        );
        if (user.profile_completed) {
          router.replace("/home");
        } else {
          router.replace("/newUser");
        }
      } else {
        Alert.alert("Error", "Login failed (no token returned)");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || err.message;
      Alert.alert("Login failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Decorative background shapes */}
      <View style={styles.bgAccentTop} />
      <View style={[styles.bgAccentBottom, { backgroundColor: colors.isDark ? '#2AA8FF' : '#171C1D' }]} />
      <View style={styles.bgDot1} />
      <View style={styles.bgDot2} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <Animated.View
            style={[
              styles.headerBlock,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]}>Welcome{"\n"}Back.</Text>

            <Animated.View
              style={[
                styles.accentLine,
                {
                  opacity: accentAnim,
                  transform: [{ scaleX: accentAnim }],
                },
              ]}
            />
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formBlock,
              {
                opacity: formFade,
                transform: [{ translateY: formAnim }],
              },
            ]}
          >
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: emailFocused ? '#2AA8FF' : 'transparent' },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="you@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                {emailFocused && <View style={styles.inputAccentBar} />}
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: passwordFocused ? '#2AA8FF' : 'transparent' },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                {passwordFocused && <View style={styles.inputAccentBar} />}
              </View>
            </View>

            {/* Forgot Password */}
            <Pressable style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                style={[styles.button, { backgroundColor: colors.isDark ? '#2AA8FF' : '#171C1D' }, loading && styles.buttonLoading]}
                onPress={handleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <Text style={[styles.buttonText, { color: colors.isDark ? '#000' : '#fff' }]}>Logging in</Text>
                    <Text style={[styles.loadingDots, { color: colors.isDark ? '#000' : '#2AA8FF' }]}>...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={[styles.buttonText, { color: colors.isDark ? '#000' : '#fff' }]}>Log In</Text>
                    <Text style={[styles.buttonArrow, { color: colors.isDark ? '#000' : '#2AA8FF' }]}>→</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>NEW HERE?</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Sign up */}
            <Link href="/register" asChild>
              <Pressable style={{ ...styles.signupButton, borderColor: colors.border }}>
                <Text style={[styles.signupText, { color: colors.text }]}>Create an Account</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Background decorative elements
  bgAccentTop: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#2AA8FF",
    opacity: 0.07,
  },
  bgAccentBottom: {
    position: "absolute",
    bottom: 80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#171C1D",
    opacity: 0.04,
  },
  bgDot1: {
    position: "absolute",
    top: height * 0.3,
    right: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2AA8FF",
    opacity: 0.4,
  },
  bgDot2: {
    position: "absolute",
    top: height * 0.3 + 20,
    right: 40,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#2AA8FF",
    opacity: 0.25,
  },

  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },

  // Header
  headerBlock: {
    marginBottom: 40,
  },
  tagRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
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
    fontSize: 52,
    fontWeight: "900",
    color: "#171C1D",
    lineHeight: 56,
    letterSpacing: -1.5,
  },
  accentLine: {
    marginTop: 16,
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2AA8FF",
  },

  // Form
  formBlock: {
    width: "100%",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9E9E9E",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputWrapperFocused: {
    borderColor: "#2AA8FF",
    backgroundColor: "#F8FBFF",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: "#171C1D",
    fontWeight: "500",
  },
  inputAccentBar: {
    height: 3,
    backgroundColor: "#2AA8FF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  // Forgot
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 28,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: "#2AA8FF",
    fontWeight: "600",
  },

  // Button
  button: {
    backgroundColor: "#171C1D",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: "#171C1D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
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
    marginLeft: 2,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#CACACA",
    letterSpacing: 2,
  },

  // Sign up
  signupButton: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8E8E8",
    backgroundColor: "transparent",
  },
  signupText: {
    color: "#171C1D",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});