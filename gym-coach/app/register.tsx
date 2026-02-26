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
import { useRouter, Link } from "expo-router";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    const response = await axios.post(
      "http://172.20.10.4:5825/api/auth/register",
      { full_name: fullName, email, password }
    );

    const { token, user } = response.data;

    if (token && user) {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user_id", user.user_id.toString());
      await AsyncStorage.setItem("profile_completed", "false"); // initially false

      router.replace("/newUser"); // redirect to newUser profile screen
    } else {
      Alert.alert("Error", "Registration failed");
    }
  } catch (err: any) {
    console.log("Axios error response:", err.response);
    console.log("Axios error message:", err.message);
    const errorMsg = err.response?.data?.message || err.response?.data || err.message;
    Alert.alert("Registration failed", errorMsg);
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
          <Text style={styles.title}>Sign Up</Text>

          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Sign up"}
            </Text>
          </Pressable>

          <View style={{ marginTop: 10 }}>
            <Link href="/login" style={{ color: "#2AA8FF", fontWeight: "700" }}>
              Already have an account? Log in
            </Link>
          </View>
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
});