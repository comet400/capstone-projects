import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 60,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "600",
    },
    edit: {
        color: "#007AFF",
        fontSize: 16,
    },
    workoutCard: {
        backgroundColor: "#F5C842",
        borderRadius: 16,
        padding: 20,
        height: 220,
        justifyContent: "flex-end",
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: "600",
        color: "#000",
    },
    cardSub: {
        fontSize: 14,
        color: "#000",
        marginTop: 4,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    actionBtn: {
        backgroundColor: "#F2F2F2",
        paddingVertical: 14,
        borderRadius: 12,
        width: "48%",
        alignItems: "center",
    },
    actionText: {
        fontSize: 16,
        fontWeight: "500",
    },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderColor: "#eee",
    },
});

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Workout</Text>
                <Text style={styles.edit}>Edit</Text>
            </View>

            <View style={styles.workoutCard}>
                <Text style={styles.cardTitle}>Full Body</Text>
                <Text style={styles.cardSub}>35 min</Text>
            </View>

            <View style={styles.actions}>
                <Pressable style={styles.actionBtn}>
                    <Text style={styles.actionText}>New Workout</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                    <Text style={styles.actionText}>New Folder</Text>
                </Pressable>
            </View>

            <View style={styles.bottomNav}>
                <Ionicons name="home-outline" size={24} />
                <Ionicons name="barbell-outline" size={24} />
                <Ionicons name="camera-outline" size={28} />
                <Ionicons name="stats-chart-outline" size={24} />
                <Ionicons name="person-outline" size={24} />
            </View>
        </View>
    );
}
