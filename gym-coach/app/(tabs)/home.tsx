
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Text style={styles.menuIcon}>≡</Text>
        </Pressable>

        <View>
          <Text style={styles.hello}>Hello!</Text>
          <Text style={styles.name}>MORGAN MAXWELL</Text>
        </View>

        <Pressable style={styles.crownBtn}>
          <Text style={styles.crown}>👑</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search workout, program, etc"
          placeholderTextColor="#9B9B9B"
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
      <Pressable style={styles.upgrade}>
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
    backgroundColor: "#121212",
    paddingHorizontal: 16,
  },

  header: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: { color: "#fff", fontSize: 20 },

  hello: { color: "#9B9B9B", fontSize: 12 },
  name: { color: "#fff", fontSize: 14, fontWeight: "700" },

  crownBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  crown: { fontSize: 18 },

  searchWrap: { marginTop: 16 },
  search: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    fontSize: 14,
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  viewAll: { color: "#9B9B9B", fontSize: 12 },

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
    backgroundColor: "#1E1E1E",
  },
  filterActive: { backgroundColor: "#2AA8FF" },
  filterText: { color: "#9B9B9B", fontSize: 12 },
  filterTextActive: { color: "#fff", fontWeight: "700" },

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
  featuredTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  featuredSub: { color: "#CFCFCF", fontSize: 11 },

  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  play: { color: "#fff", fontSize: 14 },

  upgrade: {
    marginTop: 18,
    backgroundColor: "#BFFF5A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  upgradeText: {
    color: "#0D0F10",
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
