import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Spacing, Typography, IconSizes } from "@/constants/design";

const PROFILE_IMAGE = require("@/assets/images/home/featured.jpg");

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header: menu | mini profile | premium */}
      <ScreenHeader subtitle="Thats you!" title="MORGAN MAXWELL!" />

      {/* Large profile picture */}
      <View style={styles.avatarWrap}>
        <Image source={PROFILE_IMAGE} style={styles.mainAvatar} />
      </View>

      {/* Action buttons grid 2x2 */}
      <View style={styles.grid}>
        <Pressable
          style={[styles.gridBtn, styles.gridBtnBlue]}
          onPress={() => router.push("/past-workouts")}
        >
          <Ionicons name="barbell-outline" size={IconSizes.xl * 2} color={Colors.iconDark} />
          <Text style={styles.gridBtnText}>Past Workouts</Text>
        </Pressable>
        <Pressable style={[styles.gridBtn, styles.gridBtnBlue]}>
          <Ionicons name="settings-outline" size={IconSizes.xl * 2} color={Colors.iconDark} />
          <Text style={styles.gridBtnText}>Settings</Text>
        </Pressable>
        <Pressable style={[styles.gridBtn, styles.gridBtnLime]}>
          <Ionicons name="bar-chart-outline" size={IconSizes.xl * 2} color={Colors.iconDark} />
          <Text style={styles.gridBtnText}>Progress</Text>
        </Pressable>
        <Pressable
          style={[styles.gridBtn, styles.gridBtnLime]}
          onPress={() => router.push("/highlights")}
        >
          <Ionicons name="sparkles-outline" size={IconSizes.xl * 2} color={Colors.iconDark} />
          <Text style={styles.gridBtnText}>Highlights</Text>
        </Pressable>
      </View>

      {/* Recommended for you */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended for you</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Image
          source={require("@/assets/images/home/reco1.jpg")}
          style={styles.recoCard}
        />
        <Image
          source={require("@/assets/images/home/reco2.jpg")}
          style={styles.recoCard}
        />
      </ScrollView>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },

  avatarWrap: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  mainAvatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  gridBtn: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  gridBtnBlue: {
    backgroundColor: Colors.primary,
  },
  gridBtnLime: {
    backgroundColor: Colors.secondary,
  },
  gridBtnText: {
    color: Colors.iconDark,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  viewAll: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  recoCard: {
    width: 160,
    height: 110,
    borderRadius: 16,
    marginRight: 12,
  },
});
