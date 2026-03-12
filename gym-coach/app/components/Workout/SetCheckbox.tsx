import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SetCheckboxProps = {
  label: string;
  completed: boolean;
  onToggle: () => void;
};

export function SetCheckbox({ label, completed, onToggle }: SetCheckboxProps) {
  return (
    <Pressable
      style={[styles.row, completed && styles.rowCompleted]}
      onPress={onToggle}
    >
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
      <Text style={[styles.label, completed && styles.labelCompleted]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowCompleted: {
    opacity: 0.85,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  label: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  labelCompleted: {
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
});
