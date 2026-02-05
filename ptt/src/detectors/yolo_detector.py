"""
YOLO-based pose detector implementation
"""
import numpy as np
from typing import Optional
from ultralytics import YOLO
from .base_detector import BaseDetector
from ...config import POSE_CONFIDENCE_THRESHOLD


class YOLODetector(BaseDetector):
    """YOLO pose detection implementation"""
    
    def __init__(self, model_path: str = "yolov8n-pose.pt", conf_threshold: float = POSE_CONFIDENCE_THRESHOLD):
        """
        Initialize YOLO detector
        
        Args:
            model_path: Path to YOLO model weights
            conf_threshold: Confidence threshold for detections
        """
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold
    
    def detect(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Detect pose keypoints using YOLO
        
        Args:
            frame: Input BGR image
            
        Returns:
            Keypoints array (17, 3) or None
        """
        results = self.model.predict(frame, conf=self.conf_threshold, verbose=False)[0]
        
        if not results.keypoints or results.keypoints.xy is None:
            return None
        
        xy = results.keypoints.xy.cpu().numpy()
        conf = results.keypoints.conf.cpu().numpy()
        
        if len(xy) == 0:
            return None
        
        # Get best detection (highest average confidence)
        best_idx = np.argmax(conf.mean(axis=1))
        
        # Build keypoint array (17 keypoints x 3: x, y, confidence)
        keypoints = np.zeros((17, 3), dtype=np.float32)
        keypoints[:, :2] = xy[best_idx]
        keypoints[:, 2] = conf[best_idx]
        
        return keypoints
    
    def get_confidence_threshold(self) -> float:
        """Get current confidence threshold"""
        return self.conf_threshold
    
    def set_confidence_threshold(self, threshold: float):
        """Set confidence threshold"""
        if 0.0 <= threshold <= 1.0:
            self.conf_threshold = threshold
        else:
            raise ValueError("Threshold must be between 0 and 1")