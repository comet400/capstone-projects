"""
UCoach - Exercise Video Analysis System
"""
from .core import PoseDetector, VideoProcessor
from .detectors import YOLODetector
from .analyzers import SquatAnalyzer, PushupAnalyzer, PullupAnalyzer
from .counters import RepCounter
from .utils import ExerciseType, ExerciseAnalysis, RepData, ReportFormatter

__version__ = "1.0.0"

__all__ = [
    'PoseDetector',
    'VideoProcessor',
    'YOLODetector',
    'SquatAnalyzer',
    'PushupAnalyzer',
    'PullupAnalyzer',
    'RepCounter',
    'ExerciseType',
    'ExerciseAnalysis',
    'RepData',
    'ReportFormatter',
]