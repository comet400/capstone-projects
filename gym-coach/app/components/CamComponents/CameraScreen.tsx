import {
  View,
  Text,
  Pressable,
  Alert,
  AppState,
  AppStateStatus,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/design";
import { API_BASE_URL } from "@/app/config/api";

import { styles } from "./CameraScreen.styles";
import ProcessingOverlay from "./ProcessingOverlay";
import PermissionView from "./PermissionView";
import ExerciseSelectorModal from "./ExerciseSelectorModal";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const API_BASE = API_BASE_URL;

const EXERCISES = [
  "Squat",
  "Pushup",
  "Pullup",
  "Bench Press",
  "Bicep Curl",
  "Deadlift",
];

const PROCESSING_STEPS = [
  "Uploading Video",
  "Analyzing Movement",
  "Generating Feedback",
];

const MAX_RECORDING_SECONDS = 120;

// ─────────────────────────────────────────────
// Notification Setup
// ─────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // immediate
  });
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [selectedExercise, setSelectedExercise] = useState("Squat");
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Pending result while app is backgrounded
  const [pendingResult, setPendingResult] = useState<{
    data: any;
    uri: string;
  } | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ─────────────────────────────────────────────
  // Permission Auto Request + Notification Permission
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
    requestNotificationPermission();
  }, [permission]);

  // ─────────────────────────────────────────────
  // App State — navigate when returning from background with pending result
  // ─────────────────────────────────────────────

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const comingToForeground =
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active";

        if (comingToForeground && pendingResult) {
          navigateToSummary(pendingResult.data, pendingResult.uri);
          setPendingResult(null);
        }

        appStateRef.current = nextState;
      }
    );
    return () => subscription.remove();
  }, [pendingResult]);

  // ─────────────────────────────────────────────
  // Cleanup on unmount
  // ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current!);
      clearInterval(stepIntervalRef.current!);
    };
  }, []);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const navigateToSummary = useCallback((data: any, uri: string) => {
    setIsProcessing(false);
    router.push({
      pathname: "/workout-summary",
      params: {
        report: encodeURIComponent(JSON.stringify(data)),
        videoUri: uri,
      },
    });
  }, [router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─────────────────────────────────────────────
  // Recording Logic
  // ─────────────────────────────────────────────

  const startRecordingTimer = () => {
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
  };

  const handleRecordPress = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current.stopRecording();
      stopRecordingTimer();
      setIsRecording(false);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      startRecordingTimer();

      const result = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORDING_SECONDS,
      });

      stopRecordingTimer();
      setIsRecording(false);

      if (result?.uri) {
        await uploadVideo(result.uri);
      }
    } catch (err: any) {
      stopRecordingTimer();
      setIsRecording(false);
      Alert.alert(
        "Recording Error",
        err?.message ?? "Could not start recording."
      );
    }
  };

  // ─────────────────────────────────────────────
  // Cancel Analysis
  // ─────────────────────────────────────────────

  const handleCancelAnalysis = () => {
    Alert.alert(
      "Cancel Analysis",
      "Are you sure you want to cancel? Your recording will be discarded.",
      [
        { text: "Keep Waiting", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => {
            abortControllerRef.current?.abort();
            clearInterval(stepIntervalRef.current!);
            setIsProcessing(false);
            setProcessingStep(0);
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────
  // Upload + Analysis
  // ─────────────────────────────────────────────

  const uploadVideo = async (uri: string) => {
    setIsProcessing(true);
    setProcessingStep(0);

    abortControllerRef.current = new AbortController();

    stepIntervalRef.current = setInterval(() => {
      setProcessingStep((prev) =>
        prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("exercise", selectedExercise);
      formData.append("video", {
        uri,
        name: "workout.mp4",
        type: "video/mp4",
      } as any);

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      clearInterval(stepIntervalRef.current!);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      const data = await response.json();

      // If app is in background — store result and notify
      if (appStateRef.current !== "active") {
        setPendingResult({ data, uri });
        setIsProcessing(false);
        await sendLocalNotification(
          "Workout Analysis Ready 💪",
          `Your ${selectedExercise} analysis is complete. Tap to view your feedback.`
        );
        return;
      }

      // App is in foreground — navigate directly
      setTimeout(() => navigateToSummary(data, uri), 600);
    } catch (err: any) {
      clearInterval(stepIntervalRef.current!);

      // Silently ignore user-initiated cancellation
      if (err?.name === "AbortError") return;

      setIsProcessing(false);
      Alert.alert(
        "Analysis Failed",
        err?.message ?? "Could not reach the server."
      );
    }
  };

  // ─────────────────────────────────────────────
  // Conditional Screens
  // ─────────────────────────────────────────────

  if (isProcessing) {
    return (
      <ProcessingOverlay
        processingStep={processingStep}
        steps={PROCESSING_STEPS}
        onCancel={handleCancelAnalysis}
        // Pass a tip so the user knows they can background
        backgroundTip="You can switch apps — we'll notify you when it's ready."
      />
    );
  }

  if (!permission?.granted) {
    return <PermissionView onRequest={requestPermission} />;
  }

  // ─────────────────────────────────────────────
  // Pending Result Banner (if user returns before notification tap)
  // ─────────────────────────────────────────────

  // (handled by AppState listener above — navigates automatically)

  // ─────────────────────────────────────────────
  // Main Camera UI
  // ─────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </Pressable>

        <Pressable
          style={styles.exerciseBadge}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="barbell-outline" size={14} color={Colors.primary} />
          <Text style={styles.exerciseBadgeText}>{selectedExercise}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => setSettingsVisible(true)}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* Camera */}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          mode="video"
        />

        {/* Recording Timer Overlay */}
        {isRecording && (
          <View style={styles.recordingTimerOverlay}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimerText}>
              {formatTime(recordingSeconds)}
            </Text>
            <Text style={styles.recordingTimerMax}>
              / {formatTime(MAX_RECORDING_SECONDS)}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.instruction}>
          {isRecording ? "Recording… Tap to stop" : "Tap to start recording"}
        </Text>

        <View style={styles.buttonRow}>
          {/* Flip Camera */}
          <Pressable
            onPress={() =>
              setFacing((prev) => (prev === "back" ? "front" : "back"))
            }
            style={styles.smallButton}
            disabled={isRecording}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={24}
              color={isRecording ? Colors.textSecondary : Colors.text}
            />
          </Pressable>

          {/* Record Button */}
          <Pressable
            onPress={handleRecordPress}
            style={[styles.recordButton, isRecording && styles.recording]}
          >
            <View
              style={[
                styles.innerCircle,
                isRecording && styles.innerCircleActive,
              ]}
            />
          </Pressable>

          {/* Cancel Recording */}
          {isRecording ? (
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Discard Recording",
                  "Stop and discard this recording?",
                  [
                    { text: "Keep Recording", style: "cancel" },
                    {
                      text: "Discard",
                      style: "destructive",
                      onPress: () => {
                        cameraRef.current?.stopRecording();
                        stopRecordingTimer();
                        setIsRecording(false);
                      },
                    },
                  ]
                );
              }}
              style={styles.smallButton}
            >
              <Ionicons name="trash-outline" size={24} color="#FF4444" />
            </Pressable>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>
      </View>

      {/* Exercise Selector */}
      <ExerciseSelectorModal
        visible={settingsVisible}
        exercises={EXERCISES}
        selectedExercise={selectedExercise}
        onSelect={(exercise: string) => {
          setSelectedExercise(exercise);
          setSettingsVisible(false);
        }}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}