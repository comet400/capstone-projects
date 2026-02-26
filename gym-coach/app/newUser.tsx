import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function NewUserScreen() {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [tempDate, setTempDate] = useState<Date | undefined>(dateOfBirth);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("Beginner");
  const [workoutLocation, setWorkoutLocation] = useState("Gym");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!dateOfBirth || !height || !weight || !fitnessLevel || !workoutLocation) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      await axios.post(
        "http://172.20.10.4:5825/api/profile/update",
        {
          date_of_birth: dateOfBirth.toISOString().split("T")[0], // YYYY-MM-DD
          height_cm: parseInt(height),
          weight_kg: parseFloat(weight),
          fitness_level: fitnessLevel,
          workout_location: workoutLocation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", "Profile completed!");
      router.replace("/home");
    } catch (err: any) {
      console.log("Profile update error:", err.response || err.message);
      Alert.alert("Error", err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Format date as Month DD, YYYY (no weekday)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Complete Your Profile</Text>

            {/* Date of Birth */}
            <Text style={styles.label}>Date of Birth</Text>
            <Pressable
              style={styles.input}
              onPress={() => {
                setTempDate(dateOfBirth || new Date(2000, 0, 1));
                setShowDatePicker(true);
              }}
            >
              <Text>
                {dateOfBirth ? formatDate(dateOfBirth) : "Select your date of birth"}
              </Text>
            </Pressable>

            {showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setTempDate(selectedDate);
                  }}
                  style={{ backgroundColor: "#161515" }}
                />

                <View style={styles.pickerButtons}>
                  <Pressable
                    style={styles.confirmButton}
                    onPress={() => {
                      if (tempDate) setDateOfBirth(tempDate);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.confirmText}>Confirm</Text>
                  </Pressable>

                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Height */}
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              keyboardType="numeric"
              onChangeText={setHeight}
            />

            {/* Weight */}
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              keyboardType="numeric"
              onChangeText={setWeight}
            />

            {/* Fitness Level */}
            <Text style={styles.label}>Fitness Level</Text>
            <View style={styles.buttonGroup}>
              {["Beginner", "Intermediate", "Pro"].map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.optionButton,
                    fitnessLevel === level && styles.optionButtonSelected,
                  ]}
                  onPress={() => setFitnessLevel(level)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      fitnessLevel === level && styles.optionTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Workout Location */}
            <Text style={styles.label}>Workout Location</Text>
            <View style={styles.buttonGroup}>
              {["Gym", "Home"].map((location) => (
                <Pressable
                  key={location}
                  style={[
                    styles.optionButton,
                    workoutLocation === location && styles.optionButtonSelected,
                  ]}
                  onPress={() => setWorkoutLocation(location)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      workoutLocation === location && styles.optionTextSelected,
                    ]}
                  >
                    {location}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.submitButton, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Submitting..." : "Submit"}
              </Text>
            </Pressable>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 14, marginTop: 15, marginBottom: 5 },
  input: {
    backgroundColor: "#D7D7D7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    alignItems: "center",
  },
  optionButtonSelected: { backgroundColor: "#171C1D" },
  optionText: { color: "#000", fontWeight: "600" },
  optionTextSelected: { color: "#fff" },
  submitButton: {
    backgroundColor: "#171C1D",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700" },

  // DatePicker container
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 10,
    padding: 10,
    overflow: "hidden",
  },
  pickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#171C1D",
    borderRadius: 10,
    paddingVertical: 10,
    marginRight: 5,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "700" },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: 10,
    marginLeft: 5,
    alignItems: "center",
  },
  cancelText: { color: "#000", fontWeight: "700" },
});