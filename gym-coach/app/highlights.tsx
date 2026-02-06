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

const WORKOUT_IMAGE = require("@/assets/images/home/featured.jpg");

const HIGHLIGHTS = [
  {
    id: "1",
    type: "achievement",
    title: "7 Day Streak!",
    description: "You've completed workouts for 7 consecutive days",
    date: "Today",
    icon: "flame",
    color: "#F87171",
    badge: "🔥",
  },
  {
    id: "2",
    type: "milestone",
    title: "100 Workouts Completed",
    description: "Congratulations on reaching this amazing milestone!",
    date: "2 days ago",
    icon: "trophy",
    color: "#FACC15",
    badge: "🏆",
  },
  {
    id: "3",
    type: "personal-best",
    title: "New Personal Best",
    description: "Best overall score: 92/100 in Core Focus Session",
    date: "3 days ago",
    icon: "star",
    color: "#4ADE80",
    badge: "⭐",
  },
  {
    id: "4",
    type: "achievement",
    title: "Early Bird",
    description: "Completed 5 morning workouts this week",
    date: "5 days ago",
    icon: "sunny",
    color: "#2AA8FF",
    badge: "🌅",
  },
  {
    id: "5",
    type: "milestone",
    title: "50 Hours Trained",
    description: "You've logged over 50 hours of training time",
    date: "1 week ago",
    icon: "time",
    color: "#BFFF5A",
    badge: "⏱️",
  },
];

const STATS = [
  { label: "Current Streak", value: "7 days", icon: "flame", color: "#F87171" },
  { label: "Total Workouts", value: "102", icon: "barbell", color: "#2AA8FF" },
  { label: "Best Score", value: "92/100", icon: "star", color: "#4ADE80" },
  { label: "Hours Trained", value: "52.5h", icon: "time", color: "#BFFF5A" },
];

export default function HighlightsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Highlights</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {STATS.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View
              style={[styles.statIconWrap, { backgroundColor: stat.color + "20" }]}
            >
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Highlights List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Highlights</Text>
      </View>

      {HIGHLIGHTS.map((highlight) => (
        <Pressable
          key={highlight.id}
          style={styles.highlightCard}
          onPress={() => {
            // Navigate to detail if needed
          }}
        >
          <View style={styles.highlightHeader}>
            <View style={styles.highlightLeft}>
              <View
                style={[
                  styles.highlightIconWrap,
                  { backgroundColor: highlight.color + "20" },
                ]}
              >
                <Ionicons
                  name={highlight.icon as any}
                  size={28}
                  color={highlight.color}
                />
              </View>
              <View style={styles.highlightTextWrap}>
                <Text style={styles.highlightTitle}>{highlight.title}</Text>
                <Text style={styles.highlightDescription}>
                  {highlight.description}
                </Text>
              </View>
            </View>
            <Text style={styles.highlightBadge}>{highlight.badge}</Text>
          </View>
          <View style={styles.highlightFooter}>
            <Text style={styles.highlightDate}>{highlight.date}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{highlight.type}</Text>
            </View>
          </View>
        </Pressable>
      ))}

      {/* Featured Achievement */}
      <View style={styles.featuredCard}>
        <View style={styles.featuredImageWrap}>
          <Image source={WORKOUT_IMAGE} style={styles.featuredImage} />
          <View style={styles.featuredOverlay} />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredBadge}>🏆</Text>
            <Text style={styles.featuredTitle}>Champion Status</Text>
            <Text style={styles.featuredSubtitle}>
              Keep up the amazing work! You're doing great!
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9B9B9B",
    fontSize: 12,
    textAlign: "center",
  },

  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  highlightCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  highlightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  highlightLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  highlightIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightTextWrap: {
    flex: 1,
  },
  highlightTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  highlightDescription: {
    color: "#9B9B9B",
    fontSize: 13,
    lineHeight: 18,
  },
  highlightBadge: {
    fontSize: 32,
  },
  highlightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2A2A2A",
  },
  highlightDate: {
    color: "#9B9B9B",
    fontSize: 12,
  },
  typeBadge: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: "#9B9B9B",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  featuredCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 8,
  },
  featuredImageWrap: {
    position: "relative",
    height: 200,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: "center",
  },
  featuredBadge: {
    fontSize: 48,
    marginBottom: 8,
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: "#CFCFCF",
    fontSize: 13,
    textAlign: "center",
  },
});
