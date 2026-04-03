import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { colors } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Manage your preferences
      </Text>

      {/* Account */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

      <SettingsRow
        icon="account-outline"
        label="Profile"
        onPress={() => router.push("/edit-profile")}
        colors={colors}
      />
      <SettingsRow
        icon="lock-outline"
        label="Change Password"
        onPress={() => {}}
        colors={colors}
      />

      {/* Preferences */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

      <SettingsRow
        icon="bell-outline"
        label="Notifications"
        onPress={() => {}}
        colors={colors}
      />
      <SettingsRow
        icon="theme-light-dark"
        label="Appearance"
        onPress={() => router.push("/appearance")}
        colors={colors}
      />
      <SettingsRow
        icon="dumbbell"
        label="Training Split"
        onPress={() => router.push("/split-selector")}
        colors={colors}
      />
      <SettingsRow
        icon="target"
        label="Fitness Goal"
        onPress={() => router.push("/goal-selector")}
        colors={colors}
      />

      {/* More */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>More</Text>

      <Pressable
        style={[styles.logoutRow, { backgroundColor: colors.surface }]}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={22} color="#E5484D" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={[styles.row, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons name={icon} size={22} color="#2AA8FF" />
        <Text style={[styles.rowText, { color: colors.text }]}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: "800",
  },
  backButton: {
    marginTop: 56,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 14,
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
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
    fontSize: 15,
    fontWeight: "600",
  },
  logoutRow: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#E5484D",
  },
});
