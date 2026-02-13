import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "@/constants/design";

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Manage your preferences
      </Text>

      {/* Profile */}
      <Text style={styles.sectionTitle}>
        Account
      </Text>

      <SettingsRow
        icon="account-outline"
        label="Profile"
      />
      <SettingsRow
        icon="lock-outline"
        label="Change Password"
      />

      {/* Preferences */}
      <Text style={styles.sectionTitle}>
        Preferences
      </Text>

      <SettingsRow
        icon="bell-outline"
        label="Notifications"
      />
      <SettingsRow
        icon="theme-light-dark"
        label="Appearance"
      />
      <SettingsRow
        icon="target"
        label="Workout Goals"
      />

      {/* Logout */}
      <Text style={styles.sectionTitle}>
        More
      </Text>

      <Pressable style={styles.logoutRow}>
        <MaterialCommunityIcons
          name="logout"
          size={22}
          color="#E5484D"
        />
        <Text style={styles.logoutText}>
          Log Out
        </Text>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
}) {
  return (
    <Pressable style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={Colors.primary}
        />
        <Text style={styles.rowText}>
          {label}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={Colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },

  title: {
    marginTop: 60,
    fontSize: Typography.sizes.xl,
    fontWeight: "800",
    color: Colors.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  sectionTitle: {
    marginTop: 32,
    marginBottom: 14,
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text,
  },

  row: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowText: {
    marginLeft: 12,
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: Colors.text,
  },

  logoutRow: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  logoutText: {
    marginLeft: 12,
    fontSize: Typography.sizes.md,
    fontWeight: "600",
    color: "#E5484D",
  },
});
