"""
Squat form analysis
"""
import numpy as np
import math
from typing import Tuple, Dict, List
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import SQUAT_PARAMS


class SquatAnalyzer(FormChecker):
    """Analyzes squat form"""
    
    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        """
        Analyze squat form
        
        Args:
            keypoints: Pose keypoints array (17, 3)
            
        Returns:
            FormMetrics with angles, ratios, and issues
        """
        metrics = FormMetrics()
        
        # Check required keypoints visibility
        required = [Keypoint.L_HIP, Keypoint.R_HIP, Keypoint.L_KNEE, 
                   Keypoint.R_KNEE, Keypoint.L_ANKLE, Keypoint.R_ANKLE]
        
        if not self.check_visibility(keypoints, required):
            metrics.issues.append("Body not fully visible")
            return metrics
        
        # Calculate knee angles
        left_knee_angle = self.calculate_joint_angle(
            keypoints, Keypoint.L_KNEE, Keypoint.L_HIP, Keypoint.L_ANKLE
        )
        right_knee_angle = self.calculate_joint_angle(
            keypoints, Keypoint.R_KNEE, Keypoint.R_HIP, Keypoint.R_ANKLE
        )
        
        metrics.angles['left_knee'] = left_knee_angle
        metrics.angles['right_knee'] = right_knee_angle
        
        # Calculate depth
        hip_y = (keypoints[Keypoint.L_HIP][1] + keypoints[Keypoint.R_HIP][1]) / 2
        knee_y = (keypoints[Keypoint.L_KNEE][1] + keypoints[Keypoint.R_KNEE][1]) / 2
        shoulder_y = (keypoints[Keypoint.L_SHOULDER][1] + keypoints[Keypoint.R_SHOULDER][1]) / 2
        
        torso_length = abs(hip_y - shoulder_y)
        if torso_length > 1e-6:
            depth_ratio = (knee_y - hip_y) / torso_length
            metrics.ratios['depth'] = depth_ratio
            
            if depth_ratio > SQUAT_PARAMS['depth_threshold_parallel']:
                metrics.issues.append("Squat depth insufficient - go lower")
        
        # Check knee alignment
        knee_distance = abs(keypoints[Keypoint.L_KNEE][0] - keypoints[Keypoint.R_KNEE][0])
        hip_distance = abs(keypoints[Keypoint.L_HIP][0] - keypoints[Keypoint.R_HIP][0])
        
        if knee_distance > 0 and hip_distance > 0:
            knee_hip_ratio = knee_distance / hip_distance
            metrics.ratios['knee_alignment'] = knee_hip_ratio
            
            if knee_hip_ratio < SQUAT_PARAMS['knee_alignment_min']:
                metrics.issues.append("Knees caving inward - push knees out")
        
        # Check torso angle
        if self.check_visibility(keypoints, [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER]):
            mid_shoulder = (self.get_point(keypoints, Keypoint.L_SHOULDER) + 
                          self.get_point(keypoints, Keypoint.R_SHOULDER)) / 2
            mid_hip = (self.get_point(keypoints, Keypoint.L_HIP) + 
                      self.get_point(keypoints, Keypoint.R_HIP)) / 2
            
            torso_angle = math.degrees(math.atan2(
                mid_hip[1] - mid_shoulder[1],
                mid_hip[0] - mid_shoulder[0]
            ))
            metrics.angles['torso'] = abs(torso_angle)
            
            if abs(torso_angle) > SQUAT_PARAMS['torso_angle_max']:
                metrics.issues.append("Leaning too far forward - keep chest up")
        
        return metrics