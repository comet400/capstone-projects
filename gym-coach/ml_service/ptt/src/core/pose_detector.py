"""
High-level pose detection interface
"""
from ..detectors.yolo_detector import YOLODetector
from ..detectors.base_detector import BaseDetector


class PoseDetector:
    """Facade for pose detection"""
    
    @staticmethod
    def create_detector(model_type: str = "yolo", **kwargs) -> BaseDetector:
        """
        Factory method to create pose detectors
        
        Args:
            model_type: Type of detector ("yolo")
            **kwargs: Arguments passed to detector constructor
            
        Returns:
            BaseDetector instance
        """
        if model_type.lower() == "yolo":
            return YOLODetector(**kwargs)
        else:
            raise ValueError(f"Unknown detector type: {model_type}")