import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    FadeIn,
    FadeOut
} from "react-native-reanimated";
import { Colors, Spacing, Typography, IconSizes } from "@/constants/design";

const { width } = Dimensions.get("window");
const EXERCISES = ["Squat", "Deadlift", "Bench Press", "Row", "Overhead Press"];

const PROCESSING_STEPS = [
    "Uploading Video...",
    "Extracting Skeleton...",
    "Analyzing Biomechanics...",
    "Generating Feedback...",
];

export default function CameraScreen() {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [selectedMode, setSelectedMode] = useState("Squat");

    // Animation values
    const scanLineY = useSharedValue(0);

    useEffect(() => {
        // Start scanning animation
        scanLineY.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.linear }),
            -1,
            true
        );
    }, []);

    const scanLineStyle = useAnimatedStyle(() => ({
        top: `${scanLineY.value * 100}%`,
    }));

    const handleRecordPress = () => {
        if (isRecording) {
            setIsRecording(false);
            startProcessing();
        } else {
            setIsRecording(true);
        }
    };

    const startProcessing = () => {
        setIsProcessing(true);
        setProcessingStep(0);

        // Simulate processing steps
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < PROCESSING_STEPS.length) {
                setProcessingStep(step);
            } else {
                clearInterval(interval);
                finishProcessing();
            }
        }, 1500);
    };

    const finishProcessing = () => {
        setIsProcessing(false);
        router.push("/workout-summary");
    };

    if (isProcessing) {
        return (
            <View style={styles.processingContainer}>
                <Reanimated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={styles.processingContent}
                >
                    <View style={styles.spinnerContainer}>
                        <Ionicons name="scan-outline" size={64} color={Colors.secondary} />
                        <Reanimated.View style={[styles.scanSpinner]} />
                    </View>

                    <Text style={styles.processingTitle}>AI ANALYSIS IN PROGRESS</Text>

                    <View style={styles.stepsContainer}>
                        {PROCESSING_STEPS.map((step, index) => {
                            const isActive = index === processingStep;
                            const isDone = index < processingStep;

                            return (
                                <View key={step} style={styles.stepRow}>
                                    <View style={[
                                        styles.stepDot,
                                        isActive && styles.stepDotActive,
                                        isDone && styles.stepDotDone
                                    ]}>
                                        {isDone && <Ionicons name="checkmark" size={12} color={Colors.background} />}
                                    </View>
                                    <Text style={[
                                        styles.stepText,
                                        isActive && styles.stepTextActive,
                                        isDone && styles.stepTextDone
                                    ]}>{step}</Text>
                                </View>
                            );
                        })}
                    </View>
                </Reanimated.View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HUD Header */}
            <View style={styles.headerRow}>
                <View style={styles.recIndicator}>
                    <View style={[styles.recDot, isRecording && styles.recDotActive]} />
                    <Text style={styles.recText}>REC</Text>
                </View>
                <View style={styles.badgeContainer}>
                    <Text style={styles.aiBadge}>AI ACTIVE</Text>
                </View>
            </View>

            {/* Main Camera Viewfinder */}
            <View style={styles.cameraFrame}>
                <View style={styles.cameraView}>
                    {/* Simulated Camera Feed Background */}
                    <Text style={styles.cameraPlaceholder}>Camera Signal Input...</Text>

                    {/* Scanning Line */}
                    <Reanimated.View style={[styles.scanLine, scanLineStyle]} />

                    {/* Grid Overlay */}
                    <View style={styles.gridOverlay}>
                        <View style={styles.gridLineVertical} />
                        <View style={styles.gridLineVertical} />
                        <View style={styles.gridLineHorizontal} />
                        <View style={styles.gridLineHorizontal} />
                    </View>

                    {/* Corner Brackets */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                </View>

                {/* Mode Selector */}
                <View style={styles.modeSelector}>
                    {EXERCISES.map((mode) => (
                        <Pressable
                            key={mode}
                            onPress={() => setSelectedMode(mode)}
                            style={[
                                styles.modeChip,
                                selectedMode === mode && styles.modeChipActive
                            ]}
                        >
                            <Text style={[
                                styles.modeText,
                                selectedMode === mode && styles.modeTextActive
                            ]}>{mode}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <Pressable
                    style={[
                        styles.recordButton,
                        isRecording && styles.recordingActive,
                    ]}
                    onPress={handleRecordPress}
                >
                    <View style={[
                        styles.recordInner,
                        isRecording && styles.recordInnerActive
                    ]} />
                </Pressable>
                <Text style={styles.instructionText}>
                    {isRecording ? "Analyzing Form..." : "Tap to Start Analysis"}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 60,
    },

    // Header
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    recIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255, 59, 48, 0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    recDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.danger,
        opacity: 0.3,
    },
    recDotActive: { // Add blinking animation if possible, static for now
        opacity: 1,
    },
    recText: {
        color: Colors.danger,
        fontWeight: "700",
        fontSize: 12,
    },
    badgeContainer: {
        borderWidth: 1,
        borderColor: Colors.secondary,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    aiBadge: {
        color: Colors.secondary,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
    },

    // Camera Frame
    cameraFrame: {
        flex: 1,
        marginHorizontal: 16,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
    },
    cameraView: {
        flex: 1,
        backgroundColor: "#1a1a1a",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    cameraPlaceholder: {
        color: "#444",
        fontFamily: "monospace",
    },

    // HUD Elements
    scanLine: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
    },
    gridLineVertical: {
        width: 1,
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginHorizontal: "16%",
    },
    gridLineHorizontal: {
        position: "absolute",
        height: 1,
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginVertical: "25%",
    },
    corner: {
        position: "absolute",
        width: 20,
        height: 20,
        borderColor: Colors.secondary,
        borderWidth: 3,
    },
    cornerTL: { top: 20, left: 20, borderRightWidth: 0, borderBottomWidth: 0 },
    cornerTR: { top: 20, right: 20, borderLeftWidth: 0, borderBottomWidth: 0 },
    cornerBL: { bottom: 20, left: 20, borderRightWidth: 0, borderTopWidth: 0 },
    cornerBR: { bottom: 20, right: 20, borderLeftWidth: 0, borderTopWidth: 0 },

    // Mode Selector
    modeSelector: {
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
    },
    modeChip: {
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    modeChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    modeText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: "600",
    },
    modeTextActive: {
        color: "#fff",
    },

    // Controls
    controls: {
        height: 160,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: "#fff",
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    recordingActive: {
        borderColor: Colors.danger,
    },
    recordInner: {
        width: "100%",
        height: "100%",
        borderRadius: 40,
        backgroundColor: Colors.danger,
    },
    recordInnerActive: {
        width: "50%",
        height: "50%",
        borderRadius: 8,
    },
    instructionText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },

    // Processing Screen
    processingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    processingContent: {
        width: "100%",
        alignItems: "center",
    },
    spinnerContainer: {
        marginBottom: 40,
        position: "relative",
    },
    scanSpinner: {
        // Simple placeholder for more complex animation
    },
    processingTitle: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 40,
        textAlign: "center",
    },
    stepsContainer: {
        width: "100%",
        gap: 20,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.surfaceHighlight,
        alignItems: "center",
        justifyContent: "center",
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
    },
    stepDotDone: {
        backgroundColor: Colors.secondary,
    },
    stepText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    stepTextActive: {
        color: Colors.primary,
        fontWeight: "700",
    },
    stepTextDone: {
        color: Colors.text,
    },
});
