import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/design";

type Props = {
  visible: boolean;
  exercises: string[];
  selectedExercise: string;
  onSelect: (exercise: string) => void;
  onClose: () => void;
};

export default function ExerciseSelectorModal({
  visible,
  exercises,
  selectedExercise,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>Select Exercise</Text>
          <Text style={styles.subtitle}>
            Choose the exercise so the AI can give targeted feedback.
          </Text>

          <FlatList
            data={exercises}
            keyExtractor={(item) => item}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => {
              const isSelected = item === selectedExercise;

              return (
                <Pressable
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    borderColor: Colors.primary,
    borderWidth: 1,
    backgroundColor: Colors.primary + "18",
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
});