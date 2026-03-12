import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { API_BASE_URL } from "@/app/config/api";
import axios from "axios";

// ── Small unit toggle (kg / lbs) ─────────────────────────────────
function UnitToggle({
  unit,
  onToggle,
}: {
  unit: "kg" | "lbs";
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={unitStyles.wrap}>
      {(["kg", "lbs"] as const).map((u) => (
        <View key={u} style={[unitStyles.pill, unit === u && unitStyles.pillActive]}>
          <Text style={[unitStyles.text, unit === u && unitStyles.textActive]}>{u}</Text>
        </View>
      ))}
    </Pressable>
  );
}

const unitStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    padding: 2,
    marginLeft: 8,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillActive: { backgroundColor: "#171C1D" },
  text: { fontSize: 11, fontWeight: "700", color: "#9E9E9E" },
  textActive: { color: "#FFFFFF" },
});

// ── Generic numeric-only field with bounds ────────────────────────
function NumericField({
  label,
  value,
  onChangeText,
  placeholder,
  min,
  max,
  colors,
  rightSlot,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  min: number;
  max: number;
  colors: any;
  rightSlot?: React.ReactNode;
}) {
  const [err, setErr] = useState("");

  const handleChange = (raw: string) => {
    // Strip non-numeric (allow single decimal)
    const cleaned = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    onChangeText(cleaned);
    const num = parseFloat(cleaned);
    if (cleaned && (isNaN(num) || num < min || num > max)) {
      setErr(`Must be between ${min} and ${max}`);
    } else {
      setErr("");
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[fStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[fStyles.row]}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          style={[
            fStyles.input,
            { backgroundColor: colors.surface, borderColor: err ? "#E5484D" : colors.border, color: colors.text },
          ]}
        />
        {rightSlot}
      </View>
      {!!err && <Text style={fStyles.err}>{err}</Text>}
    </View>
  );
}

const fStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1, borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: "500",
  },
  err: { color: "#E5484D", fontSize: 11, fontWeight: "600", marginTop: 4 },
});

