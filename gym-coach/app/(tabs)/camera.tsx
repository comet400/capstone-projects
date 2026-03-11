import {
  View,
  Text,
  Pressable,
  Alert,
  AppState,
  AppStateStatus,
  StatusBar,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "@/app/config/api";

import { styles } from "../components/CamComponents/CameraScreen.styles";
import ProcessingOverlay from "../components/CamComponents/ProcessingOverlay";
import PermissionView from "../components/CamComponents/PermissionView";
import ExerciseSelectorModal from "../components/CamComponents/ExerciseSelectorModal";

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
    trigger: null,
  });
}

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ data: any; uri: string } | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const uploadTaskRef = useRef<any>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);
  const activeJobRef = useRef<string | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discardNextRecordingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
    requestNotificationPermission();
  }, [permission]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      const comingToForeground =
        appStateRef.current.match(/inactive|background/) && nextState === "active";
      if (comingToForeground && pendingResult) {
        navigateToSummary(pendingResult.data, pendingResult.uri);
        setPendingResult(null);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [pendingResult]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      uploadTaskRef.current?.cancelAsync?.().catch(() => {});
      uploadTaskRef.current = null;
    };
  }, []);

  const navigateToSummary = useCallback(
    (data: any, uri: string) => {
      setIsProcessing(false);
      router.push({
        pathname: "/workout-summary",
        params: {
          report: encodeURIComponent(JSON.stringify(data)),
          videoUri: uri,
        },
      });
    },
    [router]
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const clearStepInterval = () => {
    if (stepIntervalRef.current) { clearInterval(stepIntervalRef.current); stepIntervalRef.current = null; }
  };
  const clearPollInterval = () => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
  };

  const startRecordingTimer = () => {
    setRecordingSeconds(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    setRecordingSeconds(0);
  };

  const cancelProcessingNow = async () => {
    isCancelledRef.current = true;
    try { await uploadTaskRef.current?.cancelAsync(); } catch {}
    uploadTaskRef.current = null;
    clearPollInterval();
    activeJobRef.current = null;
    clearStepInterval();
    setIsProcessing(false);
    setProcessingStep(0);
  };

  const handleCancelAnalysis = () => {
    Alert.alert(
      "Cancel Analysis",
      "Cancel upload/analysis? Nothing will be sent to the server.",
      [
        { text: "Keep Waiting", style: "cancel" },
        { text: "Cancel", style: "destructive", onPress: cancelProcessingNow },
      ]
    );
  };

  const handleRecordPress = async () => {
    if (!cameraRef.current) return;
    if (!selectedExercise && !isRecording) {
      setSettingsVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current.stopRecording();
      stopRecordingTimer();
      setIsRecording(false);
      return;
    }
    try {
      discardNextRecordingRef.current = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      startRecordingTimer();
      const result = await cameraRef.current.recordAsync({ maxDuration: MAX_RECORDING_SECONDS });
      stopRecordingTimer();
      setIsRecording(false);
      if (discardNextRecordingRef.current) {
        discardNextRecordingRef.current = false;
        if (result?.uri) FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => {});
        return;
      }
      if (result?.uri && selectedExercise) await uploadVideo(result.uri, selectedExercise);
    } catch (err: any) {
      stopRecordingTimer();
      setIsRecording(false);
      Alert.alert("Recording Error", err?.message ?? "Could not start recording.");
    }
  };

  const pollForResult = async (jobId: string, uri: string, exerciseLabel: string) => {
    return new Promise<void>((resolve) => {
      clearPollInterval();
      pollTimerRef.current = setInterval(async () => {
        try {
          if (isCancelledRef.current) { clearPollInterval(); resolve(); return; }
          const res = await fetch(`${API_BASE}/api/analyze/${jobId}`);
          if (!res.ok) return;
          const job = await res.json();
          if (job.status === "done") {
            clearPollInterval(); activeJobRef.current = null; clearStepInterval();
            const result = job.result ?? job;
            if (appStateRef.current !== "active") {
              setPendingResult({ data: result, uri });
              setIsProcessing(false);
              await sendLocalNotification("Workout Analysis Ready", `Your ${exerciseLabel} analysis is complete.`);
              resolve(); return;
            }
            navigateToSummary(result, uri); resolve();
          }
          if (job.status === "error") {
            clearPollInterval(); activeJobRef.current = null; clearStepInterval();
            setIsProcessing(false);
            Alert.alert("Analysis Failed", job.error ?? "Server error");
            resolve();
          }
        } catch {}
      }, 1000);
    });
  };

  const uploadVideo = async (uri: string, exerciseLabel: string) => {
    setIsProcessing(true);
    setProcessingStep(0);
    isCancelledRef.current = false;
    activeJobRef.current = null;
    clearStepInterval();
    stepIntervalRef.current = setInterval(() => {
      setProcessingStep((prev) => prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev);
    }, 1200);
    try {
      const url = `${API_BASE}/api/analyze`;
      uploadTaskRef.current = FileSystem.createUploadTask(
        url, uri,
        { httpMethod: "POST", uploadType: FileSystem.FileSystemUploadType.MULTIPART, fieldName: "video", mimeType: "video/mp4", parameters: { exercise: exerciseLabel } },
        () => {}
      );
      const uploadRes = await uploadTaskRef.current.uploadAsync();
      if (isCancelledRef.current) return;
      uploadTaskRef.current = null;
      if (!uploadRes || uploadRes.status < 200 || uploadRes.status >= 300)
        throw new Error(`Server error ${uploadRes?.status}: ${uploadRes?.body ?? ""}`);
      const queued = JSON.parse(uploadRes.body);
      const jobId = queued.job_id as string | undefined;
      if (!jobId) {
        const data = queued;
        if (appStateRef.current !== "active") {
          setPendingResult({ data, uri });
          setIsProcessing(false);
          await sendLocalNotification("Workout Analysis Ready", `Your ${exerciseLabel} analysis is complete.`);
          return;
        }
        navigateToSummary(data, uri); return;
      }
      activeJobRef.current = jobId;
      await pollForResult(jobId, uri, exerciseLabel);
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (isCancelledRef.current || msg.toLowerCase().includes("cancel")) return;
      clearStepInterval();
      setIsProcessing(false);
      Alert.alert("Analysis Failed", err?.message ?? "Could not reach the server.");
    }
  };

  if (isProcessing) {
    return (
      <ProcessingOverlay
        processingStep={processingStep}
        steps={PROCESSING_STEPS}
        onCancel={handleCancelAnalysis}
        backgroundTip="You can switch apps — we'll notify you when it's ready."
      />
    );
  }

  if (!permission?.granted) {
    return <PermissionView onRequest={requestPermission} />;
  }

  const progress = recordingSeconds / MAX_RECORDING_SECONDS;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        {/* Back button */}
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#171C1D" />
        </Pressable>

        {/* Exercise badge */}
        <Pressable
          style={[
            styles.exerciseBadge,
            !selectedExercise && styles.exerciseBadgeEmpty,
          ]}
          onPress={() => setSettingsVisible(true)}
        >
          
          <Text
            style={[
              styles.exerciseBadgeText,
              !selectedExercise && styles.exerciseBadgeTextEmpty,
            ]}
          >
            {selectedExercise ?? "Select exercise"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={selectedExercise ? "#9E9E9E" : "#FF3B30"}
          />
        </Pressable>

        {/* Settings button */}
        <Pressable style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={22} color="#171C1D" />
        </Pressable>
      </View>

      {/* ── Camera Viewfinder ── */}
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mode="video" />

        {/* Recording timer */}
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

        {/* Duration progress bar */}
        {isRecording && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
        )}
      </View>

      {/* ── Controls ── */}
      <View style={styles.controls}>
        <Text style={styles.instruction}>
          {isRecording ? "Recording… Tap to stop" : "Tap to start recording"}
        </Text>

        <View style={styles.buttonRow}>
          {/* Flip camera */}
          <Pressable
            onPress={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}
            style={[styles.smallButton, isRecording && styles.smallButtonDisabled]}
            disabled={isRecording}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={22}
              color={isRecording ? "#D0D0D0" : "#171C1D"}
            />
          </Pressable>

          {/* Record button */}
          <Pressable
            onPress={handleRecordPress}
            style={[styles.recordButton, isRecording && styles.recording]}
          >
            <View style={[styles.innerCircle, isRecording && styles.innerCircleActive]} />
          </Pressable>

          {/* Discard / spacer */}
          {isRecording ? (
            <Pressable
              style={styles.smallButton}
              onPress={() => {
                Alert.alert("Discard Recording", "Stop and discard this recording?", [
                  { text: "Keep Recording", style: "cancel" },
                  {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => {
                      discardNextRecordingRef.current = true;
                      cameraRef.current?.stopRecording();
                      stopRecordingTimer();
                      setIsRecording(false);
                    },
                  },
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </Pressable>
          ) : (
            <View style={{ width: 52 }} />
          )}
        </View>

        {/* No exercise hint */}
        {!selectedExercise && !isRecording && (
          <View style={styles.hintRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
            <Text style={styles.hintText}>Choose an exercise before recording</Text>
          </View>
        )}
      </View>

      {/* Exercise Selector Modal */}
      <ExerciseSelectorModal
        visible={settingsVisible}
        exercises={EXERCISES}
        selectedExercise={selectedExercise ?? ""}
        onSelect={(exercise: string) => {
          setSelectedExercise(exercise);
          setSettingsVisible(false);
        }}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}