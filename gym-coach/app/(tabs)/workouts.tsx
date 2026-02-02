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
// Swap to require("@/assets/images/workout/rowing-form.jpg") when you add that image
const WORKOUT_VIEW_IMAGE = require("@/assets/images/home/featured.jpg");

export default function WorkoutsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Header: menu | mini profile | premium */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>

        <View style={styles.miniProfile}>
          <Image source={PROFILE_IMAGE} style={styles.miniAvatar} />
          <View>
            <Text style={styles.subtitle}>Always good to check your form</Text>
            <Text style={styles.name}>MORGAN MAXWELL</Text>
          </View>
        </View>

        <Pressable style={styles.crownBtn}>
          <Text style={styles.crownIcon}>👑</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout visualization (video/image + form overlay) */}
        <View style={styles.workoutViewWrap}>
          <Image
            source={WORKOUT_VIEW_IMAGE}
            style={styles.workoutViewImage}
            resizeMode="cover"
          />
          {/* Form analysis overlay placeholder – skeleton/pose lines go here */}
          <View style={styles.formOverlay} pointerEvents="none" />
        </View>

        <Pressable
          style={styles.summaryBtn}
          onPress={() => router.push("/workout-summary")}
        >
          <Text style={styles.summaryBtnText}>SEE WORKOUT SUMMARY</Text>
        </Pressable>

        {/* Workout navigation: Previous | Past Workouts | Next */}
        <View style={styles.navSection}>
          <View style={styles.navSide}>
            <Text style={styles.navLabel}>PREVIOUS</Text>
            <Pressable style={styles.navCircleBtn}>
              <Ionicons name="chevron-back" size={36} color="#0D0F10" />
            </Pressable>
          </View>

          <Pressable style={styles.pastWorkoutsBtn}>
            <Ionicons name="barbell-outline" size={48} color="#0D0F10" />
            <Text style={styles.pastWorkoutsText}>Past Workouts</Text>
          </Pressable>

          <View style={styles.navSide}>
            <Text style={styles.navLabel}>NEXT</Text>
            <Pressable style={styles.navCircleBtn}>
              <Ionicons name="chevron-forward" size={36} color="#0D0F10" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomPad} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  header: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  subtitle: {
    color: "#9B9B9B",
    fontSize: 11,
  },
  name: {
    color: "#2AA8FF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  crownBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: { fontSize: 22 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  workoutViewWrap: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1E1E1E",
    aspectRatio: 4 / 3,
  },
  workoutViewImage: {
    width: "100%",
    height: "100%",
  },
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  summaryBtn: {
    marginTop: 16,
    backgroundColor: "#BFFF5A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBtnText: {
    color: "#0D0F10",
    fontSize: 14,
    fontWeight: "800",
  },

  navSection: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navSide: {
    alignItems: "center",
    gap: 8,
  },
  navLabel: {
    color: "#9B9B9B",
    fontSize: 11,
    fontWeight: "700",
  },
  navCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#BFFF5A",
    alignItems: "center",
    justifyContent: "center",
  },
  pastWorkoutsBtn: {
    width: 120,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#2AA8FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pastWorkoutsText: {
    color: "#0D0F10",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  bottomPad: { height: 100 },
});
