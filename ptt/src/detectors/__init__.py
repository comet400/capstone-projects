"""
Pose detection module
"""
from .base_detector import BaseDetector
from .yolo_detector import YOLODetector

__all__ = ['BaseDetector', 'YOLODetector']