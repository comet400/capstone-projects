"""
Push-up form analysis
"""
import numpy as np
from typing import Tuple, Dict, List
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import PUSHUP_PARAMS


class PushupAnalyzer(FormChecker):
    """Analyzes push-up form"""
    
    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        """
        Analyze push-up form
        
        Args:
            keypoints: Pose keypoints array (17, 3)
            
        Returns:
            FormMetrics with angles, ratios, and issues
        """
        metrics = FormMetrics()
        
        # Check required keypoints
        required = [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER, 
                   Keypoint.L_ELBOW, Keypoint.R_ELBOW,
                   Keypoint.L_HIP, Keypoint.R_HIP]
        
        if not self.check_visibility(keypoints, required):
            metrics.issues.append("Body not fully visible")
            return metrics
        
        # Calculate elbow angles
        left_elbow = self.calculate_joint_angle(
            keypoints, Keypoint.L_ELBOW, Keypoint.L_SHOULDER, Keypoint.L_WRIST
        )
        right_elbow = self.calculate_joint_angle(
            keypoints, Keypoint.R_ELBOW, Keypoint.R_SHOULDER, Keypoint.R_WRIST
        )
        
        metrics.angles['left_elbow'] = left_elbow
        metrics.angles['right_elbow'] = right_elbow
        metrics.angles['avg_elbow'] = (left_elbow + right_elbow) / 2
        
        # Check body alignment
        mid_shoulder = (self.get_point(keypoints, Keypoint.L_SHOULDER) + 
                       self.get_point(keypoints, Keypoint.R_SHOULDER)) / 2
        mid_hip = (self.get_point(keypoints, Keypoint.L_HIP) + 
                  self.get_point(keypoints, Keypoint.R_HIP)) / 2
        
        shoulder_hip_distance = np.linalg.norm(mid_shoulder - mid_hip)
        
        if shoulder_hip_distance > 1e-6:
            vertical_diff = abs(mid_shoulder[1] - mid_hip[1])
            alignment_ratio = vertical_diff / shoulder_hip_distance
            metrics.ratios['body_alignment'] = alignment_ratio
            
            if alignment_ratio < PUSHUP_PARAMS['body_alignment_min']:
                if mid_hip[1] > mid_shoulder[1]:
                    metrics.issues.append("Hips sagging - engage core")
                else:
                    metrics.issues.append("Hips too high - lower them")
        
        # Check elbow flare
        if self.check_visibility(keypoints, [Keypoint.L_WRIST, Keypoint.R_WRIST]):
            elbow_width = abs(keypoints[Keypoint.L_ELBOW][0] - keypoints[Keypoint.R_ELBOW][0])
            shoulder_width = abs(keypoints[Keypoint.L_SHOULDER][0] - keypoints[Keypoint.R_SHOULDER][0])
            
            if elbow_width > 0 and shoulder_width > 0:
                flare_ratio = elbow_width / shoulder_width
                metrics.ratios['elbow_flare'] = flare_ratio
                
                if flare_ratio > PUSHUP_PARAMS['elbow_flare_max']:
                    metrics.issues.append("Elbows flaring too wide - tuck them in")
        
        return metrics