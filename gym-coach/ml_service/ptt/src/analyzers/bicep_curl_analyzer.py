"""
Bicep curl form analysis
"""
import math
import numpy as np
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import BICEP_CURL_PARAMS


class BicepCurlAnalyzer(FormChecker):
    """Analyzes bicep curl form"""

    def __init__(self):
        super().__init__()
        self.active_side = None
        self._baseline_elbow_offsets = {}

    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        metrics = FormMetrics()

        left_ok = self.check_visibility(
            keypoints, [Keypoint.L_SHOULDER, Keypoint.L_ELBOW, Keypoint.L_WRIST]
        )
        right_ok = self.check_visibility(
            keypoints, [Keypoint.R_SHOULDER, Keypoint.R_ELBOW, Keypoint.R_WRIST]
        )

        if not left_ok and not right_ok:
            metrics.issues.append("Curling arm not visible")
            return metrics

        arm_data = {}
        if left_ok:
            arm_data["left"] = {
                "angle": self.calculate_joint_angle(
                    keypoints, Keypoint.L_ELBOW, Keypoint.L_SHOULDER, Keypoint.L_WRIST
                ),
                "shoulder": Keypoint.L_SHOULDER,
                "elbow": Keypoint.L_ELBOW,
            }
        if right_ok:
            arm_data["right"] = {
                "angle": self.calculate_joint_angle(
                    keypoints, Keypoint.R_ELBOW, Keypoint.R_SHOULDER, Keypoint.R_WRIST
                ),
                "shoulder": Keypoint.R_SHOULDER,
                "elbow": Keypoint.R_ELBOW,
            }

        arm_data = {
            side: data
            for side, data in arm_data.items()
            if not math.isnan(float(data["angle"]))
        }

        if not arm_data:
            metrics.issues.append("Curling arm angle could not be measured")
            return metrics

        # Bicep curls are often recorded one arm at a time. Pick the active arm
        # instead of averaging against a resting arm, which would hide the curl.
        if self.active_side not in arm_data:
            self.active_side = min(arm_data, key=lambda side: arm_data[side]["angle"])
        elif len(arm_data) > 1:
            current_angle = arm_data[self.active_side]["angle"]
            other_side = "right" if self.active_side == "left" else "left"
            other_angle = arm_data[other_side]["angle"]
            if other_angle + 20 < current_angle:
                self.active_side = other_side

        active = arm_data[self.active_side]
        elbow_angle = float(active["angle"])

        metrics.angles["avg_elbow"] = elbow_angle
        metrics.angles["top_elbow_angle"] = elbow_angle
        metrics.angles["bottom_elbow_angle"] = elbow_angle
        metrics.positions["active_arm"] = 0.0 if self.active_side == "left" else 1.0

        if elbow_angle > BICEP_CURL_PARAMS["elbow_angle_up"]:
            metrics.issues.append("Curl higher - full contraction needed")

        shoulder_idx = active["shoulder"]
        elbow_idx = active["elbow"]

        shoulder_width = None
        if self.check_visibility(keypoints, [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER]):
            shoulder_width = abs(
                keypoints[Keypoint.L_SHOULDER][0] - keypoints[Keypoint.R_SHOULDER][0]
            )

        if not shoulder_width or shoulder_width < 1e-6:
            upper_arm = np.linalg.norm(
                self.get_point(keypoints, shoulder_idx) - self.get_point(keypoints, elbow_idx)
            )
            shoulder_width = max(float(upper_arm), 1e-6)

        # Elbow stability is about how much the elbow moves during the curl,
        # not its absolute position relative to the shoulder. A natural side
        # view or arm build can place the elbow away from the shoulder line and
        # previously caused almost every curl to score ~2/20.
        elbow_offset = (
            keypoints[elbow_idx][0] - keypoints[shoulder_idx][0]
        ) / shoulder_width
        if (
            self.active_side not in self._baseline_elbow_offsets
            or elbow_angle >= BICEP_CURL_PARAMS["elbow_angle_down"] - 15
        ):
            self._baseline_elbow_offsets[self.active_side] = float(elbow_offset)

        baseline_offset = self._baseline_elbow_offsets[self.active_side]
        drift = abs(float(elbow_offset) - baseline_offset)
        metrics.ratios["elbow_drift"] = float(drift)
        metrics.ratios["elbow_offset"] = float(elbow_offset)
        metrics.ratios["torso_sway"] = 0.0

        if drift > BICEP_CURL_PARAMS["elbow_drift_max"]:
            metrics.issues.append("Elbow drifting - keep it pinned near your torso")

        return metrics