// ── Pill selector ─────────────────────────────────────────────────
function PillSelector({
  label,
  options,
  selected,
  onSelect,
  colors,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={[fStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {options.map((opt) => {
          const active = selected.toLowerCase() === opt.toLowerCase();
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              style={[
                pillStyles.pill,
                { backgroundColor: active ? "#171C1D" : colors.surface, borderColor: active ? "#2AA8FF" : colors.border },
              ]}
            >
              <Text style={[pillStyles.text, { color: active ? "#FFFFFF" : colors.textSecondary }]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  text: { fontSize: 13, fontWeight: "700" },
});

// ── Main Screen ───────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const { colors } = useTheme();

  // Pre-fill only if value exists — optional fields
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [dob, setDob] = useState<Date | undefined>(
    user?.date_of_birth ? new Date(user.date_of_birth) : undefined
  );
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [height, setHeight] = useState(
    user?.height_cm != null ? String(user.height_cm) : ""
  );
  const [weight, setWeight] = useState(
    user?.weight_kg != null ? String(user.weight_kg) : ""
  );

  const [fitnessLevel, setFitnessLevel] = useState(user?.fitness_level ?? "beginner");
  const [location, setLocation] = useState(user?.workout_location ?? "gym");
  const [saving, setSaving] = useState(false);

  // Recalculate displayed weight when unit changes
  const toggleUnit = () => {
    setWeightUnit((prev) => {
      const next = prev === "kg" ? "lbs" : "kg";
      const val = parseFloat(weight);
      if (!isNaN(val)) {
        setWeight(
          next === "lbs"
            ? (val * 2.20462).toFixed(1)
            : (val / 2.20462).toFixed(1)
        );
      }
      return next;
    });
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only build payload with filled fields
      const payload: any = {};
      if (dob) payload.date_of_birth = dob.toISOString().split("T")[0];

      if (height) {
        const h = parseFloat(height);
        if (h < 50 || h > 300) { Alert.alert("Invalid height", "Height must be between 50 and 300 cm."); setSaving(false); return; }
        payload.height_cm = h;
      }
      if (weight) {
        let w = parseFloat(weight);
        if (weightUnit === "lbs") w = w / 2.20462;
        if (w < 20 || w > 500) { Alert.alert("Invalid weight", "Please enter a valid weight."); setSaving(false); return; }
        payload.weight_kg = parseFloat(w.toFixed(2));
      }
      if (fitnessLevel) payload.fitness_level = fitnessLevel;
      if (location) payload.workout_location = location;

      // You need at least one field to update
      if (Object.keys(payload).length === 0 && !fullName) {
        Alert.alert("Nothing to save", "Make at least one change.");
        setSaving(false);
        return;
      }

      // profile/update requires all fields — send current values as fallback
      const finalPayload = {
        date_of_birth: payload.date_of_birth ?? (user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split("T")[0] : undefined),
        height_cm: payload.height_cm ?? user?.height_cm,
        weight_kg: payload.weight_kg ?? user?.weight_kg,
        fitness_level: payload.fitness_level ?? user?.fitness_level ?? "beginner",
        workout_location: payload.workout_location ?? user?.workout_location ?? "gym",
      };

      const resp = await axios.post(`${API_BASE_URL}/api/profile/update`, finalPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateUser({ ...resp.data.user, full_name: fullName || user?.full_name });

      Alert.alert("Saved!", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Only fill the fields you want to change
          </Text>
          <View style={styles.accentLine} />
        </View>

        {/* Full Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[fStyles.label, { color: colors.textSecondary }]}>FULL NAME</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={colors.textSecondary}
            style={[fStyles.input, { flex: undefined, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />
        </View>

        {/* Date of Birth — calendar picker only */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[fStyles.label, { color: colors.textSecondary }]}>DATE OF BIRTH</Text>
          <Pressable
            style={[
              styles.dateBtn,
              { backgroundColor: colors.surface, borderColor: dob ? "#2AA8FF" : colors.border },
            ]}
            onPress={() => { setTempDate(dob ?? new Date(2000, 0, 1)); setShowDatePicker(true); }}
          >
            <Ionicons name="calendar-outline" size={18} color={dob ? "#2AA8FF" : colors.textSecondary} />
            <Text style={[styles.dateBtnText, { color: dob ? colors.text : colors.textSecondary }]}>
              {dob ? formatDate(dob) : "Select date of birth"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Date picker modal */}
        {showDatePicker && (
          <View style={[styles.pickerCard, { backgroundColor: "#131212" }]}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              onChange={(_e, d) => { if (d) setTempDate(d); }}
              style={Platform.OS === "ios" ? { height: 180 } : {}}
            />
            <View style={styles.pickerBtns}>
              <Pressable style={styles.pickerCancel} onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: "#555", fontWeight: "700" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.pickerConfirm}
                onPress={() => { setDob(tempDate); setShowDatePicker(false); }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Height */}
        <NumericField
          label="HEIGHT (CM)"
          value={height}
          onChangeText={setHeight}
          placeholder="175"
          min={50}
          max={300}
          colors={colors}
        />

        {/* Weight with unit toggle */}
        <NumericField
          label={`WEIGHT (${weightUnit.toUpperCase()})`}
          value={weight}
          onChangeText={setWeight}
          placeholder={weightUnit === "kg" ? "75" : "165"}
          min={weightUnit === "kg" ? 20 : 44}
          max={weightUnit === "kg" ? 500 : 1100}
          colors={colors}
          rightSlot={<UnitToggle unit={weightUnit} onToggle={toggleUnit} />}
        />

        <PillSelector
          label="FITNESS LEVEL"
          options={["beginner", "intermediate", "pro"]}
          selected={fitnessLevel}
          onSelect={setFitnessLevel}
          colors={colors}
        />
        <PillSelector
          label="WORKOUT LOCATION"
          options={["gym", "home", "outdoors", "anywhere"]}
          selected={location}
          onSelect={setLocation}
          colors={colors}
        />

        {/* Save */}
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              <View style={styles.saveArrow}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            </>
          )}
        </Pressable>

        <View style={{ height: 80 }} />
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
  header: { marginTop: 64, marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, marginBottom: 20, justifyContent: "center" },
  title: { fontSize: 38, fontWeight: "900", letterSpacing: -1.2, lineHeight: 42 },
  subtitle: { fontSize: 13, fontWeight: "500", marginTop: 8 },
  accentLine: { marginTop: 18, width: 48, height: 4, borderRadius: 2, backgroundColor: "#2AA8FF" },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  dateBtnText: { flex: 1, fontSize: 15, fontWeight: "500" },
  pickerCard: { borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: "#2c2c2c" },
  pickerBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
  pickerCancel: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    alignItems: "center", backgroundColor: "#EFEFEF",
  },
  pickerConfirm: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    alignItems: "center", backgroundColor: "#171C1D",
  },
  saveBtn: {
    marginTop: 8, backgroundColor: "#171C1D",
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    shadowColor: "#171C1D", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 14, elevation: 6,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  saveArrow: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#2AA8FF",
    alignItems: "center", justifyContent: "center",
  },
});
