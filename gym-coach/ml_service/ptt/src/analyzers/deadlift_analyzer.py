"""
Deadlift form analysis
"""
import numpy as np
import math
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import DEADLIFT_PARAMS


class DeadliftAnalyzer(FormChecker):
    """Analyzes deadlift form"""

    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        metrics = FormMetrics()

        required = [
            Keypoint.L_SHOULDER, Keypoint.R_SHOULDER,
            Keypoint.L_HIP, Keypoint.R_HIP,
            Keypoint.L_KNEE, Keypoint.R_KNEE,
            Keypoint.L_ANKLE, Keypoint.R_ANKLE
        ]

        if not self.check_visibility(keypoints, required):
            metrics.issues.append("Lower body not fully visible")
            return metrics

        # Torso lean from vertical. This keeps the value in the same range as
        # the deadlift grading thresholds instead of returning ~90-180 degrees
        # for normal upright positions.
        mid_shoulder = (
            self.get_point(keypoints, Keypoint.L_SHOULDER) +
            self.get_point(keypoints, Keypoint.R_SHOULDER)
        ) / 2

        mid_hip = (
            self.get_point(keypoints, Keypoint.L_HIP) +
            self.get_point(keypoints, Keypoint.R_HIP)
        ) / 2

        dx = float(mid_shoulder[0] - mid_hip[0])
        dy = float(mid_hip[1] - mid_shoulder[1])
        torso_angle = abs(math.degrees(math.atan2(abs(dx), max(abs(dy), 1e-6))))

        metrics.angles["torso_angle"] = float(torso_angle)

        if torso_angle > DEADLIFT_PARAMS["back_round_max"]:
            metrics.issues.append("Back rounding - maintain neutral spine")

        left_hip_angle = self.calculate_joint_angle(
            keypoints, Keypoint.L_HIP, Keypoint.L_SHOULDER, Keypoint.L_KNEE
        )
        right_hip_angle = self.calculate_joint_angle(
            keypoints, Keypoint.R_HIP, Keypoint.R_SHOULDER, Keypoint.R_KNEE
        )
        hip_angle = float((left_hip_angle + right_hip_angle) / 2)

        metrics.angles["hip_angle"] = hip_angle
        metrics.angles["top_hip_angle"] = hip_angle

        left_knee_angle = self.calculate_joint_angle(
            keypoints, Keypoint.L_KNEE, Keypoint.L_HIP, Keypoint.L_ANKLE
        )
        right_knee_angle = self.calculate_joint_angle(
            keypoints, Keypoint.R_KNEE, Keypoint.R_HIP, Keypoint.R_ANKLE
        )
        avg_knee_angle = float((left_knee_angle + right_knee_angle) / 2)
        metrics.angles["avg_knee"] = avg_knee_angle

        # Phase/counting uses hip_angle. These supporting ratios feed the
        # dynamic grading criteria for bar path and symmetry.
        hip_width = abs(keypoints[Keypoint.L_HIP][0] - keypoints[Keypoint.R_HIP][0])
        hip_width = max(float(hip_width), 1e-6)

        bar_distances = []
        if self.check_visibility(keypoints, [Keypoint.L_WRIST, Keypoint.L_ANKLE]):
            bar_distances.append(
                abs(keypoints[Keypoint.L_WRIST][0] - keypoints[Keypoint.L_ANKLE][0]) / hip_width
            )
        if self.check_visibility(keypoints, [Keypoint.R_WRIST, Keypoint.R_ANKLE]):
            bar_distances.append(
                abs(keypoints[Keypoint.R_WRIST][0] - keypoints[Keypoint.R_ANKLE][0]) / hip_width
            )

        metrics.ratios["bar_proximity"] = (
            float(sum(bar_distances) / len(bar_distances)) if bar_distances else 0.10
        )
        metrics.ratios["asymmetry"] = float(abs(left_hip_angle - right_hip_angle) / 180.0)

        hip_y = mid_hip[1]
        knee_y = (keypoints[Keypoint.L_KNEE][1] + keypoints[Keypoint.R_KNEE][1]) / 2
        ankle_y = (keypoints[Keypoint.L_ANKLE][1] + keypoints[Keypoint.R_ANKLE][1]) / 2

        total_leg_length = abs(hip_y - ankle_y)
        if total_leg_length > 1e-6:
            hinge_ratio = abs(knee_y - hip_y) / total_leg_length
            metrics.ratios["hinge"] = float(hinge_ratio)

        if avg_knee_angle < DEADLIFT_PARAMS["knee_bend_max"]:
            metrics.issues.append("Too much knee bend - hinge at the hips")

        if metrics.ratios["bar_proximity"] > DEADLIFT_PARAMS["bar_proximity_max"]:
            metrics.issues.append("Keep the bar close to your legs")

        if metrics.ratios["asymmetry"] > DEADLIFT_PARAMS["asymmetry_max"]:
            metrics.issues.append("Pull evenly through both sides")

        return metrics
