import React, { useState } from "react";
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
} from "react-native";
import { Link, useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState(""); // changed to email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter both email and password");
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      { email, password }
    );

    const { token, user } = response.data;

    if (token && user) {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user_id", user.id.toString());
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
    console.log("Axios error response:", err.response);
    console.log("Axios error message:", err.message);
    const errorMsg = err.response?.data?.message || err.response?.data || err.message;
    Alert.alert("Login failed", errorMsg);
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Login</Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Log in"}
            </Text>
          </Pressable>

          <Link href="/register" style={styles.signup}>
            Sign up
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 20 },
  container: { flex: 1, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, marginTop: 10 },
  input: {
    backgroundColor: "#D7D7D7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#171C1D",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  signup: { marginTop: 20, color: "#2AA8FF", fontWeight: "700" },
});