import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const lightColors = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  primary: "#6366F1",
  secondary: "#10B981",
  accent: "#F59E0B",
  border: "#F0F0F0",
  shadow: "#000000",
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const response = await axios.get(
      "http://10.0.0.138:5825/api/profile/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("PROFILE RESPONSE:", response.data);
    setUser(response.data);
    } catch (error) {
      console.log("Failed to load profile:", error);
    }
  };

  fetchUser();
}, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with profile icon */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, {user?.full_name?.split(" ")[0] || "User"}</Text>
          <Text style={styles.subGreeting}>Let's crush your goals today</Text>
        </View>
        <View style={styles.profileIcon}>
          <Text style={styles.profileInitials}>
            {user?.full_name
              ? user.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
              : "U"}
        </Text>
        </View>
      </View>

      {/* Today's Overview */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>TODAY'S OVERVIEW</Text>
          <Text style={styles.cardLink}>Details</Text>
        </View>
        
        <View style={styles.progressRow}>
          <View style={styles.progressRingContainer}>
            <View style={styles.progressRing}>
              <View style={styles.progressInner}>
                <Text style={styles.progressNumber}>70%</Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>weekly Progress</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>458</Text>
              <Text style={styles.statLabel}>mins</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>2.3k</Text>
              <Text style={styles.statLabel}>kcal</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>workouts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>streak</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Today's Workout */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>TODAY'S WORKOUT</Text>
          <Text style={styles.cardLink}>Start</Text>
        </View>
        
        <View style={styles.workoutRow}>
          <Image
            source={require("@/assets/images/home/featured.jpg")}
            style={styles.workoutImage}
          />
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>30 Min HIIT Cardio</Text>
            <Text style={styles.workoutMeta}>3 exercises · 4 sets</Text>
            <View style={styles.workoutTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Full Body</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>HIIT</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tomorrows's Workout */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>TOMORROW'S WORKOUT</Text>
          <Text style={styles.cardLink}>View</Text>
        </View>
        
        <View style={styles.workoutRow}>
          <Image
            source={require("@/assets/images/home/featured.jpg")}
            style={styles.workoutImage}
          />
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>30 Min HIIT Cardio</Text>
            <Text style={styles.workoutMeta}>3 exercises · 4 sets</Text>
            <View style={styles.workoutTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Full Body</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>HIIT</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Dashboard Card 4: Recommended */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>RECOMMENDED FOR YOU</Text>
          <Text style={styles.cardLink}>More</Text>
        </View>
        
        <View style={styles.recommendedRow}>
          <View style={styles.recommendedItem}>
            <Image
              source={require("@/assets/images/home/reco1.jpg")}
              style={styles.recommendedImage}
            />
            <Text style={styles.recommendedName}>Full Body Stretch</Text>
            <Text style={styles.recommendedMeta}>15 min · beginner</Text>
          </View>
          
          <View style={styles.recommendedItem}>
            <Image
              source={require("@/assets/images/home/reco2.jpg")}
              style={styles.recommendedImage}
            />
            <Text style={styles.recommendedName}>Core Strength</Text>
            <Text style={styles.recommendedMeta}>20 min · intermediate</Text>
          </View>
        </View>
      </View>

      {/* Dashboard Card 5: Upgrade (special styling) */}
      <Pressable style={styles.upgradeCard} onPress={() => router.push("/paid-plan-tab")}>
        <View style={styles.upgradeContent}>
          <View>
            <Text style={styles.upgradeTitle}>Unlock Premium</Text>
            <Text style={styles.upgradeDescription}>Get access to all programs and features</Text>
          </View>
          <View style={styles.upgradeBadge}>
            <Text style={styles.upgradeBadgeText}>→</Text>
          </View>
        </View>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: lightColors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  subGreeting: {
    color: lightColors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  // New profile icon styles
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lightColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  // Dashboard card styles
  dashboardCard: {
    backgroundColor: lightColors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: lightColors.border,
    shadowColor: lightColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: lightColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardLink: {
    color: lightColors.primary,
    fontSize: 12,
    fontWeight: "600",
  },

  // Progress section
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressRingContainer: {
    alignItems: "center",
    marginRight: 20,
  },
  progressRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: lightColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: lightColors.background,
  },
  progressInner: {
    alignItems: "center",
  },
  progressNumber: {
    color: lightColors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  progressLabel: {
    color: lightColors.textTertiary,
    fontSize: 10,
    fontWeight: "500",
  },
  statsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    width: "40%",
    backgroundColor: lightColors.surface,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  statValue: {
    color: lightColors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    color: lightColors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },

  // Workout section
  workoutRow: {
    flexDirection: "row",
    gap: 14,
  },
  workoutImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  workoutInfo: {
    flex: 1,
    justifyContent: "center",
  },
  workoutName: {
    color: lightColors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  workoutMeta: {
    color: lightColors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  workoutTags: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    backgroundColor: lightColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: lightColors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },

  // Programs section
  programCard: {
    width: 130,
    marginRight: 12,
    backgroundColor: lightColors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  programImage: {
    width: "100%",
    height: 80,
  },
  programCardContent: {
    padding: 10,
  },
  programCardTitle: {
    color: lightColors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  programCardMeta: {
    color: lightColors.textTertiary,
    fontSize: 11,
  },

  // Recommended section
  recommendedRow: {
    flexDirection: "row",
    gap: 12,
  },
  recommendedItem: {
    flex: 1,
  },
  recommendedImage: {
    width: "100%",
    height: 90,
    borderRadius: 14,
    marginBottom: 8,
  },
  recommendedName: {
    color: lightColors.text,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  recommendedMeta: {
    color: lightColors.textTertiary,
    fontSize: 11,
  },

  // Upgrade card (special)
  upgradeCard: {
    backgroundColor: lightColors.primary,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  upgradeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upgradeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  upgradeDescription: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  upgradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "300",
  },
});