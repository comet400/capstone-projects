import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors, Spacing, Typography } from "@/constants/design";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ScreenHeader subtitle="Hello!" title="MORGAN MAXWELL" showAvatar={false} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search workout, program, etc"
          placeholderTextColor={Colors.textSecondary}
          style={styles.search}
        />
      </View>

      {/* Workout Programs */}
      <SectionHeader title="Workout Programs" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ProgramCard image={require("@/assets/images/home/program1.jpg")} />
        <ProgramCard image={require("@/assets/images/home/program2.jpg")} />
        <ProgramCard image={require("@/assets/images/home/program3.jpg")} />
      </ScrollView>

      {/* Level Filters */}
      <View style={styles.filters}>
        <Filter active label="All Levels" />
        <Filter label="Beginner" />
        <Filter label="Intermediate" />
      </View>

      {/* Featured Workout */}
      <View style={styles.featured}>
        <Image
          source={require("@/assets/images/home/featured.jpg")}
          style={styles.featuredImg}
        />
        <View style={styles.featuredOverlay}>
          <View>
            <Text style={styles.featuredTitle}>30 Minute Hiit Cardio</Text>
            <Text style={styles.featuredSub}>3 Exercises / 4 Sets</Text>
          </View>
          <Pressable style={styles.playBtn}>
            <Text style={styles.play}>▶</Text>
          </Pressable>
        </View>
      </View>

      {/* Upgrade */}
      <Pressable
        style={styles.upgrade}
        onPress={() => router.push("/paid-plan-tab")}
      >
        <Text style={styles.upgradeText}>UPGRADE YOUR PLAN</Text>
      </Pressable>

      {/* Recommended */}
      <SectionHeader title="Recommended for you" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <RecommendCard image={require("@/assets/images/home/reco1.jpg")} />
        <RecommendCard image={require("@/assets/images/home/reco2.jpg")} />
      </ScrollView>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

/* ---------------- Components ---------------- */

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.viewAll}>View All</Text>
    </View>
  );
}

function ProgramCard({ image }: any) {
  return (
    <Image source={image} style={styles.programCard} />
  );
}

function RecommendCard({ image }: any) {
  return <Image source={image} style={styles.recoCard} />;
}

function Filter({ label, active }: { label: string; active?: boolean }) {
  return (
    <Pressable
      style={[
        styles.filter,
        active && styles.filterActive,
      ]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },

  searchWrap: { marginTop: Spacing.lg },
  search: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    color: Colors.text,
    fontSize: Typography.sizes.md,
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.lg,
    fontWeight: "700"
  },
  viewAll: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm
  },

  programCard: {
    width: 140,
    height: 110,
    borderRadius: 16,
    marginRight: 12,
  },

  filters: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  filter: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  filterTextActive: { color: Colors.text, fontWeight: "700" },

  featured: {
    marginTop: 18,
    borderRadius: 18,
    overflow: "hidden",
  },
  featuredImg: { width: "100%", height: 180 },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  featuredTitle: { color: Colors.text, fontSize: Typography.sizes.md, fontWeight: "700" },
  featuredSub: { color: "#CFCFCF", fontSize: Typography.sizes.xs },

  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  play: { color: Colors.text, fontSize: 14 },

  upgrade: {
    marginTop: 18,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  upgradeText: {
    color: Colors.iconDark,
    fontWeight: "800",
    fontSize: 13,
  },

  recoCard: {
    width: 160,
    height: 110,
    borderRadius: 16,
    marginRight: 12,
  },
});
