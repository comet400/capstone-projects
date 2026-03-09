import React, { useState, useRef, useEffect } from "react";
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
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/app/config/api";

// ── Step indicator ──────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === current && dotStyles.dotActive, i < current && dotStyles.dotDone]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EFEFEF" },
  dotActive: { width: 24, backgroundColor: "#171C1D" },
  dotDone: { backgroundColor: "#2AA8FF" },
});

// ── Labelled text input ─────────────────────────────────────────
function Field({ label, value, onChangeText, keyboardType, placeholder, suffix }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.wrapper, focused && fieldStyles.wrapperFocused]}>
        <TextInput
          style={[fieldStyles.input, suffix && { paddingRight: 48 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? "default"}
          placeholder={placeholder ?? ""}
          placeholderTextColor="#BDBDBD"
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && <Text style={fieldStyles.suffix}>{suffix}</Text>}
        {focused && <View style={fieldStyles.accentBar} />}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: "800", color: "#9E9E9E", letterSpacing: 2, marginBottom: 8 },
  wrapper: {
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  wrapperFocused: { borderColor: "#2AA8FF", backgroundColor: "#F8FBFF" },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#171C1D", fontWeight: "500" },
  suffix: { paddingRight: 14, fontSize: 13, fontWeight: "700", color: "#ABABAB" },
  accentBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#2AA8FF", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
});

// ── Pill option selector ────────────────────────────────────────
function OptionGroup({ options, selected, onSelect, icons }: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  icons?: string[];
}) {
  return (
    <View style={optStyles.row}>
      {options.map((opt, i) => {
        const isSelected = selected === opt;
        return (
          <Pressable
            key={opt}
            style={[optStyles.pill, isSelected && optStyles.pillSelected]}
            onPress={() => onSelect(opt)}
          >
            {icons?.[i] && (
              <Ionicons
                name={icons[i] as any}
                size={16}
                color={isSelected ? "#fff" : "#9E9E9E"}
              />
            )}
            <Text style={[optStyles.text, isSelected && optStyles.textSelected]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const optStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginBottom: 18 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F4",
    borderWidth: 1.5,
    borderColor: "transparent",
    flexDirection: "row",
    gap: 6,
  },
  pillSelected: { backgroundColor: "#171C1D", borderColor: "#171C1D" },
  text: { color: "#9E9E9E", fontWeight: "700", fontSize: 13 },
  textSelected: { color: "#FFFFFF" },
});

// ── Section heading ─────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return <Text style={sectionStyles.label}>{label}</Text>;
}
const sectionStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "800", color: "#9E9E9E", letterSpacing: 2, marginBottom: 8 },
});

