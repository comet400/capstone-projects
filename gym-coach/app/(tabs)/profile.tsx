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

const PROFILE_IMAGE = require("@/assets/images/home/featured.jpg");

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header: menu | mini profile | premium */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={66} color="#fff" />
        </Pressable>

        <View style={styles.miniProfile}>
          <Image source={PROFILE_IMAGE} style={styles.miniAvatar} />
          <View>
            <Text style={styles.thatYou}>Thats you!</Text>
            <Text style={styles.name}>MORGAN MAXWELL!</Text>
          </View>
        </View>

        <Pressable style={styles.crownBtn}>
          <Text style={styles.crownIcon}>👑</Text>
        </Pressable>
      </View>

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
          <Ionicons name="barbell-outline" size={84} color="#0D0F10" />
          <Text style={styles.gridBtnText}>Past Workouts</Text>
        </Pressable>
        <Pressable style={[styles.gridBtn, styles.gridBtnBlue]}>
          <Ionicons name="settings-outline" size={84} color="#0D0F10" />
          <Text style={styles.gridBtnText}>Settings</Text>
        </Pressable>
        <Pressable style={[styles.gridBtn, styles.gridBtnLime]}>
          <Ionicons name="bar-chart-outline" size={84} color="#0D0F10" />
          <Text style={styles.gridBtnText}>Progress</Text>
        </Pressable>
        <Pressable
          style={[styles.gridBtn, styles.gridBtnLime]}
          onPress={() => router.push("/highlights")}
        >
          <Ionicons name="sparkles-outline" size={84} color="#0D0F10" />
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
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },

  miniProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  thatYou: {
    color: "#9B9B9B",
    fontSize: 12,
  },
  name: {
    color: "#2AA8FF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  crownBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#5BC0EB",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: { fontSize: 54 },

  avatarWrap: {
    alignItems: "center",
    marginTop: 24,
  },
  mainAvatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    gap: 12,
  },
  gridBtn: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  gridBtnBlue: {
    backgroundColor: "#2AA8FF",
  },
  gridBtnLime: {
    backgroundColor: "#BFFF5A",
  },
  gridBtnText: {
    color: "#0D0F10",
    fontSize: 13,
    fontWeight: "700",
  },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  viewAll: {
    color: "#9B9B9B",
    fontSize: 12,
  },
  recoCard: {
    width: 160,
    height: 110,
    borderRadius: 16,
    marginRight: 12,
  },
});
