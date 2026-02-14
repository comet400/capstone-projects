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
    "elbow_angle_up": 105,   # was 90
    "elbow_angle_down": 155, # slightly relaxed
    "body_swing_max": 0.4,   # slightly more tolerant
}


# -----------------------------
# UPPER BODY - ISOLATION
# -----------------------------

BICEP_CURL_PARAMS = {
    "elbow_angle_up": 60,      # peak contraction
    "elbow_angle_down": 160,   # full extension
    "shoulder_movement_max": 0.15,  # prevent swinging
}

LATERAL_RAISE_PARAMS = {
    "shoulder_angle_up": 85,   # near parallel
    "shoulder_angle_down": 20, # resting position
    "torso_sway_max": 0.2,
}

SHOULDER_PRESS_PARAMS = {
    "elbow_angle_down": 90,
    "elbow_angle_up": 170,
    "wrist_over_shoulder_min": 0.4,
    "back_arch_max": 45,
}

# -----------------------------
# COMPOUND UPPER
# -----------------------------

DIP_PARAMS = {
    "elbow_angle_down": 85,
    "elbow_angle_up": 160,
    "shoulder_depth_min": 0.25,
    "body_swing_max": 0.25,
}

BENCH_PRESS_PARAMS = {
    "elbow_angle_down": 85,
    "elbow_angle_up": 165,
    "bar_path_verticality_min": 0.5,
    "shoulder_stability_max": 0.2,
}

# -----------------------------
# LOWER BODY
# -----------------------------

DEADLIFT_PARAMS = {
    "hip_angle_down": 65,       # hinge depth
    "hip_angle_up": 170,
    "knee_bend_max": 110,       # prevent squat-style DL
    "back_round_max": 40,
}

# -----------------------------
# CORE
# -----------------------------

SITUP_PARAMS = {
    "torso_angle_up": 40,      # upright position
    "torso_angle_down": 150,   # lying flat
    "hip_stability_max": 0.2,
}


EXERCISE_PARAMS = {
    "squat": SQUAT_PARAMS,
    "pushup": PUSHUP_PARAMS,
    "pullup": PULLUP_PARAMS,
    "bicep_curl": BICEP_CURL_PARAMS,
    "lateral_raise": LATERAL_RAISE_PARAMS,
    "shoulder_press": SHOULDER_PRESS_PARAMS,
    "dip": DIP_PARAMS,
    "deadlift": DEADLIFT_PARAMS,
    "situp": SITUP_PARAMS,
    "bench_press": BENCH_PRESS_PARAMS,
}

def get_exercise_params(exercise_type: str) -> dict:
    """Get parameters for a specific exercise"""
    return EXERCISE_PARAMS.get(exercise_type.lower(), {})