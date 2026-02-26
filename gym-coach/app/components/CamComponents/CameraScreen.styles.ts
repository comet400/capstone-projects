import { StyleSheet } from "react-native";
import { Colors } from "@/constants/design";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingBottom: 100,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },

  exerciseBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "44",
  },

  exerciseBadgeText: {
    flex: 1,
    color: Colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
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

  // ─────────────────────────────────────────────
// Add these to your existing CameraScreen.styles.ts StyleSheet
// ─────────────────────────────────────────────

  // Recording timer pill shown over the camera feed
  recordingTimerOverlay: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
  },
  recordingTimerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  recordingTimerMax: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
});

