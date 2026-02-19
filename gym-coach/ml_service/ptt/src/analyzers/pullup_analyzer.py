"""
Pull-up form analysis
"""
import numpy as np
from typing import Tuple, Dict, List
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import PULLUP_PARAMS


class PullupAnalyzer(FormChecker):
    """Analyzes pull-up form"""
    
    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        """
        Analyze pull-up form
        
        Args:
            keypoints: Pose keypoints array (17, 3)
            
        Returns:
            FormMetrics with angles, ratios, and issues
        """
        metrics = FormMetrics()
        
        # Check required keypoints
        required = [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER,
                   Keypoint.L_ELBOW, Keypoint.R_ELBOW]
        
        if not self.check_visibility(keypoints, required):
            metrics.issues.append("Upper body not fully visible")
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
        
        # Check chin clearance
        if self.check_visibility(keypoints, [Keypoint.NOSE, Keypoint.L_WRIST, Keypoint.R_WRIST]):
            mid_wrist_y = (keypoints[Keypoint.L_WRIST][1] + keypoints[Keypoint.R_WRIST][1]) / 2
            nose_y = keypoints[Keypoint.NOSE][1]
            
            clearance = mid_wrist_y - nose_y
            metrics.positions['chin_clearance'] = clearance
            
            if clearance < 0:
                metrics.ratios['full_rom'] = 1.0
            else:
                metrics.ratios['full_rom'] = 0.0
                metrics.issues.append("Pull higher - chin should clear the bar")
        
        # Check body swing
        if self.check_visibility(keypoints, [Keypoint.L_HIP, Keypoint.R_HIP]):
            mid_shoulder = (self.get_point(keypoints, Keypoint.L_SHOULDER) + 
                          self.get_point(keypoints, Keypoint.R_SHOULDER)) / 2
            mid_hip = (self.get_point(keypoints, Keypoint.L_HIP) + 
                      self.get_point(keypoints, Keypoint.R_HIP)) / 2
            
            horizontal_offset = abs(mid_hip[0] - mid_shoulder[0])
            vertical_distance = abs(mid_hip[1] - mid_shoulder[1])
            
            if vertical_distance > 1e-6:
                swing_ratio = horizontal_offset / vertical_distance
                metrics.ratios['body_swing'] = swing_ratio
                
                if swing_ratio > PULLUP_PARAMS['body_swing_max']:
                    metrics.issues.append("Excessive body swing - control the movement")
        
        return metrics