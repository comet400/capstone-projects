import { StyleSheet } from "react-native";

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 6;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 56,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },

  // Back / settings icon buttons
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  exerciseBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF5FF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#C8E8FF",
  },

  exerciseBadgeEmpty: {
    backgroundColor: "#FFF4F4",
    borderColor: "#FFBABA",
  },

  exerciseBadgeText: {
    flex: 1,
    color: "#171C1D",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  exerciseBadgeTextEmpty: {
    color: "#FF3B30",
  },

  // kept for backward compat — use iconBtn instead
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },

  // ── Camera viewfinder ──
  cameraWrapper: {
    flex: 0.9,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  // Corner frame markers — add 4 Views with corner + cornerTL/TR/BL/BR
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#2AA8FF",
    zIndex: 10,
  },
  cornerTL: {
    top: 14,
    left: 14,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 14,
    right: 14,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: CORNER_RADIUS,
  },

  // ── Controls area ──
  controls: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 20,
  },

  instruction: {
    color: "#9E9E9E",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
  },

  // Flip / trash side buttons
  smallButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },

  smallButtonDisabled: {
    opacity: 0.4,
  },

  // ── Record button ──
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#171C1D",
    alignItems: "center",
    justifyContent: "center",
  },

  recording: {
    borderColor: "#FF3B30",
  },

  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#171C1D",
  },

  innerCircleActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
  },

  // ── Recording timer overlay ──
  recordingTimerOverlay: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(23,28,29,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 10,
  },

  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },

  recordingTimerText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },

  recordingTimerMax: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // ── Progress bar (bottom of viewfinder) ──
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    zIndex: 10,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FF3B30",
    borderRadius: 2,
  },

  // ── No-exercise hint banner ──
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF4F4",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFBABA",
  },

  hintText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "600",
  },

  gifOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#F4F4F4",
  },

  gifOptionText: {
    color: "#9E9E9E",
    fontSize: 12,
    fontWeight: "700",
  },

  gifOptionTextActive: {
    color: "#B7791F",
  },
});
