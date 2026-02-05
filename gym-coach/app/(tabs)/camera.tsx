import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export default function CameraScreen() {
    const [isRecording, setIsRecording] = useState(false);

    const handleRecordPress = () => {
        if (isRecording) {
            
            setIsRecording(false);
        } else {
            
            setIsRecording(true);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Form Analysis</Text>

            <View style={styles.cameraArea}>
                <Text style={styles.cameraText}>Camera Here</Text>
            </View>

            <View style={styles.controls}>
                <Pressable
                    style={[
                        styles.recordButton,
                        isRecording && styles.recordingActive,
                    ]}
                    onPress={handleRecordPress}
                >
                    {isRecording ? (
                        <MaterialIcons name="stop" size={34} color="#fff" />
                    ) : (
                        <MaterialIcons
                            name="fiber-manual-record"
                            size={44}
                            color="#E53935"
                        />
                    )}
                </Pressable>
            </View>

            <Pressable style={styles.summaryBtn}>
                <Text style={styles.summaryText}>See Form Summary</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 60,
    },
    header: {
        fontSize: 26,
        fontWeight: "600",
        marginBottom: 20,
    },
    cameraArea: {
        height: 360,
        backgroundColor: "#000",
        borderRadius: 16,
        marginBottom: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    cameraText: {
        color: "#fff",
        fontSize: 16,
    },
    controls: {
        alignItems: "center",
        marginBottom: 24,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    },
    recordingActive: {
        backgroundColor: "#E53935",
    },
    summaryBtn: {
        backgroundColor: "#007AFF",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    summaryText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
