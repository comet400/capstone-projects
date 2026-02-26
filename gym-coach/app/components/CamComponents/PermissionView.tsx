import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/design";

type Props = {
  onRequest: () => void;
};

export default function PermissionView({ onRequest }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="camera-outline"
        size={64}
        color={Colors.textSecondary}
      />

      <Text style={styles.text}>
        Camera permission is required.
      </Text>

      <Pressable style={styles.button} onPress={onRequest}>
        <Text style={styles.buttonText}>Grant Permission</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 40,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});