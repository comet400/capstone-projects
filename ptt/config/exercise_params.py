"""
Exercise-specific parameters and configurations
"""

SQUAT_PARAMS = {
    "depth_threshold_parallel": 0.60,
    "depth_threshold_deep": 0.45,
    "knee_alignment_min": 0.3,
    "torso_angle_max": 50,
    "rep_up_threshold": 0.70
}


PUSHUP_PARAMS = {
    "elbow_angle_down": 120,  
    "elbow_angle_up": 150,  
    "body_alignment_min": 0.5,  
    "elbow_flare_max": 1.6, 
}

PULLUP_PARAMS = {
    "elbow_angle_up": 90,
    "elbow_angle_down": 160,
    "body_swing_max": 0.3,
}

EXERCISE_PARAMS = {
    "squat": SQUAT_PARAMS,
    "pushup": PUSHUP_PARAMS,
    "pullup": PULLUP_PARAMS,
}


def get_exercise_params(exercise_type: str) -> dict:
    """Get parameters for a specific exercise"""
    return EXERCISE_PARAMS.get(exercise_type.lower(), {})