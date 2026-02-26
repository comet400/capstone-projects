import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/design";

type Props = {
  processingStep: number;
  steps: string[];
  onCancel?: () => void;
  backgroundTip?: string;
};

export default function ProcessingOverlay({
  processingStep,
  steps,
  onCancel,
  backgroundTip,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="fitness-outline"
        size={48}
        color={Colors.primary}
        style={{ marginBottom: 30 }}
      />

      <Text style={styles.title}>Analyzing Your Workout</Text>

      {steps.map((step, index) => {
        const isActive = index === processingStep;
        const isDone = index < processingStep;

        return (
          <View key={step} style={styles.row}>
            <View
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isDone && styles.dotDone,
              ]}
            >
              {isDone && (
                <Ionicons name="checkmark" size={14} color="#000" />
              )}
            </View>
            <Text
              style={[
                styles.text,
                isActive && styles.textActive,
                isDone && styles.textDone,
              ]}
            >
              {step}
            </Text>
          </View>
        );
      })}

      {backgroundTip && (
        <View style={styles.tipContainer}>
          <Ionicons
            name="information-circle-outline"
            size={15}
            color={Colors.textSecondary}
          />
          <Text style={styles.tipText}>{backgroundTip}</Text>
        </View>
      )}

      {onCancel && (
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 30,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.secondary },
  text: { color: Colors.textSecondary, fontSize: 15 },
  textActive: { color: Colors.primary, fontWeight: "600" },
  textDone: { color: Colors.text },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 24,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  cancelText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});