// ── Main screen ─────────────────────────────────────────────────
export default function NewUserScreen() {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("Beginner");
  const [workoutLocation, setWorkoutLocation] = useState("Gym");
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const accentAnim = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(accentAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const handleSubmit = async () => {
    if (!dateOfBirth || !height || !weight || !fitnessLevel || !workoutLocation) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/profile/update`,
        {
          date_of_birth: dateOfBirth.toISOString().split("T")[0],
          height_cm: parseInt(height),
          weight_kg: parseFloat(weight),
          fitness_level: fitnessLevel,
          workout_location: workoutLocation,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Profile completed!");
      router.replace("/home");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Determine how many fields are filled for progress dots
  const filledCount = [dateOfBirth, height, weight, fitnessLevel, workoutLocation].filter(Boolean).length;
  const stepIndex = Math.min(Math.floor((filledCount / 5) * 4), 3);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Bg blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />
      <View style={styles.bgDot1} />
      <View style={styles.bgDot2} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View
              style={[styles.headerBlock, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <Text style={styles.title}>Build Your{"\n"}Profile.</Text>
            </Animated.View>

            {/* Progress dots */}
            <StepDots total={4} current={stepIndex} />

            {/* Form */}
            <Animated.View style={[{ opacity: formFade, transform: [{ translateY: formSlide }] }]}>

              {/* Date of Birth */}
              <View style={fieldStyles.group}>
                <SectionLabel label="DATE OF BIRTH" />
                <Pressable
                  style={[styles.dateInput, dateOfBirth && styles.dateInputFilled]}
                  onPress={() => {
                    setTempDate(dateOfBirth || new Date(2000, 0, 1));
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={dateOfBirth ? "#2AA8FF" : "#ABABAB"}
                  />
                  <Text style={[styles.dateText, dateOfBirth && styles.dateTextFilled]}>
                    {dateOfBirth ? formatDate(dateOfBirth) : "Select your date of birth"}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
                </Pressable>
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <View style={styles.pickerCard}>
                  <DateTimePicker
                    value={tempDate || new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) setTempDate(selectedDate);
                    }}
                    style={Platform.OS === "ios" ? { height: 180 } : {}}
                  />
                  <View style={styles.pickerBtnRow}>
                    <Pressable
                      style={styles.pickerCancelBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.pickerCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.pickerConfirmBtn}
                      onPress={() => {
                        if (tempDate) setDateOfBirth(tempDate);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={styles.pickerConfirmText}>Confirm</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Measurements row */}
              <View style={styles.measureRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="HEIGHT"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="175"
                    suffix="cm"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="WEIGHT"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="70"
                    suffix="kg"
                  />
                </View>
              </View>

              {/* Fitness Level */}
              <View style={fieldStyles.group}>
                <SectionLabel label="FITNESS LEVEL" />
                <OptionGroup
                  options={["Beginner", "Intermediate", "Pro"]}
                  selected={fitnessLevel}
                  onSelect={setFitnessLevel}
                />
              </View>

              {/* Workout Location */}
              <View style={fieldStyles.group}>
                <SectionLabel label="WORKOUT LOCATION" />
                <OptionGroup
                  options={["Gym", "Home"]}
                  selected={workoutLocation}
                  onSelect={setWorkoutLocation}
                  icons={["barbell-outline", "home-outline"]}
                />
              </View>

              {/* Submit */}
              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <Pressable
                  style={[styles.submitBtn, loading && styles.submitBtnLoading]}
                  onPress={handleSubmit}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  disabled={loading}
                >
                  <View style={styles.submitInner}>
                    <Text style={styles.submitText}>
                      {loading ? "Saving Profile" : "Complete Profile"}
                    </Text>
                    {!loading
                      ? <Text style={styles.submitArrow}>→</Text>
                      : <Text style={styles.submitDots}>...</Text>
                    }
                  </View>
                </Pressable>
              </Animated.View>

            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  scrollContent: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 52 },

  bgBlob1: {
    position: "absolute", top: -40, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#2AA8FF", opacity: 0.06,
  },
  bgBlob2: {
    position: "absolute", bottom: 100, left: -70,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#171C1D", opacity: 0.04,
  },
  bgDot1: {
    position: "absolute", top: 270, right: 22,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#2AA8FF", opacity: 0.35,
  },
  bgDot2: {
    position: "absolute", top: 292, right: 38,
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: "#2AA8FF", opacity: 0.2,
  },

  // Header
  headerBlock: { marginTop: 24, marginBottom: 28 },
  tagRow: { flexDirection: "row", marginBottom: 16 },
  tagPill: {
    backgroundColor: "#171C1D", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  tagText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: {
    fontSize: 48, fontWeight: "900", color: "#171C1D",
    lineHeight: 52, letterSpacing: -1.5,
  },
  accentLine: {
    marginTop: 16, width: 56, height: 4,
    borderRadius: 2, backgroundColor: "#2AA8FF",
  },

  // Date input
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F4F4F4",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dateInputFilled: {
    borderColor: "#C8E8FF",
    backgroundColor: "#F8FBFF",
  },
  dateText: { flex: 1, fontSize: 15, color: "#BDBDBD", fontWeight: "500" },
  dateTextFilled: { color: "#171C1D" },

  // Date picker card
  pickerCard: {
    backgroundColor: "#131212",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  pickerBtnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  pickerCancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    alignItems: "center", backgroundColor: "#EFEFEF",
    borderWidth: 1, borderColor: "#E0E0E0",
  },
  pickerCancelText: { color: "#555", fontWeight: "700", fontSize: 14 },
  pickerConfirmBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    alignItems: "center", backgroundColor: "#171C1D",
    shadowColor: "#171C1D", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  pickerConfirmText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },

  // Measurement row
  measureRow: { flexDirection: "row", gap: 12 },

  // Submit
  submitBtn: {
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
  submitBtnLoading: { opacity: 0.7 },
  submitInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 },
  submitArrow: { color: "#2AA8FF", fontSize: 18, fontWeight: "700" },
  submitDots: { color: "#2AA8FF", fontSize: 16, fontWeight: "800" },
});