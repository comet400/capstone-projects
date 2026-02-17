"""
Bicep curl form analysis
"""
import numpy as np
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import BICEP_CURL_PARAMS


class BicepCurlAnalyzer(FormChecker):
    """Analyzes bicep curl form"""

    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        metrics = FormMetrics()

        required = [
            Keypoint.L_SHOULDER, Keypoint.R_SHOULDER,
            Keypoint.L_ELBOW, Keypoint.R_ELBOW,
            Keypoint.L_WRIST, Keypoint.R_WRIST
        ]

        if not self.check_visibility(keypoints, required):
            metrics.issues.append("Arms not fully visible")
            return metrics

        # Elbow flexion angle
        left_elbow = self.calculate_joint_angle(
            keypoints, Keypoint.L_ELBOW, Keypoint.L_SHOULDER, Keypoint.L_WRIST
        )
        right_elbow = self.calculate_joint_angle(
            keypoints, Keypoint.R_ELBOW, Keypoint.R_SHOULDER, Keypoint.R_WRIST
        )

        avg_angle = (left_elbow + right_elbow) / 2

        metrics.angles['avg_elbow'] = avg_angle

        if avg_angle > BICEP_CURL_PARAMS['min_contraction_angle']:
            metrics.issues.append("Curl higher - full contraction needed")

        # Elbow drift (should stay near torso)
        left_drift = abs(keypoints[Keypoint.L_ELBOW][0] - keypoints[Keypoint.L_SHOULDER][0])
        right_drift = abs(keypoints[Keypoint.R_ELBOW][0] - keypoints[Keypoint.R_SHOULDER][0])

        drift = (left_drift + right_drift) / 2
        metrics.ratios['elbow_drift'] = drift

        if drift > BICEP_CURL_PARAMS['elbow_drift_max']:
            metrics.issues.append("Elbows drifting forward - keep them pinned")

        return metrics
