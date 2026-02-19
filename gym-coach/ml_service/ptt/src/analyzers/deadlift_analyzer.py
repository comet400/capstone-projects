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

        # Back angle
        mid_shoulder = (
            self.get_point(keypoints, Keypoint.L_SHOULDER) +
            self.get_point(keypoints, Keypoint.R_SHOULDER)
        ) / 2

        mid_hip = (
            self.get_point(keypoints, Keypoint.L_HIP) +
            self.get_point(keypoints, Keypoint.R_HIP)
        ) / 2

        torso_angle = math.degrees(math.atan2(
            mid_hip[1] - mid_shoulder[1],
            mid_hip[0] - mid_shoulder[0]
        ))

        metrics.angles['torso'] = abs(torso_angle)

        if abs(torso_angle) > DEADLIFT_PARAMS['torso_angle_max']:
            metrics.issues.append("Back rounding - maintain neutral spine")

        # Hip hinge ratio
        hip_y = mid_hip[1]
        knee_y = (keypoints[Keypoint.L_KNEE][1] + keypoints[Keypoint.R_KNEE][1]) / 2
        ankle_y = (keypoints[Keypoint.L_ANKLE][1] + keypoints[Keypoint.R_ANKLE][1]) / 2

        total_leg_length = abs(hip_y - ankle_y)
        if total_leg_length > 1e-6:
            hinge_ratio = abs(knee_y - hip_y) / total_leg_length
            metrics.ratios['hinge'] = hinge_ratio

            if hinge_ratio < DEADLIFT_PARAMS['hip_hinge_min']:
                metrics.issues.append("Not enough hip hinge - push hips back")

        return metrics
