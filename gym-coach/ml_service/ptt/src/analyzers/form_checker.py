"""
Form analysis for exercises
"""
import numpy as np
from typing import Tuple, Dict, List
from ..utils.keypoints import Keypoint
from ..utils.geometry import calculate_angle
from ..utils.models import FormMetrics
from ...config import KEYPOINT_CONFIDENCE_THRESHOLD


class FormChecker:
    """Base form checker with common utilities"""
    
    def __init__(self, conf_threshold: float = KEYPOINT_CONFIDENCE_THRESHOLD):
        self.conf_threshold = conf_threshold
    
    def check_visibility(self, keypoints: np.ndarray, required_indices: List[int]) -> bool:
        """Check if required keypoints are visible"""
        for idx in required_indices:
            if keypoints[idx][2] < self.conf_threshold:
                return False
        return True
    
    def get_point(self, keypoints: np.ndarray, index: int) -> np.ndarray:
        """Get a keypoint's x, y coordinates"""
        return keypoints[index][:2]
    
    def calculate_joint_angle(self, keypoints: np.ndarray, 
                             joint_idx: int, prev_idx: int, next_idx: int) -> float:
        """Calculate angle at a joint"""
        p1 = self.get_point(keypoints, prev_idx)
        p2 = self.get_point(keypoints, joint_idx)
        p3 = self.get_point(keypoints, next_idx)
        return calculate_angle(p1, p2, p3)