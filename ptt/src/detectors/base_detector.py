"""
Base detector interface for pose detection
"""
from abc import ABC, abstractmethod
import numpy as np
from typing import Optional


class BaseDetector(ABC):
    """Abstract base class for pose detectors"""
    
    @abstractmethod
    def detect(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Detect pose keypoints in a frame
        
        Args:
            frame: Input image frame
            
        Returns:
            Keypoints array (17, 3) with x, y, confidence or None if no detection
        """
        pass
    
    @abstractmethod
    def get_confidence_threshold(self) -> float:
        """Get the confidence threshold for detections"""
        pass
    
    @abstractmethod
    def set_confidence_threshold(self, threshold: float):
        """Set the confidence threshold for detections"""
        pass