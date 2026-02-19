import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Colors } from "@/constants/design";

// Update this to your backend
const API_BASE = "http://10.0.0.7:5825";

const PROCESSING_STEPS = [
  "Uploading Video",
  "Analyzing Movement",
  "Generating Feedback",
];

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // 🎥 Handle recording
  const handleRecordPress = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      const result = await cameraRef.current.recordAsync({
        maxDuration: 120,
      });

      setIsRecording(false);

      if (result?.uri) {
        await uploadVideo(result.uri);
      }
    } catch (err: any) {
      setIsRecording(false);
      Alert.alert(
        "Recording Error",
        err?.message ?? "Could not start recording."
      );
    }
  };

  // ☁️ Upload + process
  const uploadVideo = async (uri: string) => {
    setIsProcessing(true);
    setProcessingStep(0);

    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev < PROCESSING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("video", {
        uri,
        name: "workout.mp4",
        type: "video/mp4",
      } as any);

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      const data = await response.json();

      setTimeout(() => {
        setIsProcessing(false);
        router.push({
          pathname: "/workout-summary",
          params: {
            report: encodeURIComponent(JSON.stringify(data)),
          },
        });
      }, 600);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      Alert.alert(
        "Analysis Failed",
        err?.message ?? "Could not reach the server."
      );
    }
  };

  // 📊 Processing Screen
  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <Ionicons
          name="fitness-outline"
          size={48}
          color={Colors.primary}
          style={{ marginBottom: 30 }}
        />

        <Text style={styles.processingTitle}>
          Analyzing Your Workout
        </Text>

        {PROCESSING_STEPS.map((step, index) => {
          const isActive = index === processingStep;
          const isDone = index < processingStep;

          return (
            <View key={step} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isDone && styles.stepDotDone,
                ]}
              >
                {isDone && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#000"
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepText,
                  isActive && styles.stepTextActive,
                  isDone && styles.stepTextDone,
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  // 🔒 Permission Screen
  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons
          name="camera-outline"
          size={64}
          color={Colors.textSecondary}
        />
        <Text style={styles.permissionText}>
          Camera permission is required.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  // 📷 Main Camera UI
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={26}
            color={Colors.text}
          />
        </Pressable>
      </View>

      {/* Camera */}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.instruction}>
          {isRecording
            ? "Recording... Tap to stop"
            : "Tap to start recording"}
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() =>
              setFacing((prev) =>
                prev === "back" ? "front" : "back"
              )
            }
            style={styles.smallButton}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={24}
              color={Colors.text}
            />
          </Pressable>

          <Pressable
            onPress={handleRecordPress}
            style={[
              styles.recordButton,
              isRecording && styles.recording,
            ]}
          >
            <View
              style={[
                styles.innerCircle,
                isRecording && styles.innerCircleActive,
              ]}
            />
          </Pressable>

          <View style={{ width: 50 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingBottom: 100,
  },

  topBar: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  cameraWrapper: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  controls: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },

  instruction: {
    color: Colors.textSecondary,
    marginBottom: 20,
    fontSize: 14,
  },

  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },

  smallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  recording: {
    borderColor: Colors.danger,
  },

  innerCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    backgroundColor: Colors.danger,
  },

  innerCircleActive: {
    width: "50%",
    height: "50%",
    borderRadius: 8,
  },

  processingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 20,
  },

  processingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 30,
    textAlign: "center",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
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
    fontSize: 15,
  },

  stepTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },

  stepTextDone: {
    color: Colors.text,
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 40,
  },

  permissionText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },

  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  permissionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
