import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PLANS = [
  {
    name: "Basic",
    price: "$9.99",
    period: "per month",
    features: [
      "Basic workout tracking",
      "Limited AI feedback",
      "5 workout programs",
      "Community access",
    ],
    popular: false,
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "per month",
    features: [
      "Unlimited workout tracking",
      "Advanced AI feedback",
      "All workout programs",
      "Personalized coaching",
      "Progress analytics",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "$29.99",
    period: "per month",
    features: [
      "Everything in Premium",
      "1-on-1 trainer sessions",
      "Custom workout plans",
      "Nutrition tracking",
      "Advanced metrics",
      "Early access features",
    ],
    popular: false,
  },
];

export default function PaidPlanTabScreen() {
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
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Premium Badge */}
      <View style={styles.premiumBadge}>
        <Ionicons name="diamond" size={24} color="#BFFF5A" />
        <Text style={styles.premiumText}>Unlock Premium Features</Text>
      </View>

      {/* Plans */}
      {PLANS.map((plan, index) => (
        <View
          key={plan.name}
          style={[
            styles.planCard,
            plan.popular && styles.planCardPopular,
          ]}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>/{plan.period}</Text>
            </View>
          </View>
          <View style={styles.featuresList}>
            {plan.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={plan.popular ? "#BFFF5A" : "#2AA8FF"}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={[
              styles.subscribeBtn,
              plan.popular && styles.subscribeBtnPopular,
            ]}
          >
            <Text
              style={[
                styles.subscribeText,
                plan.popular && styles.subscribeTextPopular,
              ]}
            >
              Subscribe Now
            </Text>
          </Pressable>
        </View>
      ))}

      {/* Current Plan Info */}
      <View style={styles.currentPlanCard}>
        <View style={styles.currentPlanHeader}>
          <Ionicons name="information-circle" size={20} color="#2AA8FF" />
          <Text style={styles.currentPlanTitle}>Current Plan</Text>
        </View>
        <Text style={styles.currentPlanText}>
          You are currently on the Free plan. Upgrade to unlock all features!
        </Text>
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

  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  premiumText: {
    color: "#BFFF5A",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  planCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardPopular: {
    borderColor: "#BFFF5A",
    backgroundColor: "#1E1E1E",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#BFFF5A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "#0D0F10",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  planHeader: {
    marginBottom: 20,
    marginTop: 8,
  },
  planName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  period: {
    color: "#9B9B9B",
    fontSize: 14,
    marginLeft: 4,
  },

  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },

  subscribeBtn: {
    backgroundColor: "#2AA8FF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeBtnPopular: {
    backgroundColor: "#BFFF5A",
  },
  subscribeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  subscribeTextPopular: {
    color: "#0D0F10",
  },

  currentPlanCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  currentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  currentPlanTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  currentPlanText: {
    color: "#9B9B9B",
    fontSize: 13,
    lineHeight: 20,
  },
});
