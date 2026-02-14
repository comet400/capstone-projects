"""
Configuration module for UCoach
"""
from .thresholds import (
    POSE_CONFIDENCE_THRESHOLD,
    KEYPOINT_CONFIDENCE_THRESHOLD,
    ISSUE_RULES,
    COMMON_ISSUE_THRESHOLD,
)
from .exercise_params import get_exercise_params, EXERCISE_PARAMS

__all__ = [
    'POSE_CONFIDENCE_THRESHOLD',
    'KEYPOINT_CONFIDENCE_THRESHOLD',
    'ISSUE_RULES',
    'COMMON_ISSUE_THRESHOLD',
    'get_exercise_params',
    'EXERCISE_PARAMS',
]